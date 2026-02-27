import { auth } from "@/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm"; // Added asc
import { format, differenceInDays } from "date-fns";
import { redirect } from "next/navigation";
import Link from "next/link";
import DownloadPdfButton from "./DownloadPdfButton";

async function getUserInvoices(userId: string) {
  return db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    with: { paymentSchedule: true },
    orderBy: [desc(invoices.invoiceDate)],
  });
}

function getCountdownMessage(dueDate: Date, status: string) {
  if (status !== "DRAFT") {
    return null;
  }

  const daysLeft = differenceInDays(dueDate, new Date());
  let colorClass = "text-black";

  if (daysLeft >= 5) {
    colorClass = "text-green-500";
  } else if (daysLeft >= 2 && daysLeft <= 4) {
    colorClass = "text-yellow-500";
  } else if (daysLeft <= 1 && daysLeft >= 0) { // Changed to include 0 days
    colorClass = "text-red-500";
  } else if (daysLeft < 0) { // Explicitly for overdue
    colorClass = "text-red-500";
  }

  return (
    <span className={`font-semibold ${colorClass}`}>
      {daysLeft >= 0 ? `Due in ${daysLeft} days` : `Overdue by ${Math.abs(daysLeft)} days`}
    </span>
  );
}

export default async function UserDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userInvoices = await getUserInvoices(session.user.id);

  // Find the nearest DRAFT invoice due date
  const today = new Date();
  let nextInvoiceDueInDays: number | null = null;

  const draftInvoices = userInvoices.filter(inv => inv.status === "DRAFT");
  if (draftInvoices.length > 0) {
    const sortedDrafts = draftInvoices.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const nearestDraft = sortedDrafts.find(inv => new Date(inv.dueDate) >= today);

    if (nearestDraft) {
      nextInvoiceDueInDays = differenceInDays(new Date(nearestDraft.dueDate), today);
    }
  }


  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-black mb-4">My Invoices</h1>

      {nextInvoiceDueInDays !== null && nextInvoiceDueInDays >= 0 && (
        <div className="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3 mb-4" role="alert">
          <p className="font-bold">Heads up!</p>
          <p>Next invoice due in {nextInvoiceDueInDays} days.</p>
        </div>
      )}

      {userInvoices.length === 0 ? (
        <p className="text-gray-600">No invoices found. Start by creating a new invoice.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Invoice Date
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Countdown
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
              </tr>
            </thead>
            <tbody>
              {userInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{format(new Date(invoice.invoiceDate), "yyyy-MM-dd")}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{format(new Date(invoice.dueDate), "yyyy-MM-dd")}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span
                      className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                        invoice.status === "DRAFT" ? "text-yellow-900" : invoice.status === "SENT" ? "text-blue-900" : "text-green-900"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`absolute inset-0 opacity-50 rounded-full ${
                          invoice.status === "DRAFT" ? "bg-yellow-200" : invoice.status === "SENT" ? "bg-blue-200" : "bg-green-200"
                        }`}
                      ></span>
                      <span className="relative">{invoice.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{invoice.totalHours}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">${invoice.totalCost.toFixed(2)}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    {getCountdownMessage(new Date(invoice.dueDate), invoice.status)}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right flex gap-2 justify-end">
                    <Link href={`/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center">
                      View
                    </Link>
                    <DownloadPdfButton invoiceId={invoice.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}