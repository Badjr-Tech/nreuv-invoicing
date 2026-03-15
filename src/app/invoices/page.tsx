import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, users } from "@/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";
import InvoicesClient from "./InvoicesClient";

export const dynamic = 'force-dynamic';

interface InvoicesPageProps {
  searchParams: Promise<{
    filterUser?: string;
    filterStatus?: "DRAFT" | "PENDING_MANAGER" | "PENDING_ADMIN" | "APPROVED" | "";
    filterPaymentDateStart?: string;
    filterPaymentDateEnd?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Await the searchParams promise
  const params = await searchParams;
  const { filterUser, filterStatus, filterPaymentDateStart, filterPaymentDateEnd } = params;

  let whereClause = [];

  // Always filter by userId for non-admin/payroll_manager roles
  if (session.user.role === "USER" || session.user.role === "EMPLOYEE") {
    whereClause.push(eq(invoices.userId, session.user.id));
  } else if (filterUser) { // For Admin/PayrollManager, apply filterUser if present
    whereClause.push(eq(invoices.userId, filterUser));
  }

  if (filterStatus) {
    whereClause.push(eq(invoices.status, filterStatus));
  }

  if (filterPaymentDateStart) {
    whereClause.push(gte(invoices.invoiceDate, new Date(filterPaymentDateStart)));
  }
  if (filterPaymentDateEnd) {
    whereClause.push(lte(invoices.invoiceDate, new Date(filterPaymentDateEnd)));
  }

  const userInvoices = await db.query.invoices.findMany({
    where: and(...whereClause),
    with: { items: true, user: true },
    orderBy: [desc(invoices.invoiceDate)],
  });

  const allUsers =
    session.user.role === "ADMIN" || session.user.role === "PAYROLL_MANAGER"
      ? await db.query.users.findMany()
      : [];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <InvoicesClient 
        userInvoices={userInvoices} 
        allUsers={allUsers} 
        currentUserRole={session.user.role} 
      />
    </div>
  );
}
