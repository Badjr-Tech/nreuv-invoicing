"use client";

import { useMemo, useState } from "react";

interface Row {
  userId: string;
  name: string;
  email: string;
  role: string;
  doneCount: number;
  totalCount: number;
  remainingTasks: string[];
}

interface Props {
  rows: Row[];
  totalTasks: number;
}

type Filter = "all" | "in_progress" | "not_started" | "complete";

export default function AdminOnboardingClient({ rows, totalTasks }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "complete") return r.doneCount === r.totalCount && r.totalCount > 0;
      if (filter === "not_started") return r.doneCount === 0;
      if (filter === "in_progress")
        return r.doneCount > 0 && r.doneCount < r.totalCount;
      return true;
    });
  }, [rows, filter]);

  // Roll-up stats
  const stats = useMemo(() => {
    const total = rows.length;
    const complete = rows.filter((r) => r.doneCount === r.totalCount && r.totalCount > 0).length;
    const notStarted = rows.filter((r) => r.doneCount === 0).length;
    const inProgress = total - complete - notStarted;
    return { total, complete, notStarted, inProgress };
  }, [rows]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-2 md:p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-nreuv-black tracking-tight">
          Onboarding Progress
        </h1>
        <p className="text-slate-600 mt-1 text-sm">
          Track every team member's progress through the {totalTasks}-step checklist.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Team members" value={stats.total} />
        <StatCard label="Complete" value={stats.complete} tone="green" />
        <StatCard label="In progress" value={stats.inProgress} tone="amber" />
        <StatCard label="Not started" value={stats.notStarted} tone="red" />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", "All"],
            ["in_progress", "In progress"],
            ["not_started", "Not started"],
            ["complete", "Complete"],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === k
                ? "bg-nreuv-primary text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No team members match this filter.
          </div>
        ) : (
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Email</th>
                <th className="py-3 px-4 font-semibold hidden lg:table-cell">Role</th>
                <th className="py-3 px-4 font-semibold w-1/3">Progress</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const pct = r.totalCount === 0 ? 0 : Math.round((r.doneCount / r.totalCount) * 100);
                const allDone = r.doneCount === r.totalCount && r.totalCount > 0;
                const notStarted = r.doneCount === 0;
                const isOpen = expanded.has(r.userId);
                return (
                  <>
                    <tr
                      key={r.userId}
                      onClick={() => toggle(r.userId)}
                      className="hover:bg-slate-50/60 cursor-pointer"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span aria-hidden className="text-slate-400 text-xs">
                            {isOpen ? "▾" : "▸"}
                          </span>
                          {r.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 hidden md:table-cell">
                        {r.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 hidden lg:table-cell">
                        {r.role}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[80px]">
                            <div
                              className={`h-full ${
                                allDone
                                  ? "bg-green-500"
                                  : notStarted
                                    ? "bg-slate-300"
                                    : "bg-nreuv-accent"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                            {r.doneCount}/{r.totalCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            allDone
                              ? "bg-green-100 text-green-800"
                              : notStarted
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {allDone ? "Complete" : notStarted ? "Not started" : `${pct}%`}
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${r.userId}-detail`} className="bg-slate-50/50">
                        <td colSpan={5} className="px-4 py-4">
                          {r.remainingTasks.length === 0 ? (
                            <div className="text-sm text-slate-500">
                              All caught up — nothing left to do.
                            </div>
                          ) : (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                Outstanding ({r.remainingTasks.length})
                              </div>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                {r.remainingTasks.map((title, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-slate-700 flex items-start gap-2"
                                  >
                                    <span className="text-slate-300 mt-0.5">○</span>
                                    {title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "green" | "amber" | "red";
}) {
  const toneClasses: Record<string, string> = {
    slate: "text-slate-900",
    green: "text-green-700",
    amber: "text-amber-700",
    red: "text-red-700",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${toneClasses[tone]}`}>{value}</div>
    </div>
  );
}
