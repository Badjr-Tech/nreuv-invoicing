import { auth } from "@/auth";
import { db } from "@/db";
import { payrollRuns } from "@/db/schema";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const fmt = (d: Date | null) =>
  d
    ? d.toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) + " ET"
    : "—";

export default async function PayrollHistoryPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PAYROLL_APPROVER")) {
    redirect("/auth/signin");
  }

  const runs = await db.query.payrollRuns.findMany({
    with: { submittedBy: true, approvedBy: true },
    orderBy: [desc(payrollRuns.payDate)],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Payroll History</h1>
        <Link href="/admin/payroll" className="text-sm text-nreuv-primary hover:underline">← Back to Run Payroll</Link>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        The complete audit trail: every payroll run, who submitted it, who approved it, and when.
      </p>

      {runs.length === 0 ? (
        <p className="text-slate-600">No payroll runs yet.</p>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <div key={run.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-lg font-bold text-slate-900">
                    {format(new Date(`${run.payDate}T00:00:00`), "MMMM d, yyyy")}
                  </span>
                  <span className={`ml-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    run.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {run.status === "APPROVED" ? "✓ Approved" : "⏳ Awaiting approval"}
                  </span>
                </div>
                <span className="text-xl font-bold text-slate-900">${run.grandTotal.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Submitted</p>
                  <p className="text-slate-800">{run.submittedBy?.name || "—"}</p>
                  <p className="text-slate-500 text-xs">{fmt(run.submittedAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Approved</p>
                  <p className="text-slate-800">{run.approvedBy?.name || (run.status === "APPROVED" ? "—" : "pending")}</p>
                  <p className="text-slate-500 text-xs">{fmt(run.approvedAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Breakdown</p>
                  <p className="text-slate-800">
                    {run.invoiceCount} invoice{run.invoiceCount === 1 ? "" : "s"} (${run.invoiceTotal.toFixed(2)}) + fixed ${run.fixedStaffTotal.toFixed(2)}
                  </p>
                  {run.approvalDeadline && (
                    <p className="text-slate-500 text-xs">deadline was {fmt(run.approvalDeadline)}</p>
                  )}
                </div>
              </div>
              {run.notes && <p className="mt-3 text-sm text-slate-600 italic border-l-2 border-slate-200 pl-3">{run.notes}</p>}
              <div className="mt-3 flex flex-wrap gap-3 items-center">
                {(run.attachments || []).map((a, i) => (
                  <a
                    key={i}
                    href={`/api/payroll/screenshot?url=${encodeURIComponent(a.url)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-nreuv-primary underline"
                  >
                    📎 Screenshot {i + 1}
                  </a>
                ))}
                <Link href={`/admin/payroll?date=${run.payDate}`} className="text-sm text-slate-500 hover:text-slate-800 underline">
                  View this run
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
