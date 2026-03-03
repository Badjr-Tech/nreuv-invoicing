import { auth } from "@/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import InvoiceClient from "./InvoiceClient";

export default async function InvoiceDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: {
      items: true,
      user: true,
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

  // Authorization: Only owner, ADMIN, or PAYROLL_MANAGER can view
  const isOwner = invoice.userId === session.user.id;
  const isAdminOrManager = session.user.role === "ADMIN" || session.user.role === "PAYROLL_MANAGER";

  if (!isOwner && !isAdminOrManager) {
    return (
      <div className="p-8 text-center text-red-600">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to view this invoice.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <InvoiceClient
        invoice={invoice}
        currentUserRole={session.user.role as string}
        currentUserId={session.user.id}
      />
    </div>
  );
}