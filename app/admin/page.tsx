import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import AdminView from "@/views/admin/page";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const session = await getSession();
    
    if (!session) {
        redirect("/login");
    }

    // Verify admin
    const user = await prisma.user.findUnique({
        where: { id: session.userId as string },
        select: { role: true }
    });

    if (user?.role !== "ADMIN") {
        // Redirigir si no es admin
        redirect("/dashboard");
    }

    return <AdminView />;
}
