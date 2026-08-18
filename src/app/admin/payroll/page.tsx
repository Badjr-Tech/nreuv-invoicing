import { auth } from "@/auth";
import { db } from "@/db";
import { invoices, fixedStaff } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
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

  // Every payment date that has invoices, for the date picker dropdown
  const allDates = await db
    .select({ invoiceDate: invoices.invoiceDate })
    .from(invoices)
    .groupBy(invoices.invoiceDate)
    .orderBy(desc(invoices.invoiceDate));

  const selectedDate =
    date ||
    (allDates.length > 0
      ? allDates[0].invoiceDate.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10));

  const dayStart = new Date(`${selectedDate}T00:00:00`);
  const dayEnd = new Date(`${selectedDate}T23:59:59.999`);

  const dayInvoices = await db.query.invoices.findMany({
    where: and(gte(invoices.invoiceDate, dayStart), lte(invoices.invoiceDate, dayEnd)),
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
      availableDates={allDates.map((d) => d.invoiceDate.toISOString().slice(0, 10))}
      invoices={dayInvoices as any}
      fixedStaff={activeFixedStaff as any}
    />
  );
}
