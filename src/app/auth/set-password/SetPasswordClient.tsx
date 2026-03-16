"use client";

import { useActionState } from "react";
import { setPasswordAction } from "./actions";
import Link from "next/link";

export default function SetPasswordClient({ token, email }: { token: string; email: string }) {
  const [state, formAction, isPending] = useActionState(
    setPasswordAction,
    { error: null, success: false }
  );

  if (state.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-100 text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Password Set!</h1>
          <p className="text-slate-600 mb-6">Your password has been successfully updated. You can now sign in to your account.</p>
          <Link href="/auth/signin" className="inline-block bg-nreuv-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        action={formAction}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-100"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Set Your Password</h1>
          <p className="text-sm text-slate-500 mt-2">Setting password for {email}</p>
        </div>

        {state.error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium text-center">
            {state.error}
          </div>
        )}
        
        <input type="hidden" name="token" value={token} />

        <div className="mb-5">
          <label htmlFor="password" className="block text-slate-700 text-sm font-semibold mb-2">
            New Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={8}
            className="appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-800 leading-tight focus:outline-none focus:ring-2 focus:ring-nreuv-primary focus:border-transparent transition-shadow"
            placeholder="••••••••"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-slate-700 text-sm font-semibold mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={8}
            className="appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-800 leading-tight focus:outline-none focus:ring-2 focus:ring-nreuv-primary focus:border-transparent transition-shadow"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-nreuv-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-nreuv-accent focus:ring-offset-2 w-full transition-colors shadow-md disabled:opacity-70"
        >
          {isPending ? "Saving..." : "Set Password"}
        </button>
      </form>
    </div>
  );
}