import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, categories, invoiceDeadlineSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import EditInvoiceClient from "./EditInvoiceClient";
import { generatePayPeriods } from "@/lib/schedule-utils";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: {
      items: true,
    },
  });

  if (!invoice) {
    return (
      <div className="p-8 text-center text-slate-600">
        <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
        <p>The requested invoice could not be found.</p>
      </div>
    );
  }

  // Authorization: Only the owner or an ADMIN can edit
  const isOwner = invoice.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return (
      <div className="p-8 text-center text-red-600">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to edit this invoice.</p>
      </div>
    );
  }

  // Only DRAFT invoices can be edited
  if (invoice.status !== "DRAFT") {
    return (
      <div className="p-8 text-center text-red-600">
        <h1 className="text-2xl font-bold mb-4">Cannot Edit</h1>
        <p>Only invoices in DRAFT status can be edited.</p>
      </div>
    );
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

  return (
    <div className="p-4 md:p-8">
      <EditInvoiceClient
        invoice={invoice}
        categories={userAssignedCategories.length > 0 ? userAssignedCategories : dbCategories}
        payPeriods={payPeriods}
        hourlyRate={userRecord?.hourlyRate || 0}
      />
    </div>
  );
}