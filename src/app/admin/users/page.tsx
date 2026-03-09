import { auth } from "@/auth";
import { db } from "@/db";
import { users, categories, categoryBundles, userCategoryBundles } from "@/db/schema";
import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";
import { desc, inArray } from "drizzle-orm";

export default async function ManageUsersPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.emailVerified)],
    with: {
      categoryBundles: {
        with: {
          bundle: true, // Fetch bundle details
        },
      },
    },
  });

  const managers = await db.query.users.findMany({
    where: inArray(users.role, ["ADMIN", "PAYROLL_MANAGER"]),
    orderBy: [desc(users.name)],
    with: {
      categoryBundles: {
        with: {
          bundle: true,
        },
      },
    },
  });

  const allCategories = await db.query.categories.findMany({
    orderBy: [desc(categories.name)],
  });

  const allCategoryBundles = await db.query.categoryBundles.findMany({
    orderBy: [desc(categoryBundles.name)],
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-nreuv-black mb-6">Manage Users</h1>
      <AdminUsersClient 
        initialUsers={allUsers} 
        potentialManagers={managers} 
        allCategoryBundles={allCategoryBundles} 
        allCategories={allCategories}
      />
    </div>
  );
}