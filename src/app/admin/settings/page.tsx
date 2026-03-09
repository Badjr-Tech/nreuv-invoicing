import { auth } from "@/auth";
import { db } from "@/db";
import { invoiceDeadlineSettings, categories, categoryBundles, categoryBundleCategories } from "@/db/schema";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";
import { asc, eq } from "drizzle-orm";

async function getAdminSettingsData() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin"); // Or to an unauthorized page
  }

  const existingDeadlineSettings = await db.query.invoiceDeadlineSettings.findMany();
  const existingCategories = await db.query.categories.findMany({
    orderBy: [asc(categories.name)]
  });
  const existingCategoryBundles = await db.query.categoryBundles.findMany({
    orderBy: [asc(categoryBundles.name)],
    with: {
      categories: {
        with: {
          category: true, // Fetch the actual category details
        },
      },
    },
  });

  return { existingDeadlineSettings, existingCategories, existingCategoryBundles };
}

export default async function AdminSettingsPage() {
  const { existingDeadlineSettings, existingCategories, existingCategoryBundles } = await getAdminSettingsData();

  return (
    <AdminSettingsClient
      initialDeadlineSettings={existingDeadlineSettings}
      initialCategories={existingCategories}
      initialCategoryBundles={existingCategoryBundles}
    />
  );
}