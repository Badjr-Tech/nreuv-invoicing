import { auth } from "@/auth";
import { db } from "@/db";
import { accountRequests } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import AdminAccountRequestsClient from "./AdminAccountRequestsClient";

export const dynamic = "force-dynamic";

export default async function AdminAccountRequestsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  // Only show requests that still need a decision — approved/denied ones are done
  const requests = await db.query.accountRequests.findMany({
    where: eq(accountRequests.status, "PENDING"),
    orderBy: [desc(accountRequests.createdAt)],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Account Requests</h1>
      <AdminAccountRequestsClient initialRequests={requests as any} />
    </div>
  );
}
