import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

/** Sirve el QR de pago solo a usuarios y administradores con sesión válida. */
export async function GET() {
    const session = await getSession();
    if (!session) return new Response("No autorizado", { status: 401 });

    const image = await readFile(path.join(process.cwd(), "private", "qr.jpeg"));
    return new Response(new Uint8Array(image), {
        headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "private, no-store",
        },
    });
}
