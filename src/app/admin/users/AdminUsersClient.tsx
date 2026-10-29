"use client";

import { useState } from "react";
import { updateUserRole, updateUserRate, updateUserManager, assignBundleToUser, unassignBundleFromUser, updateUserCompany, archiveUser, unarchiveUser, updateUserExpectedHours, updateUserPayType, updateUserHoursCapEnforced } from "@/app/actions";
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

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  hourlyRate: number;
  payType: "HOURLY" | "FLAT";
  flatFee: number;
  expectedHours: number | null;
  enforceHoursCap: boolean;
  role: string;
  managerId: string | null;
  companyId: string | null;
  archived: boolean;
  categoryBundles: { bundle: CategoryBundle }[];
}

export default function AdminUsersClient({ initialUsers, potentialManagers, allCategoryBundles, allCategories, allCompanies }: {
  initialUsers: User[],
  potentialManagers: User[],
  allCategoryBundles: CategoryBundle[],
  allCategories: Category[],
  allCompanies: Company[]
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showArchived, setShowArchived] = useState(false);
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

  const handlePayTypeChange = async (user: User, payType: "HOURLY" | "FLAT") => {
    setIsUpdating(user.id);
    try {
      await updateUserPayType(user.id, payType);
      setUsers(users.map(u => u.id === user.id ? { ...u, payType } : u));
    } catch (error: any) {
      alert(error.message || "Failed to update pay type.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleFlatFeeChange = async (userId: string, flatFee: number) => {
    setIsUpdating(userId);
    try {
      await updateUserPayType(userId, "FLAT", flatFee);
      setUsers(users.map(u => u.id === userId ? { ...u, flatFee } : u));
    } catch (error: any) {
      alert(error.message || "Failed to update flat fee.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleExpectedHoursChange = async (userId: string, value: string) => {
    setIsUpdating(userId);
    try {
      const hours = value === "" ? null : parseFloat(value);
      await updateUserExpectedHours(userId, hours);
      setUsers(users.map(u => u.id === userId ? { ...u, expectedHours: hours } : u));
    } catch (error: any) {
      alert(error.message || "Failed to update expected hours.");
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

  const handleCompanyChange = async (userId: string, companyId: string) => {
    setIsUpdating(userId);
    try {
      const newCompanyId = companyId === "" ? null : companyId;
      await updateUserCompany(userId, newCompanyId);
      setUsers(users.map(u => u.id === userId ? { ...u, companyId: newCompanyId } : u));
    } catch (error: any) {
      alert(error.message || "Failed to update user company.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleArchiveToggle = async (user: User) => {
    if (!user.archived && !confirm(`Archive ${user.name || user.email}? They will no longer be able to sign in and will disappear from lists, but all of their invoices and history are kept.`)) {
      return;
    }
    setIsUpdating(user.id);
    try {
      if (user.archived) {
        await unarchiveUser(user.id);
      } else {
        await archiveUser(user.id);
      }
      setUsers(users.map(u => u.id === user.id ? { ...u, archived: !user.archived } : u));
    } catch (error: any) {
      alert(error.message || "Failed to update user.");
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
      <div className="flex justify-between items-center mb-4">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived users ({users.filter(u => u.archived).length})
        </label>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-nreuv-primary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-nreuv-accent shadow-sm transition-colors flex items-center gap-2"
        >
          <span>+ Add User</span>
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-slate-100">
        <table className="w-full leading-normal">
        <thead>
          <tr>
            <th className="px-3 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-3 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pay
            </th>
            <th className="px-3 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expected Hrs
            </th>
            <th className="px-3 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-3 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Manager
            </th>
            <th className="px-3 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Company
            </th>
            <th className="px-3 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Category Bundles
            </th>
            <th className="px-3 py-3 border-b-2 border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.filter(u => showArchived || !u.archived).map((user) => (
            <tr key={user.id} className={user.archived ? "opacity-60" : ""}>
              <td className="px-3 py-3 border-b border-slate-100 bg-white text-sm">
                <p className="text-slate-900 font-medium">
                  {user.name}
                  {user.archived && <span className="ml-2 text-xs text-slate-400 italic">(archived)</span>}
                </p>
                <p className="text-slate-500 text-xs break-all">{user.email}</p>
              </td>
              <td className="px-3 py-3 border-b border-slate-100 bg-white text-sm">
                <div className="flex items-center gap-1.5">
                  <select
                    value={user.payType}
                    onChange={(e) => handlePayTypeChange(user, e.target.value as "HOURLY" | "FLAT")}
                    disabled={isUpdating === user.id || user.role === "ADMIN" || user.role === "PAYROLL_APPROVER"}
                    className="border border-slate-300 rounded-lg p-1.5 text-xs bg-white outline-none disabled:opacity-50"
                  >
                    <option value="HOURLY">$/hr</option>
                    <option value="FLAT">Flat</option>
                  </select>
                  <span className="text-slate-500">$</span>
                  {user.payType === "FLAT" ? (
                    <input
                      key={`flat-${user.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={user.flatFee}
                      title="Flat fee per pay period"
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (v !== user.flatFee && !isNaN(v)) handleFlatFeeChange(user.id, v);
                      }}
                      disabled={isUpdating === user.id}
                      className="border border-slate-300 rounded-lg p-1.5 w-20 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none bg-white disabled:opacity-50"
                    />
                  ) : (
                    <input
                      key={`rate-${user.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={user.hourlyRate}
                      title="Hourly rate"
                      onBlur={(e) => {
                        const newRate = parseFloat(e.target.value);
                        if (newRate !== user.hourlyRate && !isNaN(newRate)) {
                          handleRateChange(user.id, newRate);
                        }
                      }}
                      disabled={isUpdating === user.id || user.role === "ADMIN"}
                      className="border border-slate-300 rounded-lg p-1.5 w-20 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none bg-white disabled:opacity-50"
                    />
                  )}
                </div>
              </td>
              <td className="px-3 py-3 border-b border-slate-100 bg-white text-sm">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="—"
                  defaultValue={user.expectedHours ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value === "" ? null : parseFloat(e.target.value);
                    if (v !== user.expectedHours && !(v !== null && isNaN(v))) {
                      handleExpectedHoursChange(user.id, e.target.value);
                    }
                  }}
                  disabled={isUpdating === user.id || user.role === "ADMIN" || user.role === "PAYROLL_APPROVER"}
                  className="border border-slate-300 rounded-lg p-1.5 w-20 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none bg-white disabled:opacity-50"
                  title="Expected hours per pay period; leave blank for no limit"
                />
                {user.expectedHours != null && (
                  <label className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600 cursor-pointer" title="When checked, invoices over the limit are blocked, not just warned">
                    <input
                      type="checkbox"
                      checked={user.enforceHoursCap}
                      onChange={async (e) => {
                        const enforce = e.target.checked;
                        try {
                          await updateUserHoursCapEnforced(user.id, enforce);
                          setUsers(users.map(u => u.id === user.id ? { ...u, enforceHoursCap: enforce } : u));
                        } catch (err: any) {
                          alert(err.message || "Failed to update.");
                        }
                      }}
                      disabled={isUpdating === user.id}
                    />
                    <span className={user.enforceHoursCap ? "font-semibold text-red-700" : ""}>Do not exceed</span>
                  </label>
                )}
              </td>
              <td className="px-3 py-3 border-b border-slate-100 bg-white text-sm">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                  disabled={isUpdating === user.id}
                  className="border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none bg-white disabled:opacity-50 w-full max-w-[11rem]"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PAYROLL_MANAGER">Payroll Manager</option>
                  <option value="PAYROLL_APPROVER">Payroll Approver</option>
                  <option value="EMPLOYEE">Contractor / User</option>
                </select>
                {isUpdating === user.id && <span className="ml-2 text-xs text-slate-500 block">Updating...</span>}
              </td>
              <td className="px-3 py-3 border-b border-slate-100 bg-white text-sm">
                {(user.role === "EMPLOYEE" || user.role === "USER") ? (
                  <select
                    value={user.managerId || ""}
                    onChange={(e) => handleManagerChange(user.id, e.target.value)}
                    disabled={isUpdating === user.id}
                    className="border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none bg-white disabled:opacity-50 w-full max-w-[11rem]"
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
              <td className="px-3 py-3 border-b border-slate-100 bg-white text-sm">
                <select
                  value={user.companyId || ""}
                  onChange={(e) => handleCompanyChange(user.id, e.target.value)}
                  disabled={isUpdating === user.id}
                  className="border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-nreuv-accent outline-none bg-white disabled:opacity-50 w-full max-w-[11rem]"
                >
                  <option value="">No company</option>
                  {allCompanies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-3 border-b border-slate-100 bg-white text-sm">
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
              <td className="px-3 py-3 border-b border-slate-100 bg-white text-sm">
                <div className="flex flex-col gap-2 items-start">
                  <button
                    onClick={() => setResetPasswordUser(user)}
                    className="text-nreuv-primary hover:text-nreuv-accent font-medium text-xs border border-nreuv-primary hover:border-nreuv-accent rounded px-2 py-1 transition-colors"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleArchiveToggle(user)}
                    disabled={isUpdating === user.id}
                    className={`font-medium text-xs border rounded px-2 py-1 transition-colors disabled:opacity-50 ${
                      user.archived
                        ? "text-green-700 border-green-600 hover:bg-green-50"
                        : "text-red-600 border-red-500 hover:bg-red-50"
                    }`}
                  >
                    {user.archived ? "Restore" : "Archive"}
                  </button>
                </div>
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