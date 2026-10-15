"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "./auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUserProfile() {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      include: {
        accounts: true
      }
    });

    if (!user) return null;

    const mainAccount = user.accounts && user.accounts[0];

    return {
      id: user.id,
      nombres: user.nombres,
      apellidoPaterno: user.apellidoPaterno,
      apellidoMaterno: user.apellidoMaterno,
      curp: user.curp,
      fechaNacimiento: user.fechaNacimiento,
      celular: user.celular,
      direccion: user.direccion,
      correo: user.correo,
      isActive: user.isActive,
      balance: mainAccount ? parseFloat(mainAccount.balance.toString()) : 0
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "No autorizado." };

  try {
    const nombres = formData.get("nombres") as string;
    const apellidoPaterno = formData.get("apellidoPaterno") as string;
    const apellidoMaterno = formData.get("apellidoMaterno") as string;
    const fechaNacimiento = formData.get("fechaNacimiento") as string;
    const celular = formData.get("celular") as string;
    const direccion = formData.get("direccion") as string;
    const nuevaContrasena = formData.get("nuevaContrasena") as string;
    const confirmarContrasena = formData.get("confirmarContrasena") as string;

    // Build the data object to update
    const updateData: any = {
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento: new Date(fechaNacimiento),
      celular,
      direccion,
    };

    // If user provided a new password, validate and hash it
    if (nuevaContrasena) {
      if (nuevaContrasena !== confirmarContrasena) {
        return { error: "Las contraseñas nuevas no coinciden." };
      }
      if (nuevaContrasena.length < 6) {
        return { error: "La nueva contraseña debe tener al menos 6 caracteres." };
      }
      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
      updateData.password = hashedPassword;
    }

    await prisma.user.update({
      where: { id: session.userId as string },
      data: updateData
    });

    return { success: true, message: "Perfil actualizado exitosamente." };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { error: "Ocurrió un error al actualizar el perfil." };
  }
}

export async function getUserTransactions() {
  const session = await getSession();
  if (!session) return { error: "No autorizado." };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      include: { accounts: true }
    });

    if (!user || !user.accounts || user.accounts.length === 0) {
      return { success: true, transactions: [] };
    }

    const mainAccount = user.accounts[0];
    const transactions = await prisma.transaction.findMany({
      where: { accountId: mainAccount.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const serialized = transactions.map((t: any) => ({
      id: t.id,
      amount: parseFloat(t.amount.toString()),
      type: t.type,
      status: t.status,
      destinationName: t.destinationName,
      destinationBank: t.destinationBank,
      createdAt: t.createdAt.toISOString()
    }));

    console.log(`[DEBUG] Transacciones encontradas para usuario ${session.userId}: ${serialized.length}`);
    return { success: true, transactions: serialized };
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return { error: "Error al obtener movimientos." };
  }
}

export async function createTransfer(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "No autorizado." };

  try {
    const amountStr = formData.get("amount") as string;
    const destinoBeneficiario = formData.get("beneficiario") as string;
    const destinoBanco = formData.get("banco") as string;
    const destinoClabe = formData.get("clabe") as string;
    const description = formData.get("descripcion") as string;

    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount <= 0) {
      return { error: "El monto a transferir es inválido." };
    }

    if (!destinoBeneficiario || !destinoBanco || !destinoClabe) {
      return { error: "Datos incompletos para la transferencia." };
    }

    if (destinoClabe.length !== 18) {
      return { error: "La CLABE debe tener exactamente 18 dígitos." };
    }

    // Wrap the transaction logic properly
    const result = await prisma.$transaction(async (tx) => {
      // Find the user and main account
      const user = await tx.user.findUnique({
        where: { id: session.userId as string },
        include: { accounts: true }
      });
      
      if (!user) throw new Error("USER_NOT_FOUND");
      if (!user.isActive) throw new Error("ACCOUNT_INACTIVE");

      const account = user.accounts[0];
      if (!account) throw new Error("ACCOUNT_NOT_FOUND");

      const balanceNumber = parseFloat(account.balance.toString());
      if (balanceNumber < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct funds immediately
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: { decrement: amount }
        }
      });

      // Create transaction record as PENDING
      await tx.transaction.create({
        data: {
          accountId: account.id,
          amount: amount,
          type: "TRANSFER",
          status: "PENDING",
          destinationName: destinoBeneficiario,
          destinationBank: destinoBanco,
          destinationClabe: destinoClabe,
          description: description || null
        }
      });

      return { success: true };
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true, message: "Transferencia solicitada y en estado Pendiente." };

  } catch (error: any) {
    if (error.message === "INSUFFICIENT_FUNDS") return { error: "Saldo insuficiente para realizar esta transferencia." };
    if (error.message === "ACCOUNT_INACTIVE") return { error: "Tu cuenta se encuentra desactivada." };
    
    console.error("Error creating transfer:", error);
    return { error: "Ocurrió un error al procesar la transferencia." };
  }
}

