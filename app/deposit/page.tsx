import DepositView from "@/views/deposit/page";
import { getSystemSettings } from "@/app/actions/settings";
import { getUserProfile } from "@/app/actions/user";

export default async function Deposit() {
    const settings = await getSystemSettings();
    const userProfile = await getUserProfile();
    return <DepositView settings={settings} userProfile={userProfile} />;
}

