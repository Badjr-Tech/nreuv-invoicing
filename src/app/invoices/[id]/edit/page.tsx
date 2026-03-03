import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, paymentSchedules, categories, allowedInvoiceDates } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import EditInvoiceClient from "./EditInvoiceClient";

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
  const dbPaymentSchedules = await db.select().from(paymentSchedules);
  const dbCategories = await db.select().from(categories);
  const dbAllowedDates = await db.select().from(allowedInvoiceDates).orderBy(asc(allowedInvoiceDates.date));

  return (
    <div className="p-4 md:p-8">
      <EditInvoiceClient
        invoice={invoice}
        paymentSchedules={dbPaymentSchedules}
        categories={dbCategories}
        allowedDates={dbAllowedDates}
      />
    </div>
  );
}