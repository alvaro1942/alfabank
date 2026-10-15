"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { getSessionSecret } from "@/lib/session-secret";

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { correo },
    });
    if (existingUser) return { error: "Este correo electrónico ya está registrado.", field: "correo" };

    const existingCurp = await prisma.user.findUnique({
      where: { curp },
    });
    if (existingCurp) return { error: "Esta CURP ya está registrada.", field: "curp" };

    // Save File
    let inexFileName = null;
    if (ineFile && ineFile.size > 0) {
      const blob = await put(`identifications/${Date.now()}_${ineFile.name.replaceAll(" ", "_")}`, ineFile, {
        access: 'private',
      });
      inexFileName = blob.url;
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

    return { success: true, message: "Cuenta creada exitosamente" };
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

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return { error: "Credenciales incorrectas." };

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
    return payload;
  } catch (error) {
    return null;
  }
}
