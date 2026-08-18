"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFixedStaff, updateFixedStaff, deleteFixedStaff } from "@/app/actions";

interface Company {
  id: string;
  name: string;
}

interface FixedStaffMember {
  id: string;
  name: string;
  companyId: string | null;
  company: Company | null;
  monthlyAmount: number;
  active: boolean;
}

export default function FixedStaffSection({
  initialStaff,
  companies,
}: {
  initialStaff: FixedStaffMember[];
  companies: Company[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    const monthlyAmount = parseFloat(amount);
    if (!name.trim() || isNaN(monthlyAmount)) return;
    setBusy(true);
    try {
      await createFixedStaff({ name, companyId: companyId || null, monthlyAmount });
      setName("");
      setCompanyId("");
      setAmount("");
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to add staff member.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (id: string, data: Parameters<typeof updateFixedStaff>[1]) => {
    setBusy(true);
    try {
      await updateFixedStaff(id, data);
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to update staff member.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string, staffName: string) => {
    if (!confirm(`Remove "${staffName}" from fixed monthly staff?`)) return;
    setBusy(true);
    try {
      await deleteFixedStaff(id);
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to delete staff member.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Fixed Monthly Staff</h2>
      <p className="text-sm text-slate-500 mb-4">
        Staff paid a fixed amount each month. They don&apos;t submit invoices, but their amount is
        automatically included in every payroll run.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
        />
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-nreuv-accent outline-none"
        >
          <option value="">No company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Monthly amount ($)"
          className="border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={busy || !name.trim() || !amount}
          className="bg-nreuv-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          + Add Staff
        </button>
      </div>

      {initialStaff.length === 0 ? (
        <p className="text-slate-500 italic text-sm">No fixed monthly staff yet.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Monthly Amount</th>
              <th className="py-2 pr-4">In Payroll?</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {initialStaff.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-2.5 pr-4 font-medium text-slate-800">{s.name}</td>
                <td className="py-2.5 pr-4">
                  <select
                    value={s.companyId || ""}
                    onChange={(e) => handleUpdate(s.id, { companyId: e.target.value || null })}
                    disabled={busy}
                    className="border border-slate-300 rounded-lg p-1.5 bg-white outline-none"
                  >
                    <option value="">No company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="text-slate-500 mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={s.monthlyAmount}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v !== s.monthlyAmount) handleUpdate(s.id, { monthlyAmount: v });
                    }}
                    disabled={busy}
                    className="border border-slate-300 rounded-lg p-1.5 w-28 outline-none"
                  />
                </td>
                <td className="py-2.5 pr-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.active}
                      onChange={(e) => handleUpdate(s.id, { active: e.target.checked })}
                      disabled={busy}
                    />
                    <span className="text-slate-600">{s.active ? "Included" : "Paused"}</span>
                  </label>
                </td>
                <td className="py-2.5 text-right">
                  <button onClick={() => handleDelete(s.id, s.name)} disabled={busy} className="text-red-600 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
