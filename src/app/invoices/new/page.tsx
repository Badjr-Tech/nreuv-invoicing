import { auth } from "@/auth";
import { db } from "@/db";
import { paymentSchedules, categories, allowedInvoiceDates } from "@/db/schema";
import { redirect } from "next/navigation";
import NewInvoiceClient from "./NewInvoiceClient";
import { asc } from "drizzle-orm";

export default async function NewInvoicePage() {
  const session = await auth();

  // Allow USER and EMPLOYEE roles to create invoices
  if (!session?.user?.id || (session.user.role !== "USER" && session.user.role !== "EMPLOYEE")) {
    redirect("/auth/signin");
  }

  // Fetch necessary data for the form
  const dbPaymentSchedules = await db.select().from(paymentSchedules);
  const dbCategories = await db.select().from(categories);
  const dbAllowedDates = await db.select().from(allowedInvoiceDates).orderBy(asc(allowedInvoiceDates.date));

  return (
    <div className="p-4 md:p-8">
      <NewInvoiceClient 
        paymentSchedules={dbPaymentSchedules} 
        categories={dbCategories} 
        allowedDates={dbAllowedDates}
      />
    </div>
  );
}