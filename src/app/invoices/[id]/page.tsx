import { auth } from "@/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import InvoiceClient from "./InvoiceClient";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: {
      user: true,
      items: { with: { category: true } },
    },
  });

  if (!invoice) {
    notFound();
  }

  // Regular users may only view their own invoices
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "PAYROLL_MANAGER" &&
    invoice.userId !== session.user.id
  ) {
    redirect("/");
  }

  return (
    <InvoiceClient
      invoice={invoice}
      currentUserRole={session.user.role}
      currentUserId={session.user.id}
    />
  );
}
