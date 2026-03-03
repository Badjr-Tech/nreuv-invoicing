import { db } from "./src/db/index";
import { users } from "./src/db/schema";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function main() {
  const email = "djmj@nreuv.com";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({
      name: "Admin User",
      email: email,
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    } as any);
    console.log(`Created user: ${email} / ${password}`);
  } else {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email));
    console.log(`Updated user: ${email} / ${password}`);
  }
  process.exit(0);
}

main().catch(console.error);