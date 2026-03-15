"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateInvoiceStatus, deferInvoice } from '@/app/actions';
import Link from 'next/link';
import DownloadPdfButton from '@/components/dashboard/DownloadPdfButton';

interface InvoiceClientProps {
  invoice: any; // Ideally use proper types from schema
  currentUserRole: string;
  currentUserId: string;
}

export default function InvoiceClient({ invoice, currentUserRole, currentUserId }: InvoiceClientProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = invoice.userId === currentUserId;
  const isAdminOrManager = currentUserRole === "ADMIN" || currentUserRole === "PAYROLL_MANAGER";

  const handleStatusChange = async (newStatus: "PENDING_MANAGER" | "PENDING_ADMIN" | "APPROVED") => {
    setIsUpdating(true);
    setError(null);
    try {
      await updateInvoiceStatus(invoice.id, newStatus);
      router.refresh();
      // Only set to false on error, let the page refresh handle the successful state
    } catch (err: any) {
      setError(err.message || `Failed to update status to ${newStatus}.`);
      setIsUpdating(false);
    }
  };

  const handleDefer = async () => {
    if (!confirm("Are you sure you want to defer this invoice to the next pay cycle? This will push its payment and submission dates forward and return its status to Draft.")) return;
    setIsUpdating(true);
    setError(null);
    try {
      await deferInvoice(invoice.id);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to defer invoice.");
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-sm border border-slate-100 rounded-xl p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nreuv-black">
            Invoice {invoice.invoiceNumber ? `#${invoice.invoiceNumber.toString().padStart(2, '0')}` : 'Details'}
          </h1>
          {invoice.status === "DRAFT" && (
            <p className="text-sm text-yellow-700 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              This is a draft invoice. Please review it carefully. When ready, click "Submit Invoice" below to send it for approval.
            </p>
          )}
          <p className="text-sm text-slate-500 mt-1">ID: {invoice.id}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              invoice.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" :
              invoice.status === "PENDING_MANAGER" ? "bg-purple-100 text-purple-800" :
              invoice.status === "PENDING_ADMIN" ? "bg-blue-100 text-blue-800" :
              "bg-green-100 text-green-800"
            }`}
          >
            {invoice.status}
          </span>
          <DownloadPdfButton invoiceId={invoice.id} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
        <div>
          <p className="text-sm font-semibold text-slate-500">Payment Date</p>
          <p className="text-lg font-medium text-slate-900">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Submission Deadline</p>
          <p className="text-lg font-medium text-slate-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Total Hours</p>
          <p className="text-lg font-medium text-slate-900">{invoice.totalHours}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Total Cost</p>
          <p className="text-lg font-medium text-slate-900">${invoice.totalCost.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <th className="py-3 px-4 font-semibold text-sm">Date</th>
                <th className="py-3 px-4 font-semibold text-sm">Description</th>
                <th className="py-3 px-4 font-semibold text-sm w-32">Hours</th>
                <th className="py-3 px-4 font-semibold text-sm w-32">Rate</th>
                <th className="py-3 px-4 font-semibold text-sm w-32 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-sm text-slate-900">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm text-slate-900">{item.description}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{item.hours}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">${item.rate.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 font-medium text-right">${(item.hours * item.rate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={4} className="py-4 px-4 text-right font-bold text-slate-700">Grand Total:</td>
                <td className="py-4 px-4 text-right font-bold text-lg text-nreuv-primary">${invoice.totalCost.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100">
        {/* Only Owner can edit, and only if DRAFT */}
        {isOwner && invoice.status === "DRAFT" && (
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors border border-slate-200"
          >
            Edit Invoice
          </Link>
        )}

        {/* Owner can submit DRAFT to next stage */}
        {isOwner && invoice.status === "DRAFT" && (
          <button
            onClick={() => handleStatusChange(invoice.user?.managerId ? "PENDING_MANAGER" : "PENDING_ADMIN")}
            disabled={isUpdating}
            className="px-6 py-2.5 bg-nreuv-primary hover:opacity-90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isUpdating ? "Submitting..." : "Submit Invoice"}
          </button>
        )}

        {/* Manager can pre-approve PENDING_MANAGER invoices */}
        {currentUserRole === "PAYROLL_MANAGER" && invoice.status === "PENDING_MANAGER" && invoice.user?.managerId === currentUserId && (
          <button
            onClick={() => handleStatusChange("PENDING_ADMIN")}
            disabled={isUpdating}
            className="px-6 py-2.5 bg-nreuv-primary hover:opacity-90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isUpdating ? "Pre-Approving..." : "Pre-Approve Invoice"}
          </button>
        )}

        {/* Admin can approve PENDING_ADMIN invoices */}
        {currentUserRole === "ADMIN" && (invoice.status === "PENDING_ADMIN" || invoice.status === "PENDING_MANAGER") && (
          <>
            <button
              onClick={handleDefer}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isUpdating ? "Processing..." : "Defer Invoice"}
            </button>
            <button
              onClick={() => handleStatusChange("APPROVED")}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isUpdating ? "Approving..." : "Approve Invoice"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
