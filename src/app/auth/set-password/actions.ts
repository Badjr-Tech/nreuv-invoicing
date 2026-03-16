"use server";

import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function setPasswordAction(
  prevState: any,
  formData: FormData,
) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !password || !confirmPassword) {
    return { error: "All fields are required.", success: false };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", success: false };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long.", success: false };
  }

  try {
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token),
    });

    if (!resetToken || new Date() > new Date(resetToken.expiresAt)) {
      return { error: "Invalid or expired token.", success: false };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetToken.userId));

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

    return { error: null, success: true };
  } catch (error) {
    console.error("Error setting password:", error);
    return { error: "An error occurred while setting the password.", success: false };
  }
}
