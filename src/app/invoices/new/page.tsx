import { auth } from "@/auth";
import { db } from "@/db";
import { categories, users, invoiceDeadlineSettings, invoices } from "@/db/schema";
import { redirect } from "next/navigation";
import NewInvoiceClient from "./NewInvoiceClient";
import { eq, desc } from "drizzle-orm";
import { generatePayPeriods } from "@/lib/schedule-utils";

export default async function NewInvoicePage() {
  const session = await auth();

  // Allow USER and EMPLOYEE roles to create invoices
  if (!session?.user?.id || (session.user.role !== "USER" && session.user.role !== "EMPLOYEE")) {
    redirect("/auth/signin");
  }

  // Fetch necessary data for the form
  const dbCategories = await db.select().from(categories);
  
  // Fetch global schedule
  const globalSchedule = await db.query.invoiceDeadlineSettings.findFirst({
    where: (settings, { isNotNull }) => isNotNull(settings.startDate),
    orderBy: (settings, { desc }) => [desc(settings.startDate)], // Order to get the latest/most relevant
  });
  const payPeriods = globalSchedule ? generatePayPeriods(globalSchedule as any, 12) : []; // Generate next 12 periods

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: {
      categoryBundles: {
        with: {
          bundle: {
            with: {
              categories: {
                with: {
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const userAssignedCategories = userRecord?.categoryBundles
    .flatMap(ucb => ucb.bundle.categories.map(bc => bc.category))
    .filter((cat, index, self) => index === self.findIndex(c => c.id === cat.id)) || [];

  const latestInvoice = await db.query.invoices.findFirst({
    orderBy: [desc(invoices.invoiceNumber)]
  });
  const nextInvoiceNumber = (latestInvoice?.invoiceNumber || 0) + 1;

  return (
    <div className="p-4 md:p-8">
      <NewInvoiceClient 
        categories={userAssignedCategories.length > 0 ? userAssignedCategories : dbCategories} 
        payPeriods={payPeriods}
        hourlyRate={userRecord?.hourlyRate || 0}
        nextInvoiceNumber={nextInvoiceNumber}
      />
    </div>
  );
}