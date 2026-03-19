import { auth } from "@/auth";
import { db } from "@/db";
import { users, documents } from "@/db/schema";
import { redirect } from "next/navigation";
import AdminUserProfileClient from "./AdminUserProfileClient";
import { eq, desc } from "drizzle-orm";

export default async function AdminUserSingleProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin"); // Only Admins can view user profiles
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, params.id),
    with: {
      documents: {
        orderBy: [desc(documents.createdAt)],
        with: {
          uploadedBy: {
            columns: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    // Handle user not found case
    redirect("/admin/users"); // Redirect back to user list if not found
  }

  return <AdminUserProfileClient user={user} currentAdminId={session.user.id} />;
}
