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

  const currentSortField = searchParams.get("sortField") || "invoiceDate";
  const currentSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
  const currentFilterUser = searchParams.get("filterUser") || "";
  const currentFilterStatus = (searchParams.get("filterStatus") as InvoiceStatus | "") || "";
  const currentFilterInvoiceDateStart = searchParams.get("filterInvoiceDateStart") || "";
  const currentFilterInvoiceDateEnd = searchParams.get("filterInvoiceDateEnd") || "";
  const currentFilterDueDateStart = searchParams.get("filterDueDateStart") || "";
  const currentFilterDueDateEnd = searchParams.get("filterDueDateEnd") || "";

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

        <div className="mb-6 p-4 bg-white rounded-lg shadow flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-4 items-center">
            <h2 className="text-xl font-semibold text-black">Filters</h2>
            <select 
              className="border p-2 rounded" 
              value={currentFilterUser} 
              onChange={(e) => handleFilterChange("filterUser", e.target.value)}
            >
              <option value="">All Users</option>
              {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
            <select 
               className="border p-2 rounded"
               value={currentFilterStatus}
               onChange={(e) => handleFilterChange("filterStatus", e.target.value)}
            >
               <option value="">All Statuses</option>
               <option value="DRAFT">Draft</option>
               <option value="SENT">Sent</option>
               <option value="APPROVED">Approved</option>
            </select>
            <input
              type="date"
              className="border p-2 rounded"
              placeholder="Invoice Date Start"
              value={currentFilterInvoiceDateStart}
              onChange={(e) => handleFilterChange("filterInvoiceDateStart", e.target.value)}
            />
            <input
              type="date"
              className="border p-2 rounded"
              placeholder="Invoice Date End"
              value={currentFilterInvoiceDateEnd}
              onChange={(e) => handleFilterChange("filterInvoiceDateEnd", e.target.value)}
            />
            <input
              type="date"
              className="border p-2 rounded"
              placeholder="Due Date Start"
              value={currentFilterDueDateStart}
              onChange={(e) => handleFilterChange("filterDueDateStart", e.target.value)}
            />
            <input
              type="date"
              className="border p-2 rounded"
              placeholder="Due Date End"
              value={currentFilterDueDateEnd}
              onChange={(e) => handleFilterChange("filterDueDateEnd", e.target.value)}
            />
          </div>
          {/* No DownloadCsvButton for Payroll Manager */}
        </div>

        {initialInvoices.length === 0 ? (
          <p className="text-gray-600">No invoices found matching criteria.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("userId")}>
                    Employee {currentSortField === "userId" && (currentSortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("invoiceDate")}>
                    Invoice Date {currentSortField === "invoiceDate" && (currentSortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("dueDate")}>
                    Due Date {currentSortField === "dueDate" && (currentSortOrder === "asc" ? "↑" : "↓")}
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
    </div>
  );
}