"use client";

import { useState } from "react";
import { resetOwnPassword } from "@/app/actions";

export default function UserSettingsClient({ userId }: { userId: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      await resetOwnPassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Change Password</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
          Your password has been successfully changed!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-nreuv-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-nreuv-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-nreuv-primary outline-none"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-nreuv-primary hover:opacity-90 text-white font-medium py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-nreuv-accent transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}