import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";

// Ruta de mantenimiento: escribe en la base de datos al visitarla. Solo administradores.
export const dynamic = "force-dynamic";

export default async function BackfillPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const current = await prisma.user.findUnique({
        where: { id: session.userId as string },
        select: { role: true }
    });
    if (current?.role !== "ADMIN") redirect("/dashboard");

    const result: string[] = [];
    try {
        const accounts = await prisma.account.findMany({
            include: { transactions: true }
        });

        for (const account of accounts) {
            let sumaTransaccional = 0;
            for (const tx of account.transactions) {
                const amount = parseFloat(tx.amount.toString());
                if (tx.type === 'DEPOSIT') {
                    sumaTransaccional += amount;
                } else if (tx.type === 'WITHDRAWAL') {
                    sumaTransaccional -= amount;
                }
            }

            const balanceActual = parseFloat(account.balance.toString());
            const missingBalance = balanceActual - sumaTransaccional;

            if (Math.abs(missingBalance) > 0.01) {
                const type = missingBalance >= 0 ? 'DEPOSIT' : 'WITHDRAWAL';
                await prisma.transaction.create({
                    data: {
                        accountId: account.id,
                        amount: Math.abs(missingBalance),
                        type: type,
                        status: "COMPLETED",
                        createdAt: account.createdAt
                    }
                });
                result.push(`Cuenta reformada: ${account.id} por $${missingBalance}`);
            }
        }
    } catch (e: any) {
        return <div className="p-10 font-mono text-danger">Error: {e.message}</div>;
    }

    return (
        <div className="mx-auto max-w-2xl p-10 font-mono text-sm text-ink">
            <p className="font-bold">Saldos antiguos importados al historial.</p>
            <p>{result.length} cuentas restauradas.</p>
            <div className="mt-4 space-y-1 text-muted">
                {result.map(r => <div key={r}>{r}</div>)}
            </div>
            <p className="mt-6 text-muted">Cierra esta página y vuelve a tu panel.</p>
        </div>
    );
}
