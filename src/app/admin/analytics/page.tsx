import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";
import { db } from "@/db";
import { invoices, invoiceItems, users, categories, companies, payrollRuns } from "@/db/schema";
import { sql, sum, count, desc, asc, eq, and, gte } from "drizzle-orm";
import { format } from "date-fns";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin"); // Or redirect to an unauthorized page
  }

  // Time window filter: last 3 / 6 / 12 months, or all time
  const { months } = await searchParams;
  const windowMonths = months === "all" ? null : parseInt(months || "6", 10) || 6;
  const windowStart = windowMonths
    ? new Date(new Date().getFullYear(), new Date().getMonth() - windowMonths, 1)
    : null;
  const timeFilter = windowStart ? [gte(invoices.invoiceDate, windowStart)] : [];

  // Fetch Invoice Metrics Over Time (e.g., monthly totals)
  const invoiceMetricsRaw = await db
    .select({
      month: sql<string>`TO_CHAR(${invoices.invoiceDate}, 'Mon YYYY')`,
      monthKey: sql<string>`TO_CHAR(${invoices.invoiceDate}, 'YYYY-MM')`,
      totalAmount: sum(invoices.totalCost),
      totalHours: sum(invoices.totalHours),
    })
    .from(invoices)
    .where(and(eq(invoices.status, "APPROVED"), ...timeFilter)) // Only approved invoices for metrics
    .groupBy(sql`TO_CHAR(${invoices.invoiceDate}, 'YYYY-MM')`, sql`TO_CHAR(${invoices.invoiceDate}, 'Mon YYYY')`)
    .orderBy(sql`TO_CHAR(${invoices.invoiceDate}, 'YYYY-MM')`);

  // Fixed-pay staff totals come from approved payroll runs, by month
  const fixedByMonthRaw = await db
    .select({
      monthKey: sql<string>`substr(${payrollRuns.payDate}, 1, 7)`,
      fixedTotal: sum(payrollRuns.fixedStaffTotal),
    })
    .from(payrollRuns)
    .where(eq(payrollRuns.status, "APPROVED"))
    .groupBy(sql`substr(${payrollRuns.payDate}, 1, 7)`);
  const fixedByMonth = new Map(fixedByMonthRaw.map((r) => [r.monthKey, Number(r.fixedTotal || 0)]));

  const invoiceMetrics = invoiceMetricsRaw.map((row) => ({
    period: row.month,
    totalAmount: Number(row.totalAmount || 0),
    fixedStaffAmount: fixedByMonth.get(row.monthKey) || 0,
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
    .where(and(eq(invoices.status, "APPROVED"), ...timeFilter))
    .groupBy(categories.name)
    .orderBy(desc(sum(sql`${invoiceItems.hours} * ${invoiceItems.rate}`)));

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
    .where(and(eq(invoices.status, "APPROVED"), ...timeFilter))
    .groupBy(users.id, users.name, users.email)
    .orderBy(desc(sum(invoices.totalCost)));

  const userPerformance = userPerformanceRaw.map((row) => ({
    userName: row.userName || row.userEmail || "Unknown",
    totalAmount: Number(row.totalAmount || 0),
    totalHours: Number(row.totalHours || 0),
    avgInvoice: row.invoiceCount ? Number(row.totalAmount || 0) / Number(row.invoiceCount) : 0,
  }));

  // Spending per company (approved invoices, via each invoice's user)
  const companyBreakdownRaw = await db
    .select({
      companyName: companies.name,
      totalAmount: sum(invoices.totalCost),
      totalHours: sum(invoices.totalHours),
    })
    .from(invoices)
    .leftJoin(users, eq(invoices.userId, users.id))
    .leftJoin(companies, eq(users.companyId, companies.id))
    .where(and(eq(invoices.status, "APPROVED"), ...timeFilter))
    .groupBy(companies.name)
    .orderBy(desc(sum(invoices.totalCost)));

  const companyBreakdown = companyBreakdownRaw.map((row) => ({
    company: row.companyName || "No Company",
    totalAmount: Number(row.totalAmount || 0),
    totalHours: Number(row.totalHours || 0),
  }));

  return (
    <AnalyticsClient
      invoiceMetrics={invoiceMetrics}
      categoryBreakdown={categoryBreakdown}
      userPerformance={userPerformance}
      companyBreakdown={companyBreakdown}
      windowMonths={windowMonths}
    />
  );
}
