import DashboardView from "@/views/dashboard/page";
import { getUserProfile } from "@/app/actions/user";
import { getSystemSettings } from "@/app/actions/settings";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    const userProfile = await getUserProfile();
    const settings = await getSystemSettings();

    if (!userProfile) {
        redirect("/login");
    }

    return <DashboardView userProfile={userProfile} settings={settings} />;
}
