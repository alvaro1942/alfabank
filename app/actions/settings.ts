"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";

async function isAdmin() {
  const session = await getSession();
  if (!session) return false;
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { role: true }
  });
  
  return user?.role === "ADMIN";
}

export async function getSystemSettings() {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: "global" }
    });
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: { id: "global" }
      });
    }
    return settings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {
      cardNumber: "",
      qrNumber: "",
      clabe: ""
    } as any; // Fallback defaults
  }
}

export async function updateSystemSettings(data: { cardNumber?: string, qrNumber?: string, clabe?: string }) {
  if (!(await isAdmin())) return { error: "No autorizado." };
  
  try {
    const settings = await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: data,
      create: { id: "global", ...data }
    });
    
    revalidatePath('/', 'layout'); // clear all cached routes where settings might be used
    
    return { success: true, message: "Ajustes guardados correctamente.", settings };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { error: "Error guardando los ajustes globales." };
  }
}
