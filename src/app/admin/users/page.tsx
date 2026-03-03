import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";
import { desc } from "drizzle-orm";

export default async function ManageUsersPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.emailVerified)],
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-nreuv-black mb-6">Manage Users</h1>
      <AdminUsersClient initialUsers={allUsers} />
    </div>
  );
}