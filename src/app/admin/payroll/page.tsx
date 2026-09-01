import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, fixedStaff } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import PayrollClient from "./PayrollClient";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
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

  const selectedDate =
    date ||
    (allDates.length > 0 ? allDates[0].day : new Date().toISOString().slice(0, 10));

  const dayInvoices = await db.query.invoices.findMany({
    where: sql`to_char(${invoices.invoiceDate} at time zone 'America/New_York', 'YYYY-MM-DD') = ${selectedDate}`,
    with: { user: { with: { company: true } } },
    orderBy: [desc(invoices.totalCost)],
  });

  const activeFixedStaff = await db.query.fixedStaff.findMany({
    where: eq(fixedStaff.active, true),
    with: { company: true },
  });

  return (
    <PayrollClient
      selectedDate={selectedDate}
      availableDates={allDates.map((d) => d.day)}
      invoices={dayInvoices as any}
      fixedStaff={activeFixedStaff as any}
    />
  );
}
