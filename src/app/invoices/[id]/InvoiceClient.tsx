"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateInvoiceStatus, deferInvoice, deleteInvoice, archiveInvoice, unarchiveInvoice, requestInvoiceChanges } from '@/app/actions';
import Link from 'next/link';
import DownloadPdfButton from '@/components/dashboard/DownloadPdfButton';
import { toCalendarDate } from '@/lib/date-utils';

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

  const handleDelete = async () => {
    const userLabel = invoice.user?.name || invoice.user?.email || "this user";
    const confirmMsg = `Permanently delete this invoice for ${userLabel}?\n\nThis removes the invoice and all its line items. This cannot be undone.`;
    if (!confirm(confirmMsg)) return;
    setIsUpdating(true);
    setError(null);
    try {
      await deleteInvoice(invoice.id);
      router.push("/invoices");
    } catch (err: any) {
      setError(err.message || "Failed to delete invoice.");
      setIsUpdating(false);
    }
  };

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueMessage, setIssueMessage] = useState('');
  const [issueResetDraft, setIssueResetDraft] = useState(true);

  const handleSubmitIssue = async () => {
    if (issueMessage.trim().length < 10) {
      setError("Please describe the issue in at least 10 characters.");
      return;
    }
    setIsUpdating(true);
    setError(null);
    try {
      await requestInvoiceChanges(invoice.id, issueMessage, issueResetDraft);
      setShowIssueModal(false);
      setIssueMessage('');
      router.refresh();
      alert("Changes requested. The contractor has been emailed and notified.");
    } catch (err: any) {
      setError(err.message || "Failed to send issue notice.");
      setIsUpdating(false);
    }
  };

  const handleArchiveToggle = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      if (invoice.archivedAt) {
        await unarchiveInvoice(invoice.id);
      } else {
        await archiveInvoice(invoice.id);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update archive state.");
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
          {invoice.archivedAt && (
            <p className="text-sm text-slate-700 mt-2 p-2 bg-slate-100 border border-slate-300 rounded-md">
              <strong>Archived</strong> on {new Date(invoice.archivedAt).toLocaleDateString()}.
              Hidden from default list views.
            </p>
          )}
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
          <p className="text-lg font-medium text-slate-900">{toCalendarDate(invoice.invoiceDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Submission Deadline</p>
          <p className="text-lg font-medium text-slate-900">{toCalendarDate(invoice.dueDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Total Hours</p>
          <p className="text-lg font-medium text-slate-900">{invoice.totalHours}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Total Cost</p>
          <p className="text-lg font-medium text-slate-900">${invoice.totalCost.toFixed(2)}</p>
        </div>
        {/* Manager/admin-only audit dates */}
        {isAdminOrManager && (
          <>
            <div>
              <p className="text-sm font-semibold text-slate-500">Submitted On</p>
              <p className="text-lg font-medium text-slate-900">
                {invoice.submittedDate
                  ? new Date(invoice.submittedDate).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : <span className="text-slate-400 italic text-base font-normal">Not yet submitted</span>}
              </p>
            </div>
            {invoice.approvedDate && (
              <div>
                <p className="text-sm font-semibold text-slate-500">Approved On</p>
                <p className="text-lg font-medium text-slate-900">
                  {new Date(invoice.approvedDate).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <th className="py-3 px-4 font-semibold text-sm">Date</th>
                <th className="py-3 px-4 font-semibold text-sm">Category</th>
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
                  <td className="py-3 px-4 text-sm">
                    {item.category?.name ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {item.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Uncategorized</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-900">{item.description}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{item.hours}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">${item.rate.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 font-medium text-right">${(item.hours * item.rate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={5} className="py-4 px-4 text-right font-bold text-slate-700">Grand Total:</td>
                <td className="py-4 px-4 text-right font-bold text-lg text-nreuv-primary">${invoice.totalCost.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100">
        {/* Admin: archive (reversible) and delete (destructive). Grouped on the left. */}
        {currentUserRole === "ADMIN" && (
          <div className="mr-auto flex gap-2">
            <button
              onClick={handleArchiveToggle}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isUpdating
                ? "..."
                : invoice.archivedAt
                  ? "Unarchive"
                  : "Archive"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-white hover:bg-red-50 text-red-700 border border-red-300 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isUpdating ? "..." : "Delete"}
            </button>
          </div>
        )}
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

        {/* Admin / Payroll Manager can flag issues on any pending invoice. */}
        {(currentUserRole === "ADMIN" ||
          (currentUserRole === "PAYROLL_MANAGER" &&
            invoice.user?.managerId === currentUserId)) &&
          (invoice.status === "PENDING_ADMIN" || invoice.status === "PENDING_MANAGER") && (
            <button
              onClick={() => { setIssueMessage(''); setShowIssueModal(true); }}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-white hover:bg-orange-50 text-orange-700 border border-orange-300 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Request Changes
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

      {showIssueModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Request changes on this invoice</h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600">
                {invoice.user?.name || invoice.user?.email || "The contractor"} will receive an
                email with your notes verbatim plus a link back to this invoice.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  What needs to be fixed?
                </label>
                <textarea
                  value={issueMessage}
                  onChange={(e) => setIssueMessage(e.target.value)}
                  rows={5}
                  placeholder="E.g. Row 3's category is wrong; please re-categorize as Marketing. Row 5's hours look high for a single day — confirm or adjust."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
                />
                {issueMessage.trim().length > 0 && issueMessage.trim().length < 10 && (
                  <p className="text-red-500 text-xs mt-1">
                    {10 - issueMessage.trim().length} more character{10 - issueMessage.trim().length === 1 ? '' : 's'} needed.
                  </p>
                )}
              </div>
              <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={issueResetDraft}
                  onChange={(e) => setIssueResetDraft(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-nreuv-primary focus:ring-nreuv-accent"
                />
                <span>Send invoice back to <strong>Draft</strong> so the contractor can edit it.</span>
              </label>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setShowIssueModal(false)}
                className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitIssue}
                disabled={isUpdating || issueMessage.trim().length < 10}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:opacity-90 font-semibold disabled:opacity-50"
              >
                {isUpdating ? "Sending…" : "Send to Contractor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
