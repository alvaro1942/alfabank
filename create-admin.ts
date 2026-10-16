import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Crea (o promueve) el primer administrador usando ADMIN_EMAIL y ADMIN_PASSWORD del entorno.
// Opera sobre la base definida en DATABASE_URL: verifica que sea la base propia de Alfa bank.
const correo = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!process.env.DATABASE_URL || !correo || !password) {
    console.error("Define DATABASE_URL, ADMIN_EMAIL y ADMIN_PASSWORD en .env.local antes de ejecutar este script.");
    process.exit(1);
}
if (password.length < 8) {
    console.error("ADMIN_PASSWORD debe tener al menos 8 caracteres.");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// @ts-ignore
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const hashedPassword = await bcrypt.hash(password!, 10);
        const existingUser = await prisma.user.findUnique({ where: { correo } });

        if (existingUser) {
            await prisma.user.update({
                where: { correo },
                data: { role: "ADMIN", password: hashedPassword },
            });
            console.log("Usuario existente actualizado a ADMIN con la contraseña indicada.");
        } else {
            await prisma.user.create({
                data: {
                    nombres: "Administrador",
                    apellidoPaterno: "Alfa",
                    apellidoMaterno: "Bank",
                    curp: "ADMINALFABANK000000",
                    fechaNacimiento: new Date("1990-01-01"),
                    celular: "0000000000",
                    correo: correo!,
                    direccion: "Oficinas centrales",
                    password: hashedPassword,
                    role: "ADMIN",
                },
            });
            console.log("Administrador creado correctamente.");
        }
    } catch (error) {
        console.error("Ocurrió un error:", error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
