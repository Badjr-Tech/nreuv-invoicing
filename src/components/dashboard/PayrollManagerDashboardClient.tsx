"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import DownloadPdfButton from "./DownloadPdfButton";
import EmployeeSidebar from "./EmployeeSidebar"; // Assuming EmployeeSidebar is reusable

type InvoiceStatus = "DRAFT" | "SENT" | "APPROVED";

export default function PayrollManagerDashboardClient({ initialInvoices, users }: { initialInvoices: any[], users: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentFilterUser, setCurrentFilterUser] = useState("");
  const [currentFilterStatus, setCurrentFilterStatus] = useState<"DRAFT" | "PENDING_MANAGER" | "PENDING_ADMIN" | "APPROVED" | "">("");
  const [filterPaymentDateStart, setFilterPaymentDateStart] = useState("");
  const [filterPaymentDateEnd, setFilterPaymentDateEnd] = useState("");
  const [filterDueDateStart, setFilterDueDateStart] = useState("");
  const [filterDueDateEnd, setFilterDueDateEnd] = useState("");

  const [currentSortField, setCurrentSortField] = useState("invoiceDate");
  const [currentSortOrder, setCurrentSortOrder] = useState<"asc" | "desc">("desc");

  // Effect to update local state when searchParams change (e.g., from pagination or outside filters)
  useEffect(() => {
    setCurrentFilterUser(searchParams.get("filterUser") || "");
    setCurrentFilterStatus((searchParams.get("filterStatus") as "DRAFT" | "PENDING_MANAGER" | "PENDING_ADMIN" | "APPROVED" | "") || "");
    setFilterPaymentDateStart(searchParams.get("filterPaymentDateStart") || "");
    setFilterPaymentDateEnd(searchParams.get("filterPaymentDateEnd") || "");
    setFilterDueDateStart(searchParams.get("filterDueDateStart") || "");
    setFilterDueDateEnd(searchParams.get("filterDueDateEnd") || "");
    setCurrentSortField(searchParams.get("sortField") || "invoiceDate"); // Keep as "invoiceDate" as it refers to the DB field
    setCurrentSortOrder((searchParams.get("sortOrder") as "asc" | "desc") || "desc");
  }, [searchParams]);

  const handleSort = (field: string) => {
    const order = currentSortField === field && currentSortOrder === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortField", field);
    params.set("sortOrder", order);
    router.push(`?${params.toString()}`);
  };

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
    <div className="p-4 flex gap-4">
      <EmployeeSidebar users={users} /> 

      <div className="flex-grow">
        <h1 className="text-2xl font-bold text-black mb-4">Payroll Manager Dashboard</h1>

        <div className="mb-6 p-5 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-nreuv-black">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="flex flex-col w-full">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Contractor</label>
              <select 
                className="border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-nreuv-accent focus:border-transparent outline-none bg-white w-full" 
                value={currentFilterUser} 
                onChange={(e) => handleFilterChange("filterUser", e.target.value)}
              >
                <option value="">All Contractors</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col w-full">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
              <select 
                 className="border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-nreuv-accent focus:border-transparent outline-none bg-white w-full"
                 value={currentFilterStatus}
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
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Payment Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="border p-2 rounded text-sm w-full outline-none focus:ring-2 focus:ring-nreuv-accent"
                value={filterInvoiceDateStart}
                onChange={(e) => setFilterInvoiceDateStart(e.target.value)}
              />
              <span className="text-slate-400 self-center">-</span>
              <input
                type="date"
                className="border p-2 rounded text-sm w-full outline-none focus:ring-2 focus:ring-nreuv-accent"
                value={filterInvoiceDateEnd}
                onChange={(e) => setFilterInvoiceDateEnd(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Submission Deadline Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="border p-2 rounded text-sm w-full outline-none focus:ring-2 focus:ring-nreuv-accent"
                value={filterDueDateStart}
                onChange={(e) => setFilterDueDateStart(e.target.value)}
              />
              <span className="text-slate-400 self-center">-</span>
              <input
                type="date"
                className="border p-2 rounded text-sm w-full outline-none focus:ring-2 focus:ring-nreuv-accent"
                value={filterDueDateEnd}
                onChange={(e) => setFilterDueDateEnd(e.target.value)}
              />
            </div>
          </div>
          </div>
        </div>

        {initialInvoices.length === 0 ? (
          <p className="text-gray-600">No invoices found matching criteria.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th 
                  className="px-5 py-3 border-b-2 border-slate-200 bg-slate-100 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                  onClick={() => handleSort("user.name")}
                >
                  Employee {currentSortField === "user.name" && (currentSortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="px-5 py-3 border-b-2 border-slate-200 bg-slate-100 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                  onClick={() => handleSort("invoiceDate")}
                >
                  Payment Date {currentSortField === "invoiceDate" && (currentSortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="px-5 py-3 border-b-2 border-slate-200 bg-slate-100 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                  onClick={() => handleSort("dueDate")}
                >
                  Submission Deadline {currentSortField === "dueDate" && (currentSortOrder === "asc" ? "↑" : "↓")}
                </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("status")}>
                    Status {currentSortField === "status" && (currentSortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("totalHours")}>
                    Total Hours {currentSortField === "totalHours" && (currentSortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("totalCost")}>
                    Total Cost {currentSortField === "totalCost" && (currentSortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {initialInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{invoice.user?.name || invoice.user?.email}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{format(new Date(invoice.invoiceDate), "yyyy-MM-dd")}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{format(new Date(invoice.dueDate), "yyyy-MM-dd")}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <span
                        className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                          invoice.status === "DRAFT" ? "text-yellow-900" :
                          invoice.status === "PENDING_MANAGER" ? "text-purple-900" :
                          invoice.status === "PENDING_ADMIN" ? "text-blue-900" :
                          invoice.status === "SENT" ? "text-blue-900" :
                          "text-green-900"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`absolute inset-0 opacity-50 rounded-full ${
                            invoice.status === "DRAFT" ? "bg-yellow-200" :
                            invoice.status === "PENDING_MANAGER" ? "bg-purple-200" :
                            invoice.status === "PENDING_ADMIN" ? "bg-blue-200" :
                            invoice.status === "SENT" ? "bg-blue-200" :
                            "bg-green-200"
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
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right flex gap-2 justify-end">
                      <Link href={`/invoices/${invoice.id}`} className="text-nreuv-primary hover:text-nreuv-accent transition-colors flex items-center font-medium">
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
    </div>
  );
}