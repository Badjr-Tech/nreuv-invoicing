"use client";

import { useState } from "react";
import { resetUserPassword } from "@/app/actions";

export default function ResetPasswordModal({ user, onClose }: { user: any, onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [suggestedPassword, setSuggestedPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const generateSuggestedPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSuggestedPassword(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      await resetUserPassword(user.id, password);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-nreuv-black mb-2">Reset Password</h2>
        <p className="text-sm text-slate-500 mb-6">Resetting password for <span className="font-semibold text-slate-800">{user.email}</span></p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
            Password successfully updated!
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
              <input 
                type="text" // using text so admin can see what they are typing/copy it
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-nreuv-accent outline-none font-mono"
                placeholder="Enter new password"
              />
              <button 
                type="button" 
                onClick={generateSuggestedPassword}
                className="mt-2 text-xs text-nreuv-primary hover:text-nreuv-accent hover:underline focus:outline-none font-medium"
              >
                Generate Secure Password
              </button>
              {suggestedPassword && (
                <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                  Suggested: <span className="font-mono font-medium">{suggestedPassword}</span>
                  <button 
                    type="button" 
                    onClick={() => setPassword(suggestedPassword)}
                    className="ml-3 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded transition-colors font-medium"
                  >
                    Use this
                  </button>
                </p>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || password.length < 8}
                className="px-4 py-2 bg-nreuv-primary hover:opacity-90 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}