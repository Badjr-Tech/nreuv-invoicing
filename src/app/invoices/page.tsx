import { auth } from "@/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { desc } from "drizzle-orm";
import { format } from "date-fns";
import Link from "next/link";
import DownloadPdfButton from "@/components/dashboard/DownloadPdfButton";
import { redirect } from "next/navigation";

export default async function InvoicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Admin and Managers see all, users see only theirs
  let userInvoices;
  if (session.user.role === "ADMIN" || session.user.role === "PAYROLL_MANAGER") {
      userInvoices = await db.query.invoices.findMany({
        with: { items: true, user: true },
        orderBy: [desc(invoices.invoiceDate)],
      });
  } else {
      userInvoices = await db.query.invoices.findMany({
        where: (invoices, { eq }) => eq(invoices.userId, session.user.id),
        with: { items: true, user: true },
        orderBy: [desc(invoices.invoiceDate)],
      });
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-nreuv-black">All Invoices</h1>
        {(session.user.role === "USER" || session.user.role === "EMPLOYEE") && (
          <Link
            href="/invoices/new"
            className="px-4 py-2 bg-nreuv-accent text-white font-medium rounded hover:opacity-90 transition-colors"
          >
            + Create New Invoice
          </Link>
        )}
      </div>

      {userInvoices.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border border-slate-200">
          <p className="text-slate-500 mb-4">No invoices found.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold text-sm">Invoice ID / Number</th>
                  {(session.user.role === "ADMIN" || session.user.role === "PAYROLL_MANAGER") && (
                    <th className="py-3 px-4 font-semibold text-sm">Employee</th>
                  )}
                  <th className="py-3 px-4 font-semibold text-sm">Payment Date</th>
                  <th className="py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="py-3 px-4 font-semibold text-sm text-right">Total</th>
                  <th className="py-3 px-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-sm text-slate-900 font-medium">
                      {invoice.invoiceNumber ? `#${invoice.invoiceNumber.toString().padStart(2, '0')}` : invoice.id.split('-')[0]}
                    </td>
                    {(session.user.role === "ADMIN" || session.user.role === "PAYROLL_MANAGER") && (
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {invoice.user?.name || invoice.user?.email || 'Unknown'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" :
                          invoice.status === "PENDING_MANAGER" ? "bg-purple-100 text-purple-800" :
                          invoice.status === "PENDING_ADMIN" ? "bg-blue-100 text-blue-800" :
                          invoice.status === "SENT" ? "bg-blue-100 text-blue-800" :
                          "bg-green-100 text-green-800"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900 font-medium text-right">
                      ${invoice.totalCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right flex justify-end gap-3 items-center">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-nreuv-primary hover:text-nreuv-accent font-medium text-sm transition-colors"
                      >
                        View
                      </Link>
                      <DownloadPdfButton invoiceId={invoice.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}