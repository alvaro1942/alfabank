"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Check if user is admin
async function isAdmin() {
  const session = await getSession();
  if (!session) return false;
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { role: true }
  });
  
  return user?.role === "ADMIN";
}

export async function getAllUsers() {
  if (!(await isAdmin())) return { error: "No autorizado." };
  
  try {
    const users = await prisma.user.findMany({
      include: { accounts: true },
      orderBy: { createdAt: 'desc' }
    });
    const mappedUsers = users.map((u: any) => {
      const mainAccount = u.accounts[0];
      const { accounts, password, ...userRest } = u; // nunca enviar el hash al navegador
      return {
        ...userRest,
        balance: mainAccount ? parseFloat(mainAccount.balance.toString()) : 0
      };
    });
    return { success: true, users: mappedUsers };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Error al obtener usuarios." };
  }
}

export async function getAllAccountsTransactions() {
  if (!(await isAdmin())) return { error: "No autorizado." };
  
  try {
    const usersWithAccounts = await prisma.user.findMany({
      include: {
        accounts: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Map to an easy layout: one account per user or 0
    const accountsInfo = usersWithAccounts.map((u: any) => {
      const mainAccount = u.accounts[0]; // Assuming 1 account per user right now
      return {
        userId: u.id,
        nombres: u.nombres,
        apellidoPaterno: u.apellidoPaterno,
        correo: u.correo,
        accountId: mainAccount?.id || null,
        balance: mainAccount ? parseFloat(mainAccount.balance.toString()) : 0
      };
    });
    
    return { success: true, accounts: accountsInfo };
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return { error: "Error al obtener trámites/cuentas." };
  }
}

export async function fundAccount(userId: string, amount: number) {
  if (!(await isAdmin())) return { error: "No autorizado." };
  
  try {
    // Check if user already has an account
    let account = await prisma.account.findFirst({
      where: { userId }
    });
    
    if (account) {
      // Add balance
      account = await prisma.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: amount
          }
        }
      });
    } else {
      // Create new account
      account = await prisma.account.create({
        data: {
          userId,
          balance: amount
        }
      });
    }

    // Register transaction
    const type = amount >= 0 ? 'DEPOSIT' : 'WITHDRAWAL';
    await prisma.transaction.create({
      data: {
        accountId: account.id,
        amount: Math.abs(amount),
        type,
        status: "COMPLETED"
      }
    });
    
    revalidatePath('/admin');
    const actionText = amount >= 0 ? 'abonaron' : 'descontaron';
    return { success: true, message: `Se ${actionText} $${Math.abs(amount)} exitosamente.` };
  } catch (error) {
    console.error("Error funding account:", error);
    return { error: "Ocurrió un error al procesar el saldo de la cuenta." };
  }
}

export async function toggleAdminRole(targetUserId: string) {
    // Only an existing admin can make another admin
    if (!(await isAdmin())) return { error: "No autorizado." };

    try {
        const user = await prisma.user.findUnique({ where: { id: targetUserId }});
        if (!user) return { error: "Usuario no encontrado" };

        // Evita que un administrador se quite el rol a sí mismo y deje el panel sin acceso
        const session = await getSession();
        if (session?.userId === targetUserId) return { error: "No puedes cambiar tu propio rol." };

        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        await prisma.user.update({
            where: { id: targetUserId },
            data: { role: newRole }
        });
        return { success: true, message: `Rol actualizado a ${newRole}` };
    } catch (error) {
        console.error(error);
        return { error: "Error actualizando rol" };
    }
}

export async function toggleUserStatus(targetUserId: string) {
    if (!(await isAdmin())) return { error: "No autorizado." };

    try {
        const user = await prisma.user.findUnique({ where: { id: targetUserId }});
        if (!user) return { error: "Usuario no encontrado" };
        
        // Prevent admin from deactivating themselves
        const session = await getSession();
        if (session?.userId === targetUserId) {
            return { error: "No puedes desactivar tu propia cuenta." };
        }

        const newStatus = !user.isActive;
        await prisma.user.update({
            where: { id: targetUserId },
            data: { isActive: newStatus }
        });
        revalidatePath('/admin');
        return { success: true, message: `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente.` };
    } catch (error) {
        console.error("Error toggling user status:", error);
        return { error: "Error al actualizar estado del usuario." };
    }
}

export async function deleteUser(targetUserId: string) {
    if (!(await isAdmin())) return { error: "No autorizado." };

    try {
        const user = await prisma.user.findUnique({ where: { id: targetUserId }});
        if (!user) return { error: "Usuario no encontrado" };

        // Prevent admin from deleting themselves
        const session = await getSession();
        if (session?.userId === targetUserId) {
            return { error: "No puedes eliminar tu propia cuenta." };
        }

        await prisma.user.delete({
            where: { id: targetUserId }
        });
        revalidatePath('/admin');
        return { success: true, message: "Usuario eliminado exitosamente." };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { error: "Error al eliminar el usuario." };
    }
}

export async function getPendingTransfers() {
  if (!(await isAdmin())) return { error: "No autorizado." };

  try {
    const pendingTransfers = await prisma.transaction.findMany({
      where: {
        type: 'TRANSFER',
        status: 'PENDING'
      },
      include: {
        account: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = pendingTransfers.map((tx: any) => ({
      id: tx.id,
      amount: parseFloat(tx.amount.toString()),
      destinationName: tx.destinationName,
      destinationBank: tx.destinationBank,
      destinationClabe: tx.destinationClabe,
      description: tx.description,
      createdAt: tx.createdAt.toISOString(),
      user: {
        nombres: tx.account.user.nombres,
        apellidoPaterno: tx.account.user.apellidoPaterno,
        correo: tx.account.user.correo
      }
    }));

    return { success: true, transfers: formatted };
  } catch (error) {
    console.error("Error fetching pending transfers:", error);
    return { error: "Error al obtener transferencias pendientes." };
  }
}

export async function resolveTransfer(transactionId: string, action: 'APPROVE' | 'REJECT') {
  if (!(await isAdmin())) return { error: "No autorizado." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { account: true }
      });

      if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");
      if (transaction.status !== 'PENDING') throw new Error("TRANSACTION_NOT_PENDING");

      if (action === 'APPROVE') {
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'COMPLETED' }
        });
      } else if (action === 'REJECT') {
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'REJECTED' }
        });
        
        // Return the funds
        await tx.account.update({
          where: { id: transaction.accountId },
          data: {
            balance: { increment: transaction.amount }
          }
        });
      }

      return { success: true };
    });

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, message: action === 'APPROVE' ? 'Transferencia autorizada.' : 'Transferencia rechazada y fondos devueltos.' };
  } catch (error: any) {
    console.error("Error resolving transfer:", error);
    return { error: "Error al resolver la transferencia." };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  if (!(await isAdmin())) return { error: "No autorizado." };
  
  if (!newPassword || newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }});
    if (!user) return { error: "Usuario no encontrado" };

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    
    return { success: true, message: "Contraseña actualizada exitosamente." };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { error: "Error al restablecer la contraseña." };
  }
}

