import { auth } from "@/auth";
import { db } from "@/db";
import { accountRequests, users } from "@/db/schema";
import { redirect } from "next/navigation";
import AdminAccountRequestsClient from "./AdminAccountRequestsClient";

async function getPendingAccountRequests() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin"); // Admins only
  }

  const requests = await db.query.accountRequests.findMany();
  return requests;
}

export default async function AdminAccountRequestsPage() {
  const pendingRequests = await getPendingAccountRequests();

  return <AdminAccountRequestsClient initialRequests={pendingRequests} />;
}
