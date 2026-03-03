"use client";

import { useState } from "react";
import { addUserManually } from "@/app/actions";

export default function AddUserModal({ onClose, onUserAdded }: { onClose: () => void, onUserAdded: (user: any) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [suggestedPassword, setSuggestedPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "PAYROLL_MANAGER" | "EMPLOYEE">("EMPLOYEE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestedPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSuggestedPassword(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      const newUser = await addUserManually({ name, email, password, role });
      onUserAdded(newUser);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-nreuv-black mb-4">Add New User</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none"
            />
            <button 
              type="button" 
              onClick={generateSuggestedPassword}
              className="mt-2 text-xs text-nreuv-primary hover:text-nreuv-accent hover:underline focus:outline-none"
            >
              Generate Suggested Password
            </button>
            {suggestedPassword && (
              <p className="mt-1 text-sm text-slate-500">
                Suggested: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{suggestedPassword}</span>
                <button 
                  type="button" 
                  onClick={() => setPassword(suggestedPassword)}
                  className="ml-2 text-xs text-nreuv-primary hover:text-nreuv-accent hover:underline focus:outline-none"
                >
                  (Use this)
                </button>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none bg-white"
            >
              <option value="EMPLOYEE">Contractor / User</option>
              <option value="PAYROLL_MANAGER">Payroll Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-nreuv-primary hover:opacity-90 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}