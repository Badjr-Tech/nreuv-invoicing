import { db } from "@/db";
import { invoices, users, notifications } from "@/db/schema";
import { desc, asc, eq, and, gte, lte } from "drizzle-orm";
import PayrollManagerDashboardClient from "./PayrollManagerDashboardClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

async function getAllInvoices(
  sortField: string = "invoiceDate",
  sortOrder: "asc" | "desc" = "desc",
  filterUser: string = "",
  filterStatus: "DRAFT" | "SENT" | "APPROVED" | "" = "",
  filterInvoiceDateStart: string = "",
  filterInvoiceDateEnd: string = "",
  filterDueDateStart: string = "",
  filterDueDateEnd: string = "",
) {
  const orderBy = sortOrder === "asc" ? asc : desc;

  let whereClause = [];

  if (filterUser) {
    whereClause.push(eq(invoices.userId, filterUser));
  }

  if (filterStatus) {
    whereClause.push(eq(invoices.status, filterStatus));
  }

  if (filterInvoiceDateStart) {
    whereClause.push(gte(invoices.invoiceDate, new Date(filterInvoiceDateStart)));
  }
  if (filterInvoiceDateEnd) {
    whereClause.push(lte(invoices.invoiceDate, new Date(filterInvoiceDateEnd)));
  }

  if (filterDueDateStart) {
    whereClause.push(gte(invoices.dueDate, new Date(filterDueDateStart)));
  }
  if (filterDueDateEnd) {
    whereClause.push(lte(invoices.dueDate, new Date(filterDueDateEnd)));
  }

  return db.query.invoices.findMany({
    where: and(...whereClause),
    with: { user: true, paymentSchedule: true },
    orderBy: [orderBy((invoices as any)[sortField])],
  });
}

async function getAllUsers() {
    return db.query.users.findMany(); // Fetch all users (without notification counts for now)
}

export default async function PayrollManagerDashboard({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
    sortField?: string;
    sortOrder?: "asc" | "desc";
    filterUser?: string;
    filterStatus?: "DRAFT" | "SENT" | "APPROVED" | "";
    filterInvoiceDateStart?: string;
    filterInvoiceDateEnd?: string;
    filterDueDateStart?: string;
    filterDueDateEnd?: string;
  };
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "PAYROLL_MANAGER") {
    redirect("/auth/signin");
  }

  const allInvoices = await getAllInvoices(
    searchParams?.sortField,
    searchParams?.sortOrder,
    searchParams?.filterUser,
    searchParams?.filterStatus,
    searchParams?.filterInvoiceDateStart,
    searchParams?.filterInvoiceDateEnd,
    searchParams?.filterDueDateStart,
    searchParams?.filterDueDateEnd
  );
  const allUsers = await getAllUsers(); // Fetch all users for the sidebar

  return (
    <PayrollManagerDashboardClient initialInvoices={allInvoices} users={allUsers} />
  );
}