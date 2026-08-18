import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const allUsers = await db.query.users.findMany({
    with: {
      categoryBundles: { with: { bundle: true } },
      company: true,
    },
    orderBy: [asc(users.name)],
  });

  const potentialManagers = allUsers.filter(
    (u) => !u.archived && (u.role === "PAYROLL_MANAGER" || u.role === "ADMIN")
  );

  const allCategoryBundles = await db.query.categoryBundles.findMany();
  const allCategories = await db.query.categories.findMany();
  const allCompanies = await db.query.companies.findMany();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Manage Users</h1>
      <AdminUsersClient
        initialUsers={allUsers as any}
        potentialManagers={potentialManagers as any}
        allCategoryBundles={allCategoryBundles}
        allCategories={allCategories}
        allCompanies={allCompanies}
      />
    </div>
  );
}
