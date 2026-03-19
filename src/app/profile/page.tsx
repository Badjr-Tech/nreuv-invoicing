import { auth } from "@/auth";
import { db } from "@/db";
import { users, documents } from "@/db/schema";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { eq, desc } from "drizzle-orm";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
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
    redirect("/auth/signin"); // User not found, should not happen if authenticated
  }

  return (
    <ProfileClient user={user} />
  );
}
