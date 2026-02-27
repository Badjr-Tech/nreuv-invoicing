import { auth } from "@/auth";
import { db } from "@/db";
import { invoiceDeadlineSettings, paymentSchedules } from "@/db/schema";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";

async function getAdminSettingsData() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin"); // Or to an unauthorized page
  }

  const existingDeadlineSettings = await db.query.invoiceDeadlineSettings.findMany();
  const existingPaymentSchedules = await db.query.paymentSchedules.findMany();

  return { existingDeadlineSettings, existingPaymentSchedules };
}

export default async function AdminSettingsPage() {
  const { existingDeadlineSettings, existingPaymentSchedules } = await getAdminSettingsData();

  return (
    <AdminSettingsClient
      initialDeadlineSettings={existingDeadlineSettings}
      initialPaymentSchedules={existingPaymentSchedules}
    />
  );
}