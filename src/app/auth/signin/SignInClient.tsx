"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "./actions";

export default function SignInClient() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        action={formAction}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-100"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-2">Sign in to your account</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium text-center">
            {errorMessage}
          </div>
        )}
        
        <div className="mb-5">
          <label htmlFor="email" className="block text-slate-700 text-sm font-semibold mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-800 leading-tight focus:outline-none focus:ring-2 focus:ring-nreuv-primary focus:border-transparent transition-shadow"
            placeholder="you@example.com"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-slate-700 text-sm font-semibold mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-800 leading-tight focus:outline-none focus:ring-2 focus:ring-nreuv-primary focus:border-transparent transition-shadow"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-nreuv-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-nreuv-accent focus:ring-offset-2 w-full transition-colors shadow-md disabled:opacity-70"
        >
          {isPending ? "Signing In..." : "Sign In"}
        </button>
        <div className="text-center mt-6">
          <Link href="/auth/request-account" className="inline-block align-baseline font-medium text-sm text-nreuv-primary hover:text-nreuv-accent transition-colors">
            Request an Account
          </Link>
        </div>
      </form>
    </div>
  );
}