// import { v4 as uuidv4 } from "uuid"; // Removed uuid package dependency
import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addHours } from "date-fns";

export async function generatePasswordResetToken(userId: string) {
  // First, optionally clear existing tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

  const token = crypto.randomUUID(); // Use native crypto.randomUUID()
  const expiresAt = addHours(new Date(), 24); // Token valid for 24 hours

  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}
