import TransferView from "@/views/transfer/page";
import { getUserProfile } from "@/app/actions/user";

export default async function Transfer() {
  const userProfile = await getUserProfile();
  return <TransferView userProfile={userProfile} />;
}

