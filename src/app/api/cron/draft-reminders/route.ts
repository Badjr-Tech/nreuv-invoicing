import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendDraftReminderEmail } from "@/lib/email";

// Runs Wednesdays (see vercel.json): anyone with a DRAFT invoice whose
// submission deadline hasn't passed gets a nudge to submit it.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const drafts = await db.query.invoices.findMany({
      where: eq(invoices.status, "DRAFT"),
      with: { user: true },
    });

    const now = new Date();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://invoicing.nreuvadvisors.com";

    // One email per person, covering all of their still-submittable drafts
    const byUser = new Map<string, { name: string; email: string; count: number }>();
    for (const inv of drafts) {
      if (!inv.user?.email || (inv.user as any).archived) continue;
      if (new Date(inv.dueDate) < now) continue; // deadline already passed — the late-invoice cron handles those
      const entry = byUser.get(inv.user.id) || { name: inv.user.name, email: inv.user.email, count: 0 };
      entry.count += 1;
      byUser.set(inv.user.id, entry);
    }

    for (const person of byUser.values()) {
      await sendDraftReminderEmail(person.email, person.name, person.count, `${appUrl}/my-invoices`);
    }

    return NextResponse.json({ remindersSent: byUser.size });
  } catch (error) {
    console.error("draft-reminders cron failed:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
