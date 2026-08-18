import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";
import { db } from "@/db";
import { invoices, invoiceItems, users, categories } from "@/db/schema";
import { sql, sum, count, desc, asc, eq, and } from "drizzle-orm";
import { format } from "date-fns";

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin"); // Or redirect to an unauthorized page
  }

  // Fetch Invoice Metrics Over Time (e.g., monthly totals)
  const invoiceMetricsRaw = await db
    .select({
      month: sql<string>`TO_CHAR(${invoices.invoiceDate}, 'Mon YYYY')`,
      totalAmount: sum(invoices.totalCost),
      totalHours: sum(invoices.totalHours),
    })
    .from(invoices)
    .where(eq(invoices.status, "APPROVED")) // Only approved invoices for metrics
    .groupBy(sql`TO_CHAR(${invoices.invoiceDate}, 'YYYY-MM')`, sql`TO_CHAR(${invoices.invoiceDate}, 'Mon YYYY')`)
    .orderBy(sql`TO_CHAR(${invoices.invoiceDate}, 'YYYY-MM')`);

  const invoiceMetrics = invoiceMetricsRaw.map((row) => ({
    period: row.month,
    totalAmount: Number(row.totalAmount || 0),
    totalHours: Number(row.totalHours || 0),
  }));

  // Fetch Category Spending Breakdown
  const categoryBreakdownRaw = await db
    .select({
      categoryName: categories.name,
      totalAmount: sum(sql`${invoiceItems.hours} * ${invoiceItems.rate}`),
      totalHours: sum(invoiceItems.hours),
    })
    .from(invoiceItems)
    .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .leftJoin(categories, eq(invoiceItems.categoryId, categories.id))
    .where(eq(invoices.status, "APPROVED"))
    .groupBy(categories.name)
    .orderBy(desc(sql`totalAmount`));

  const categoryBreakdown = categoryBreakdownRaw.map((row) => ({
    category: row.categoryName || "Uncategorized",
    totalAmount: Number(row.totalAmount || 0),
    totalHours: Number(row.totalHours || 0),
  }));

  // Fetch User Performance (e.g., total amounts/hours per user, avg invoice value)
  const userPerformanceRaw = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      totalAmount: sum(invoices.totalCost),
      totalHours: sum(invoices.totalHours),
      invoiceCount: count(invoices.id),
    })
    .from(invoices)
    .leftJoin(users, eq(invoices.userId, users.id))
    .where(eq(invoices.status, "APPROVED"))
    .groupBy(users.id, users.name, users.email)
    .orderBy(desc(sql`totalAmount`));

  const userPerformance = userPerformanceRaw.map((row) => ({
    userName: row.userName || row.userEmail || "Unknown",
    totalAmount: Number(row.totalAmount || 0),
    totalHours: Number(row.totalHours || 0),
    avgInvoice: row.invoiceCount ? Number(row.totalAmount || 0) / Number(row.invoiceCount) : 0,
  }));

  return (
    <AnalyticsClient
      invoiceMetrics={invoiceMetrics}
      categoryBreakdown={categoryBreakdown}
      userPerformance={userPerformance}
    />
  );
}
