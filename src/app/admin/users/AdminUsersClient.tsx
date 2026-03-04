"use client";

import { useState } from "react";
import { updateUserRole, updateUserRate, updateUserManager } from "@/app/actions";
import AddUserModal from "./AddUserModal";

export default function AdminUsersClient({ initialUsers, potentialManagers }: { initialUsers: any[], potentialManagers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "PAYROLL_MANAGER" | "USER" | "EMPLOYEE") => {
    setIsUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error: any) {
      alert(error.message || "Failed to update user role.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRateChange = async (userId: string, newRate: number) => {
    setIsUpdating(userId);
    try {
      await updateUserRate(userId, newRate);
      setUsers(users.map(u => u.id === userId ? { ...u, hourlyRate: newRate } : u));
    } catch (error: any) {
      alert(error.message || "Failed to update user rate.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleManagerChange = async (userId: string, managerId: string) => {
    setIsUpdating(userId);
    try {
      const newManagerId = managerId === "" ? null : managerId;
      await updateUserManager(userId, newManagerId);
      setUsers(users.map(u => u.id === userId ? { ...u, managerId: newManagerId } : u));
    } catch (error: any) {
      alert(error.message || "Failed to update user manager.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUserAdded = (newUser: any) => {
    setUsers([newUser, ...users]); // Add to top of list
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-nreuv-primary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-nreuv-accent shadow-sm transition-colors flex items-center gap-2"
        >
          <span>+ Add User</span>
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-100">
        <table className="min-w-full leading-normal">
        <thead>
          <tr>
            <th className="px-5 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-5 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-5 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hourly Rate
            </th>
            <th className="px-5 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-5 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Manager
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-5 py-4 border-b border-slate-100 bg-white text-sm">
                <p className="text-slate-900 whitespace-no-wrap font-medium">{user.name}</p>
              </td>
              <td className="px-5 py-4 border-b border-slate-100 bg-white text-sm">
                <p className="text-slate-600 whitespace-no-wrap">{user.email}</p>
              </td>
              <td className="px-5 py-4 border-b border-slate-100 bg-white text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={user.hourlyRate}
                    onBlur={(e) => {
                      const newRate = parseFloat(e.target.value);
                      if (newRate !== user.hourlyRate && !isNaN(newRate)) {
                        handleRateChange(user.id, newRate);
                      }
                    }}
                    disabled={isUpdating === user.id || user.role === "ADMIN"}
                    className="border border-slate-300 rounded-lg p-2 w-24 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none bg-white disabled:opacity-50"
                  />
                </div>
              </td>
              <td className="px-5 py-4 border-b border-slate-100 bg-white text-sm">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                  disabled={isUpdating === user.id}
                  className="border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none bg-white disabled:opacity-50"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PAYROLL_MANAGER">Payroll Manager</option>
                  <option value="EMPLOYEE">Contractor / User</option>
                </select>
                {isUpdating === user.id && <span className="ml-2 text-xs text-slate-500 block">Updating...</span>}
              </td>
              <td className="px-5 py-4 border-b border-slate-100 bg-white text-sm">
                {(user.role === "EMPLOYEE" || user.role === "USER") ? (
                  <select
                    value={user.managerId || ""}
                    onChange={(e) => handleManagerChange(user.id, e.target.value)}
                    disabled={isUpdating === user.id}
                    className="border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none bg-white disabled:opacity-50"
                  >
                    <option value="">None</option>
                    {potentialManagers.map(manager => (
                      <option key={manager.id} value={manager.id}>{manager.name || manager.email}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-slate-400 italic">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
    {isAddModalOpen && (
      <AddUserModal 
        onClose={() => setIsAddModalOpen(false)} 
        onUserAdded={handleUserAdded} 
      />
    )}
  </>
  );
}