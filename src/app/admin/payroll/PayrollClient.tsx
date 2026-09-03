"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { submitPayrollRun, approvePayrollRun } from "@/app/actions";
import DownloadPdfButton from "@/components/dashboard/DownloadPdfButton";

interface RunInfo {
  status: "PENDING_APPROVAL" | "APPROVED";
  grandTotal: number;
  notes: string | null;
  approvalDeadline: string | null;
  submittedByName: string | null;
  submittedAt: string;
  approvedByName: string | null;
  approvedAt: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface PayrollInvoice {
  id: string;
  invoiceNumber: number;
  status: string;
  totalHours: number;
  totalCost: number;
  user: { id: string; name: string | null; email: string; archived?: boolean; company: Company | null } | null;
}

interface FixedStaffMember {
  id: string;
  name: string;
  monthlyAmount: number;
  company: Company | null;
}

const NO_COMPANY = "No Company Assigned";

export default function PayrollClient({
  selectedDate,
  availableDates,
  invoices,
  fixedStaff,
  run,
  currentUserRole,
}: {
  selectedDate: string;
  availableDates: string[];
  invoices: PayrollInvoice[];
  fixedStaff: FixedStaffMember[];
  run: RunInfo | null;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const isAdmin = currentUserRole === "ADMIN";

  const deadlineText = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("en-US", {
          timeZone: "America/New_York",
          weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        }) + " ET"
      : null;

  const handleSubmit = async () => {
    if (!confirm(`Submit payroll for ${selectedDate} to the approver? They'll get an email with the total and your note.`)) return;
    setBusy(true);
    try {
      const res = await submitPayrollRun(selectedDate, notes);
      alert(`Submitted! ${res.approversNotified} approver${res.approversNotified === 1 ? "" : "s"} notified. Approval is due ${res.deadline}.`);
      setNotes("");
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to submit payroll run.");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm(`Approve payroll for ${selectedDate}? This approves all pending invoices on the run.`)) return;
    setBusy(true);
    try {
      await approvePayrollRun(selectedDate);
      alert("Payroll approved!");
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to approve payroll run.");
    } finally {
      setBusy(false);
    }
  };

  // Group invoices and fixed staff under their company name
  const groups = new Map<string, { invoices: PayrollInvoice[]; staff: FixedStaffMember[] }>();
  const groupOf = (name: string) => {
    if (!groups.has(name)) groups.set(name, { invoices: [], staff: [] });
    return groups.get(name)!;
  };
  for (const inv of invoices) groupOf(inv.user?.company?.name || NO_COMPANY).invoices.push(inv);
  for (const s of fixedStaff) groupOf(s.company?.name || NO_COMPANY).staff.push(s);

  const companyNames = [...groups.keys()].sort((a, b) =>
    a === NO_COMPANY ? 1 : b === NO_COMPANY ? -1 : a.localeCompare(b)
  );

  const invoiceTotal = invoices.reduce((sum, i) => sum + i.totalCost, 0);
  const fixedTotal = fixedStaff.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const grandTotal = invoiceTotal + fixedTotal;
  const approvedCount = invoices.filter((i) => i.status === "APPROVED").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Run Payroll</h1>
          <p className="text-sm text-slate-500 mt-1">
            All invoices for one payment date, grouped by company, plus fixed-pay staff for the period.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Payment Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => router.push(`/admin/payroll?date=${e.target.value}`)}
              className="border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-nreuv-accent outline-none"
            />
          </div>
          {availableDates.length > 0 && (
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Jump to</label>
              <select
                value={availableDates.includes(selectedDate) ? selectedDate : ""}
                onChange={(e) => e.target.value && router.push(`/admin/payroll?date=${e.target.value}`)}
                className="border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-nreuv-accent outline-none"
              >
                <option value="">Dates with invoices…</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>{format(new Date(`${d}T00:00:00`), "MMM dd, yyyy")}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Approval status / actions */}
      {run?.status === "APPROVED" ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-bold text-green-800">✓ Payroll approved</p>
          <p className="text-sm text-green-700 mt-1">
            ${run.grandTotal.toFixed(2)} approved by {run.approvedByName || "the payroll approver"} on{" "}
            {run.approvedAt ? new Date(run.approvedAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""} ET.
          </p>
          {run.notes && <p className="text-sm text-green-700 mt-1 italic">Note: {run.notes}</p>}
        </div>
      ) : run?.status === "PENDING_APPROVAL" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-amber-800">⏳ Awaiting approval</p>
              <p className="text-sm text-amber-700 mt-1">
                ${run.grandTotal.toFixed(2)} submitted by {run.submittedByName || "an admin"}.
                {run.approvalDeadline && (
                  <> Approval due <strong>{deadlineText(run.approvalDeadline)}</strong>.</>
                )}
              </p>
              {run.notes && <p className="text-sm text-amber-700 mt-1 italic">Note: {run.notes}</p>}
            </div>
            {(currentUserRole === "PAYROLL_APPROVER" || isAdmin) && (
              <button
                onClick={handleApprove}
                disabled={busy}
                className="bg-green-700 hover:bg-green-800 text-white font-bold px-5 py-2.5 rounded-lg disabled:opacity-50"
              >
                Approve Payroll
              </button>
            )}
          </div>
        </div>
      ) : isAdmin ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-bold text-slate-800 mb-1">Send to approver</p>
          <p className="text-sm text-slate-500 mb-3">
            Review the numbers below, add a note if you like, then submit. The payroll approver gets an
            email and must approve by 3 PM ET on the Thursday before the pay date.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for the approver (optional) — e.g. anything unusual this period"
            rows={2}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none mb-3"
          />
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="bg-nreuv-primary hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-lg disabled:opacity-50"
          >
            Submit Payroll for Approval
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">This pay period hasn&apos;t been submitted for approval yet.</p>
        </div>
      )}

      {/* Totals summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Invoices ({invoices.length}, {approvedCount} approved)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">${invoiceTotal.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Fixed-Pay Staff ({fixedStaff.length})</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">${fixedTotal.toFixed(2)}</p>
        </div>
        <div className="bg-nreuv-primary rounded-xl shadow-sm p-4 text-white">
          <p className="text-xs font-semibold uppercase opacity-80">Total Payroll — {format(new Date(`${selectedDate}T00:00:00`), "MMM dd, yyyy")}</p>
          <p className="text-2xl font-bold mt-1">${grandTotal.toFixed(2)}</p>
        </div>
      </div>

      {companyNames.length === 0 ? (
        <p className="text-slate-600">
          No invoices for this date and no fixed staff configured. Pick another date above.
        </p>
      ) : (
        companyNames.map((companyName) => {
          const g = groups.get(companyName)!;
          const subtotal =
            g.invoices.reduce((s, i) => s + i.totalCost, 0) +
            g.staff.reduce((s, m) => s + m.monthlyAmount, 0);
          return (
            <div key={companyName} className="mb-6 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex justify-between items-center px-5 py-3 bg-slate-50 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">{companyName}</h2>
                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <table className="min-w-full text-sm">
                <tbody>
                  {g.invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {inv.user?.name || inv.user?.email || "Unknown"}
                        {inv.user?.archived && <span className="ml-2 text-xs text-slate-400 italic">(archived)</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-500">Invoice #{inv.invoiceNumber} · {inv.totalHours} hrs</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          inv.status === "APPROVED" ? "bg-green-100 text-green-800" :
                          inv.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>{inv.status}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-900">${inv.totalCost.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-3">
                          {isAdmin && (
                            <Link href={`/invoices/${inv.id}`} className="text-nreuv-primary hover:underline">View</Link>
                          )}
                          <DownloadPdfButton invoiceId={inv.id} />
                        </span>
                      </td>
                    </tr>
                  ))}
                  {g.staff.map((m) => (
                    <tr key={m.id} className="border-b border-slate-50 bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-800">{m.name}</td>
                      <td className="px-5 py-3 text-slate-500">Fixed pay per period</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-200 text-slate-700">FIXED</span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-900">${m.monthlyAmount.toFixed(2)}</td>
                      <td className="px-5 py-3"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
