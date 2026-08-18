"use server";

import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface SetPasswordState {
  error: string | null;
  success: boolean;
}

export async function setPasswordAction(
  prevState: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { error: "Missing token. Please use the link from your email.", success: false };
  }
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters long.", success: false };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", success: false };
  }

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
  });

  if (!resetToken || new Date() > new Date(resetToken.expiresAt)) {
    return { error: "This link is invalid or has expired. Please request a new one.", success: false };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, resetToken.userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));

  return { error: null, success: true };
}
