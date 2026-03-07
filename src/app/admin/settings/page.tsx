import { auth } from "@/auth";
import { db } from "@/db";
import { invoiceDeadlineSettings, allowedInvoiceDates } from "@/db/schema";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";
import { asc } from "drizzle-orm";

async function getAdminSettingsData() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin"); // Or to an unauthorized page
  }

  const existingDeadlineSettings = await db.query.invoiceDeadlineSettings.findMany();
  const existingAllowedDates = await db.query.allowedInvoiceDates.findMany({
    orderBy: [asc(allowedInvoiceDates.date)]
  });

  return { existingDeadlineSettings, existingAllowedDates };
}

export default async function AdminSettingsPage() {
  const { existingDeadlineSettings, existingAllowedDates } = await getAdminSettingsData();

  return (
    <AdminSettingsClient
      initialDeadlineSettings={existingDeadlineSettings}
      initialAllowedDates={existingAllowedDates}
    />
  );
}