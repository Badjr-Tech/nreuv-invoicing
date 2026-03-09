"use client";

import { useState } from "react";
import { updateUserRole, updateUserRate, updateUserManager, assignBundleToUser, unassignBundleFromUser } from "@/app/actions";
import AddUserModal from "./AddUserModal";
import ResetPasswordModal from "./ResetPasswordModal";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface CategoryBundle {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  hourlyRate: number;
  role: string;
  managerId: string | null;
  categoryBundles: { bundle: CategoryBundle }[];
}

export default function AdminUsersClient({ initialUsers, potentialManagers, allCategoryBundles, allCategories }: { 
  initialUsers: User[], 
  potentialManagers: User[], 
  allCategoryBundles: CategoryBundle[], 
  allCategories: Category[] 
}) {
  const [users, setUsers] = useState(initialUsers);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
  const router = useRouter();

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

  const handleAssignBundle = async (userId: string, bundleId: string) => {
    try {
      await assignBundleToUser(userId, bundleId);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to assign category bundle.");
    }
  };

  const handleUnassignBundle = async (userId: string, bundleId: string) => {
    try {
      await unassignBundleFromUser(userId, bundleId);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to unassign category bundle.");
    }
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
            <th className="px-5 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Category Bundles
            </th>
            <th className="px-5 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Actions
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
              <td className="px-5 py-4 border-b border-slate-100 bg-white text-sm">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1">
                    {user.categoryBundles.length > 0 ? (
                      user.categoryBundles.map(ucb => (
                        <span key={ucb.bundle.id} className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {ucb.bundle.name}
                          <button 
                            onClick={() => handleUnassignBundle(user.id, ucb.bundle.id)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic text-xs">No bundles assigned</span>
                    )}
                  </div>
                  {(user.role === "EMPLOYEE" || user.role === "USER") && (
                    <select
                      className="border p-1 rounded text-xs"
                      onChange={(e) => handleAssignBundle(user.id, e.target.value)}
                      value="" // Controlled component, reset after selection
                    >
                      <option value="">Assign Bundle...</option>
                      {allCategoryBundles.filter(
                        (bundle) => !user.categoryBundles.some((ucb) => ucb.bundle.id === bundle.id)
                      ).map((bundle) => (
                        <option key={bundle.id} value={bundle.id}>
                          {bundle.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 border-b border-slate-100 bg-white text-sm">
                <button
                  onClick={() => setResetPasswordUser(user)}
                  className="text-nreuv-primary hover:text-nreuv-accent font-medium text-xs border border-nreuv-primary hover:border-nreuv-accent rounded px-2 py-1 transition-colors"
                >
                  Reset Password
                </button>
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

    {resetPasswordUser && (
      <ResetPasswordModal
        user={resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
      />
    )}
  </>
  );
}