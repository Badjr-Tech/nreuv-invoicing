import { auth } from "@/auth";
import { db } from "@/db";
import { accountRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import AdminAccountRequestsClient from "./AdminAccountRequestsClient";

async function getPendingAccountRequests() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin"); // Admins only
  }

  // Only PENDING requests — denied/approved fall off the list automatically.
  return db.query.accountRequests.findMany({
    where: eq(accountRequests.status, "PENDING"),
    orderBy: [desc(accountRequests.createdAt)],
  });
}

export default async function AdminAccountRequestsPage() {
  const pendingRequests = await getPendingAccountRequests();

  return <AdminAccountRequestsClient initialRequests={pendingRequests} />;
}
