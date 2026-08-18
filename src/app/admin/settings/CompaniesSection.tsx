"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCompany, updateCompany, deleteCompany } from "@/app/actions";

interface Company {
  id: string;
  name: string;
}

export default function CompaniesSection({ initialCompanies }: { initialCompanies: Company[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await createCompany(newName);
      setNewName("");
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to add company.");
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (id: string) => {
    setBusy(true);
    try {
      await updateCompany(id, editingName);
      setEditingId(null);
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to rename company.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete company "${name}"? Employees assigned to it will simply become unassigned — no invoices or people are deleted.`)) return;
    setBusy(true);
    try {
      await deleteCompany(id);
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to delete company.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Companies</h2>
      <p className="text-sm text-slate-500 mb-4">
        Tag employees with a company. Dashboards and payroll runs are grouped by company.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New company name"
          className="border border-slate-300 rounded-lg p-2.5 flex-grow focus:ring-2 focus:ring-nreuv-accent outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={busy || !newName.trim()}
          className="bg-nreuv-primary text-white font-medium px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          + Add Company
        </button>
      </div>

      {initialCompanies.length === 0 ? (
        <p className="text-slate-500 italic text-sm">No companies yet. Add one above.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {initialCompanies.map((c) => (
            <li key={c.id} className="py-2.5 flex items-center justify-between gap-3">
              {editingId === c.id ? (
                <>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 flex-grow focus:ring-2 focus:ring-nreuv-accent outline-none"
                    autoFocus
                  />
                  <button onClick={() => handleRename(c.id)} disabled={busy} className="text-sm font-medium text-green-700 hover:underline">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-slate-500 hover:underline">Cancel</button>
                </>
              ) : (
                <>
                  <span className="font-medium text-slate-800">{c.name}</span>
                  <span className="flex gap-3">
                    <button onClick={() => { setEditingId(c.id); setEditingName(c.name); }} className="text-sm text-nreuv-primary hover:underline">Rename</button>
                    <button onClick={() => handleDelete(c.id, c.name)} disabled={busy} className="text-sm text-red-600 hover:underline">Delete</button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
