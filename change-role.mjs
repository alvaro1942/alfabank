// Uso: node change-role.mjs usuario@correo.com
// Requiere DATABASE_URL (la base propia de Alfa bank) exportada en el entorno.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const emailToUpgrade = process.argv[2];

if (!emailToUpgrade) {
    console.error("Indica el correo del usuario a convertir en admin. Ejemplo:");
    console.error("node change-role.mjs usuario@correo.com");
    process.exit(1);
}
if (!process.env.DATABASE_URL) {
    console.error("Define DATABASE_URL en el entorno antes de ejecutar este script.");
    process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
    const user = await prisma.user.update({
        where: { correo: emailToUpgrade },
        data: { role: "ADMIN" }
    });
    console.log(`Listo: ${user.nombres} (${user.correo}) ahora es ADMINISTRADOR.`);
} catch (error) {
    console.error("Error: ¿el correo existe en la base de datos?", error.meta?.cause || error.message);
} finally {
    await prisma.$disconnect();
    await pool.end();
}
