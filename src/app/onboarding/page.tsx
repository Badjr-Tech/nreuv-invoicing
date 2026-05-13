import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { onboardingCategories, onboardingTasks, userOnboardingProgress } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { ensureOnboardingSeed } from "@/lib/onboarding-seed";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  await ensureOnboardingSeed();

  // Pull categories + tasks ordered by sortOrder.
  const categories = await db
    .select()
    .from(onboardingCategories)
    .orderBy(asc(onboardingCategories.sortOrder));

  const tasks = await db
    .select()
    .from(onboardingTasks)
    .orderBy(asc(onboardingTasks.sortOrder));

  // Current user's progress (set of completed task IDs).
  const progressRows = await db
    .select({ taskId: userOnboardingProgress.taskId })
    .from(userOnboardingProgress)
    .where(eq(userOnboardingProgress.userId, session.user.id));

  const completedIds = new Set(progressRows.map((p) => p.taskId));

  return (
    <OnboardingClient
      categories={categories}
      tasks={tasks}
      completedIds={Array.from(completedIds)}
    />
  );
}
