import { db } from "@/db";
import { invoices, users, notifications } from "@/db/schema";
import { desc, asc, eq, and, gte, lte, count, sql } from "drizzle-orm"; // Added notifications and count
import AdminDashboardClient from "./AdminDashboardClient";

async function getAllInvoices(
  sortField: string = "invoiceDate",
  sortOrder: "asc" | "desc" = "desc",
  filterUser: string | undefined = "",
  filterStatus: "DRAFT" | "SENT" | "APPROVED" | "" | undefined = "",
  filterInvoiceDateStart: string | undefined = "",
  filterInvoiceDateEnd: string | undefined = "",
  filterDueDateStart: string | undefined = "",
  filterDueDateEnd: string | undefined = "",
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
    orderBy: [orderBy((invoices as any)[sortField])], // Dynamic order by
  });
}

async function getAllUsersWithNotificationCounts() {
    const usersWithCounts = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      unreadNotifications: sql<number>`(SELECT count(*) FROM ${notifications} WHERE ${notifications.userId} = ${users.id} AND ${notifications.read} = FALSE)`
    }).from(users);

    return usersWithCounts.map(u => ({
      ...u,
      // The subquery result (count) should now be directly available as a scalar property
      unreadNotifications: u.unreadNotifications || 0
    }));
}

export default async function AdminDashboard({
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
  const allUsers = await getAllUsersWithNotificationCounts(); // Call the new function

  return (
    <AdminDashboardClient initialInvoices={allInvoices} users={allUsers} />
  );
}