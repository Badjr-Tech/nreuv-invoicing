"use client";

import Link from "next/link";

interface EmployeeSummary {
  id: string;
  name: string | null;
  email: string;
  unreadNotifications?: number;
}

export default function EmployeeSidebar({ users }: { users: EmployeeSummary[] }) {
  return (
    <aside className="w-56 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-fit hidden lg:block">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Employees
      </h2>
      {users.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No employees yet.</p>
      ) : (
        <ul className="space-y-1">
          {users.map((user) => (
            <li key={user.id}>
              <Link
                href={`/admin/users/${user.id}/profile`}
                className="flex justify-between items-center py-1.5 px-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="truncate">{user.name || user.email}</span>
                {(user.unreadNotifications ?? 0) > 0 && (
                  <span className="ml-2 bg-nreuv-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {user.unreadNotifications}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
