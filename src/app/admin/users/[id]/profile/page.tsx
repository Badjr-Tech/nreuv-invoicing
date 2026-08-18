import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import AdminUserProfileClient from "./AdminUserProfileClient";

export const dynamic = "force-dynamic";

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const { id } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { documents: true },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <AdminUserProfileClient user={user as any} currentAdminId={session.user.id} />
    </div>
  );
}
