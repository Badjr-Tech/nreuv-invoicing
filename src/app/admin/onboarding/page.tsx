import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  onboardingTasks,
  userOnboardingProgress,
  users,
} from "@/db/schema";
import { ensureOnboardingSeed } from "@/lib/onboarding-seed";
import { asc, eq, ne } from "drizzle-orm";
import AdminOnboardingClient from "./AdminOnboardingClient";

export default async function AdminOnboardingPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  await ensureOnboardingSeed();

  // All tasks (for total count + name lookup).
  const tasks = await db
    .select({
      id: onboardingTasks.id,
      title: onboardingTasks.title,
      sortOrder: onboardingTasks.sortOrder,
    })
    .from(onboardingTasks)
    .orderBy(asc(onboardingTasks.sortOrder));
  const totalTasks = tasks.length;

  // Everyone except other admins — the people we actually onboard.
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(ne(users.role, "ADMIN"))
    .orderBy(asc(users.name));

  // Pull every progress row in one go and bucket by user.
  const progressRows = await db
    .select({
      userId: userOnboardingProgress.userId,
      taskId: userOnboardingProgress.taskId,
      completedAt: userOnboardingProgress.completedAt,
    })
    .from(userOnboardingProgress);

  const byUser = new Map<string, Set<string>>();
  for (const row of progressRows) {
    if (!byUser.has(row.userId)) byUser.set(row.userId, new Set());
    byUser.get(row.userId)!.add(row.taskId);
  }

  const taskTitleById = new Map(tasks.map((t) => [t.id, t.title] as const));

  const rows = allUsers.map((u) => {
    const doneIds = byUser.get(u.id) ?? new Set<string>();
    const doneCount = doneIds.size;
    const remainingTasks = tasks
      .filter((t) => !doneIds.has(t.id))
      .map((t) => t.title);
    return {
      userId: u.id,
      name: u.name || u.email,
      email: u.email,
      role: u.role,
      doneCount,
      totalCount: totalTasks,
      remainingTasks,
    };
  });

  return <AdminOnboardingClient rows={rows} totalTasks={totalTasks} />;
}
