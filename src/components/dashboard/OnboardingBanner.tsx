import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { onboardingTasks, userOnboardingProgress } from "@/db/schema";
import { count, eq } from "drizzle-orm";

/**
 * Server component shown above every dashboard. Hides itself when the user
 * has completed the checklist (or when there are no tasks defined yet).
 */
export default async function OnboardingBanner() {
  const session = await auth();
  if (!session?.user?.id) return null;

  let total = 0;
  let done = 0;
  try {
    const totalRow = await db.select({ value: count() }).from(onboardingTasks);
    total = totalRow[0]?.value ?? 0;
    if (total === 0) return null;

    const doneRow = await db
      .select({ value: count() })
      .from(userOnboardingProgress)
      .where(eq(userOnboardingProgress.userId, session.user.id));
    done = doneRow[0]?.value ?? 0;
  } catch (err) {
    // Tables not migrated yet — hide the banner silently.
    return null;
  }

  if (done >= total) return null;

  const remaining = total - done;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="mb-4 rounded-xl border border-nreuv-accent/30 bg-gradient-to-r from-nreuv-primary to-nreuv-accent text-white shadow-md p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
            Welcome
          </span>
          <span className="text-xs opacity-90">{pct}% complete</span>
        </div>
        <h2 className="text-lg md:text-xl font-bold">
          Finish your onboarding — {remaining} step{remaining === 1 ? "" : "s"} left
        </h2>
        <p className="text-sm opacity-90 mt-0.5">
          Get logged into your systems, fill out HR forms, and meet your team.
        </p>
        <div className="mt-2 h-1.5 w-full max-w-md bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <Link
        href="/onboarding"
        className="self-start md:self-center bg-white text-nreuv-primary font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition whitespace-nowrap"
      >
        Continue →
      </Link>
    </div>
  );
}
