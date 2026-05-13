import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { onboardingCategories, onboardingTasks } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ensureOnboardingSeed } from "@/lib/onboarding-seed";
import ManageOnboardingClient from "./ManageOnboardingClient";

export default async function ManageOnboardingPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  await ensureOnboardingSeed();

  const categories = await db
    .select()
    .from(onboardingCategories)
    .orderBy(asc(onboardingCategories.sortOrder));

  const tasks = await db
    .select()
    .from(onboardingTasks)
    .orderBy(asc(onboardingTasks.sortOrder));

  return <ManageOnboardingClient categories={categories} tasks={tasks} />;
}
