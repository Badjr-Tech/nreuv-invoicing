import { auth } from "@/auth";
import { db } from "@/db";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";
import CompaniesSection from "./CompaniesSection";
import FixedStaffSection from "./FixedStaffSection";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const deadlineSettings = await db.query.invoiceDeadlineSettings.findMany();
  const allCategories = await db.query.categories.findMany();
  const allBundles = await db.query.categoryBundles.findMany({
    with: { categories: { with: { category: true } } },
  });
  const allCompanies = await db.query.companies.findMany();
  const allFixedStaff = await db.query.fixedStaff.findMany({
    with: { company: true },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>

      <CompaniesSection initialCompanies={allCompanies} />

      <FixedStaffSection initialStaff={allFixedStaff as any} companies={allCompanies} />

      <AdminSettingsClient
        initialDeadlineSettings={deadlineSettings as any}
        initialCategories={allCategories}
        initialCategoryBundles={allBundles as any}
      />
    </div>
  );
}
