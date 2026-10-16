"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { getSessionSecret } from "@/lib/session-secret";
import { ID_FILE_MAX_BYTES, ID_FILE_TYPES, LOCKOUT_MINUTES, MAX_FAILED_LOGINS, MIN_PASSWORD_LENGTH } from "@/lib/security";

const secretKey = getSessionSecret();

export async function registerUser(formData: FormData) {
  try {
    const nombres = formData.get("nombres") as string;
    const apellidoPaterno = formData.get("apellidoPaterno") as string;
    const apellidoMaterno = formData.get("apellidoMaterno") as string;
    const fechaNacimiento = formData.get("fechaNacimiento") as string;
    const curp = formData.get("curp") as string;
    const celular = formData.get("celular") as string;
    const correo = formData.get("correo") as string;
    const confirmarCorreo = formData.get("confirmarCorreo") as string;
    const direccion = formData.get("direccion") as string;
    const password = formData.get("password") as string;
    const confirmarPassword = formData.get("confirmarPassword") as string;

    const ineFile = formData.get("ineFile") as File;

    // Server-side validation
    if (correo !== confirmarCorreo) return { error: "Los correos no coinciden.", field: "confirmarCorreo" };
    if (password !== confirmarPassword) return { error: "Las contraseñas no coinciden.", field: "confirmarPassword" };
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`, field: "password" };
    }

    const hasIneFile = ineFile instanceof File && ineFile.size > 0;
    if (!hasIneFile) {
      return { error: "La identificación oficial (INE) es obligatoria.", field: "ineFile" };
    }
    if (!ID_FILE_TYPES[ineFile.type]) {
      return { error: "La identificación debe ser una imagen (JPG, PNG, WEBP) o un PDF.", field: "ineFile" };
    }
    if (ineFile.size > ID_FILE_MAX_BYTES) {
      return { error: "El archivo es demasiado pesado. El máximo permitido es 4MB.", field: "ineFile" };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { correo },
    });
    if (existingUser) return { error: "Este correo electrónico ya está registrado.", field: "correo" };

    const existingCurp = await prisma.user.findUnique({
      where: { curp },
    });
    if (existingCurp) return { error: "Esta CURP ya está registrada.", field: "curp" };

    // Save File: la identificación es opcional, un fallo del almacenamiento no debe impedir el registro
    let inexFileName: string | null = null;
    let idUploadFailed = false;
    if (hasIneFile) {
      try {
        const blob = await put(`identifications/${Date.now()}_${crypto.randomUUID()}.${ID_FILE_TYPES[ineFile.type]}`, ineFile, {
          access: 'private',
        });
        inexFileName = blob.url;
      } catch (uploadError) {
        console.error("Error uploading identification: ", uploadError);
        idUploadFailed = true;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save in database
    await prisma.user.create({
      data: {
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        fechaNacimiento: new Date(fechaNacimiento),
        curp,
        celular,
        correo,
        direccion,
        password: hashedPassword,
        ineFileName: inexFileName,
      },
    });

    return {
      success: true,
      message: idUploadFailed
        ? "Cuenta creada exitosamente. No se pudo guardar la identificación; podrás entregarla después."
        : "Cuenta creada exitosamente",
    };
  } catch (error) {
    console.error("Error registering user: ", error);
    return { error: "Ocurrió un error al registrar el usuario, intenta de nuevo." };
  }
}

export async function loginUser(formData: FormData) {
  try {
    const correo = formData.get("correo") as string;
    const password = formData.get("password") as string;

    if (!correo || !password) return { error: "Por favor, ingresa tu correo y contraseña." };

    const user = await prisma.user.findUnique({
      where: { correo },
    });

    if (!user) return { error: "Credenciales incorrectas." };
    if (!user.isActive) return { error: "Esta cuenta ha sido desactivada." };

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { error: "Demasiados intentos fallidos. Inténtalo de nuevo en unos minutos." };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Si el bloqueo anterior ya venció, el conteo empieza de cero
      const failedLogins = (user.lockedUntil ? 0 : user.failedLogins) + 1;
      const lock = failedLogins >= MAX_FAILED_LOGINS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: lock ? 0 : failedLogins,
          lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
        },
      });
      return { error: "Credenciales incorrectas." };
    }

    if (user.failedLogins > 0 || user.lockedUntil) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    }

    const token = await new SignJWT({ userId: user.id, email: user.correo, nombre: user.nombres, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secretKey);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Error logging in: ", error);
    return { error: "Ocurrió un error al iniciar sesión." };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, secretKey);

    // El token por sí solo no basta: si la cuenta se desactivó o se eliminó, la sesión deja de valer
    // y el rol se toma de la base de datos, no del token.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { isActive: true, role: true },
    });
    if (!user || !user.isActive) return null;

    return { ...payload, userId: payload.userId as string, email: payload.email as string, nombre: payload.nombre as string, role: user.role };
  } catch {
    return null;
  }
}
