import ProfileView from "@/views/profile/page";
import { getUserProfile } from "@/app/actions/user";
import { redirect } from "next/navigation";

export default async function Profile() {
    const userProfile = await getUserProfile();

    if (!userProfile) {
        redirect("/login");
    }

    return <ProfileView userProfile={userProfile} />;
}
