import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, fixedStaff, payrollRuns } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { generatePayPeriods } from "@/lib/schedule-utils";
import { redirect } from "next/navigation";
import PayrollClient from "./PayrollClient";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_APPROVER")) {
    redirect("/auth/signin");
  }

  const { date } = await searchParams;

  // Every payment date that has invoices, for the date picker dropdown.
  // Compare calendar dates in SQL so results don't depend on the server's timezone.
  const dateExpr = sql<string>`to_char(${invoices.invoiceDate} at time zone 'America/New_York', 'YYYY-MM-DD')`;
  // Dropdown only shows pay periods from the last 3 months; the date picker reaches older ones
  const allDates = await db
    .select({ day: dateExpr })
    .from(invoices)
    .where(sql`${invoices.invoiceDate} >= now() - interval '3 months'`)
    .groupBy(dateExpr)
    .orderBy(desc(dateExpr));

  // Also include upcoming payment dates from the payroll schedule, even before
  // any invoices exist for them, so the next period is always in the dropdown.
  const schedule = await db.query.invoiceDeadlineSettings.findFirst({
    where: (settings, { isNotNull }) => isNotNull(settings.startDate),
    orderBy: (settings, { desc }) => [desc(settings.startDate)],
  });
  const toEasternDay = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD
  const today = toEasternDay(new Date());
  const upcomingDays = schedule
    ? generatePayPeriods(schedule as any, 200)
        .map((p) => toEasternDay(p.invoiceDate))
        .filter((day) => day >= today)
        .slice(0, 2)
    : [];

  const dropdownDays = [...new Set([...upcomingDays, ...allDates.map((d) => d.day)])]
    .sort()
    .reverse();

  // Default to the nearest upcoming pay period; fall back to the latest invoiced date
  const nextPeriod = upcomingDays[0];
  const selectedDate =
    date || nextPeriod || (allDates.length > 0 ? allDates[0].day : today);

  const dayInvoices = await db.query.invoices.findMany({
    where: sql`to_char(${invoices.invoiceDate} at time zone 'America/New_York', 'YYYY-MM-DD') = ${selectedDate}`,
    with: { user: { with: { company: true } } },
    orderBy: [desc(invoices.totalCost)],
  });

  const activeFixedStaff = await db.query.fixedStaff.findMany({
    where: eq(fixedStaff.active, true),
    with: { company: true },
  });

  const run = await db.query.payrollRuns.findFirst({
    where: eq(payrollRuns.payDate, selectedDate),
    with: { submittedBy: true, approvedBy: true },
  });

  return (
    <PayrollClient
      selectedDate={selectedDate}
      availableDates={dropdownDays}
      invoices={dayInvoices as any}
      fixedStaff={activeFixedStaff as any}
      run={run ? {
        status: run.status,
        grandTotal: run.grandTotal,
        notes: run.notes,
        approvalDeadline: run.approvalDeadline?.toISOString() ?? null,
        submittedByName: run.submittedBy?.name ?? null,
        submittedAt: run.submittedAt.toISOString(),
        approvedByName: run.approvedBy?.name ?? null,
        approvedAt: run.approvedAt?.toISOString() ?? null,
      } : null}
      currentUserRole={session.user.role}
    />
  );
}
