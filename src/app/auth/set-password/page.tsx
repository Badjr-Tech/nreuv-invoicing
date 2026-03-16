import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import SetPasswordClient from "./SetPasswordClient";
import Link from "next/link";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-100 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
          <p className="text-slate-600 mb-6">No token provided. Please check your email link.</p>
          <Link href="/auth/signin" className="text-nreuv-primary hover:underline font-medium">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
    with: { user: true },
  });

  if (!resetToken || new Date() > new Date(resetToken.expiresAt)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-100 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid or Expired Link</h1>
          <p className="text-slate-600 mb-6">This password reset link is invalid or has expired. Please contact an administrator for a new link.</p>
          <Link href="/auth/signin" className="text-nreuv-primary hover:underline font-medium">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return <SetPasswordClient token={token} email={resetToken.user.email} />;
}
