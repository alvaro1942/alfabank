import WithdrawView from "@/views/withdraw/page";
import { getUserProfile } from "@/app/actions/user";

export default async function Withdraw() {
    const userProfile = await getUserProfile();
    return <WithdrawView userProfile={userProfile} />;
}

