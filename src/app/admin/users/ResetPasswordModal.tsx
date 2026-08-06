"use client";

import { useState } from "react";
import { sendPasswordResetLink } from "@/app/actions";

export default function ResetPasswordModal({ user, onClose }: { user: any, onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendLink = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendPasswordResetLink(user.id);
      setSuccess(result?.message || `Reset link sent to ${user.email}.`);
      setTimeout(onClose, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-nreuv-black mb-2">Reset Password</h2>
        <p className="text-sm text-slate-500 mb-6">
          Sending a reset link to <span className="font-semibold text-slate-800">{user.email}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
            {success}
          </div>
        ) : (
          <div className="text-sm text-slate-600 space-y-2 mb-6">
            <p>
              This will email <strong>{user.name || user.email}</strong> a secure link
              where they can set their own new password.
            </p>
            <p>
              The link is valid for <strong>24 hours</strong>. Their current password
              stays active until they click through and choose a new one.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            disabled={isSubmitting}
          >
            {success ? "Close" : "Cancel"}
          </button>
          {!success && (
            <button
              type="button"
              onClick={handleSendLink}
              disabled={isSubmitting}
              className="px-4 py-2 bg-nreuv-primary hover:opacity-90 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Sending…" : "Send Reset Link"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
