import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserSettingsClient from "./UserSettingsClient";

export default async function UserSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-nreuv-black mb-6">My Settings</h1>
      <UserSettingsClient userId={session.user.id} />
    </div>
  );
}