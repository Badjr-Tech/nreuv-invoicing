"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import DownloadPdfButton from "@/components/dashboard/DownloadPdfButton";

interface InvoicesClientProps {
  userInvoices: any[];
  allUsers: any[];
  currentUserRole: string;
}

export default function InvoicesClient({ userInvoices, allUsers, currentUserRole }: InvoicesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filterUser = searchParams.get("filterUser") || "";
  const filterStatus = searchParams.get("filterStatus") || "";
  const filterPaymentDateStart = searchParams.get("filterPaymentDateStart") || "";

  const handleFilterChange = (param: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(param, value);
    } else {
      params.delete(param);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-nreuv-black">All Invoices</h1>
        {(currentUserRole === "USER" || currentUserRole === "EMPLOYEE") && (
          <Link
            href="/invoices/new"
            className="px-4 py-2 bg-nreuv-accent text-white font-medium rounded hover:opacity-90 transition-colors"
          >
            + Create New Invoice
          </Link>
        )}
      </div>

      {(currentUserRole === "ADMIN" || currentUserRole === "PAYROLL_MANAGER") && (
        <div className="mb-6 p-5 bg-white rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-nreuv-black mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Contractor</label>
              <select
                className="border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-nreuv-accent focus:border-transparent outline-none bg-white w-full"
                value={filterUser}
                onChange={(e) => handleFilterChange("filterUser", e.target.value)}
              >
                <option value="">All Contractors</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
              <select
                className="border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-nreuv-accent focus:border-transparent outline-none bg-white w-full"
                value={filterStatus}
                onChange={(e) => handleFilterChange("filterStatus", e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_MANAGER">Pending Manager</option>
                <option value="PENDING_ADMIN">Pending Admin</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Payment Date</label>
              <input
                type="date"
                className="border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-nreuv-accent focus:border-transparent outline-none bg-white w-full"
                value={filterPaymentDateStart}
                onChange={(e) => handleFilterChange("filterPaymentDateStart", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

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
                  {(currentUserRole === "ADMIN" || currentUserRole === "PAYROLL_MANAGER") && (
                    <th className="py-3 px-4 font-semibold text-sm">Employee</th>
                  )}
                  <th className="py-3 px-4 font-semibold text-sm">Payment Date</th>
                  <th className="py-3 px-4 font-semibold text-sm">Total Hours</th>
                  <th className="py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="py-3 px-4 font-semibold text-sm text-right">Total</th>
                  <th className="py-3 px-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    {(currentUserRole === "ADMIN" || currentUserRole === "PAYROLL_MANAGER") && (
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {invoice.user?.name || invoice.user?.email || 'Unknown'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900">
                      {invoice.totalHours}
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
    </>
  );
}
