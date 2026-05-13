import { db } from "@/db";
import { onboardingCategories, onboardingTasks } from "@/db/schema";
import { count, eq } from "drizzle-orm";

/**
 * The initial onboarding checklist, transcribed from the spec screenshot.
 * Admin can edit/extend rows directly in the DB until the admin CRUD UI ships.
 */
interface SeedTask {
  groupName?: string;
  title: string;
  description?: string;
}

const ONBOARDING_SEED: { category: string; tasks: SeedTask[] }[] = [
  {
    category: "First Day",
    tasks: [
      { title: "I'm here!", description: "Let your manager know you've arrived and are logged in." },

      { groupName: "Log in to Systems", title: "Kumospace Account" },
      { groupName: "Log in to Systems", title: "Gmail Account" },
      { groupName: "Log in to Systems", title: "Box Account" },

      { groupName: "Branding Necessities", title: "Download and load Zoom Background(s)" },
      { groupName: "Branding Necessities", title: "Upload a headshot photo to Slack, Kumospace, and your Gmail profile" },
      { groupName: "Branding Necessities", title: "Finish and Upload Signature Block" },
      { groupName: "Branding Necessities", title: "Download and load Kumospace Backgrounds" },

      { groupName: "Fill out HR Forms", title: "W9 Form" },
      { groupName: "Fill out HR Forms", title: "Contractor Intake Form" },

      { title: "Send Headshot to Dakotah for your Signature Block" },
      { title: "About PCC" },
      { title: "16 Personalities Test" },
    ],
  },
  {
    category: "Systems",
    tasks: [
      { title: "Invoice Template" },
    ],
  },
  {
    category: "Meetings & Orientation",
    tasks: [
      { title: "Set up a meeting with Managing Director" },
      { title: "Set up a meeting with Director of Community Operations" },
      { title: "Set up a meeting with Director of External Affairs" },
      { title: "Attend Level 10 for applicable PCC" },
      { title: "Shadow with your Direct Manager for 3 days" },
      { title: "About NREUV & PCC" },
    ],
  },
];

/**
 * Populate onboarding tables on first use. Idempotent — does nothing if any
 * categories already exist. Safe to call from any page that needs the data.
 */
export async function ensureOnboardingSeed(): Promise<void> {
  const [{ value: existing }] = await db
    .select({ value: count() })
    .from(onboardingCategories);
  if (existing > 0) return;

  for (let catIdx = 0; catIdx < ONBOARDING_SEED.length; catIdx++) {
    const group = ONBOARDING_SEED[catIdx];
    const [cat] = await db
      .insert(onboardingCategories)
      .values({ name: group.category, sortOrder: catIdx })
      .returning({ id: onboardingCategories.id });

    const taskRows = group.tasks.map((t, i) => ({
      categoryId: cat.id,
      groupName: t.groupName ?? null,
      title: t.title,
      description: t.description ?? null,
      sortOrder: i,
    }));

    if (taskRows.length > 0) {
      await db.insert(onboardingTasks).values(taskRows);
    }
  }
}
