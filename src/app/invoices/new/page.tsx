import { auth } from "@/auth";
import { db } from "@/db";
import { paymentSchedules, categories, users, invoiceDeadlineSettings } from "@/db/schema";
import { redirect } from "next/navigation";
import NewInvoiceClient from "./NewInvoiceClient";
import { eq } from "drizzle-orm";
import { generatePayPeriods } from "@/lib/schedule-utils";

export default async function NewInvoicePage() {
  const session = await auth();

  // Allow USER and EMPLOYEE roles to create invoices
  if (!session?.user?.id || (session.user.role !== "USER" && session.user.role !== "EMPLOYEE")) {
    redirect("/auth/signin");
  }

  // Fetch necessary data for the form
  const dbPaymentSchedules = await db.select().from(paymentSchedules);
  const dbCategories = await db.select().from(categories);
  
  // Fetch global schedule
  const settings = await db.select().from(invoiceDeadlineSettings).limit(1);
  const globalSchedule = settings[0];
  const payPeriods = globalSchedule ? generatePayPeriods(globalSchedule as any, 12) : []; // Generate next 12 periods

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return (
    <div className="p-4 md:p-8">
      <NewInvoiceClient 
        paymentSchedules={dbPaymentSchedules} 
        categories={dbCategories} 
        payPeriods={payPeriods}
        hourlyRate={userRecord?.hourlyRate || 0}
      />
    </div>
  );
}