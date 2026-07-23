import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, users } from '@/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { sendManagerApprovalReminder } from '@/lib/email';

// Cron runs weekly (Wednesdays) — see vercel.json.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const managers = await db.query.users.findMany({
      where: eq(users.role, 'PAYROLL_MANAGER'),
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://nreuv-invoicing.vercel.app';
    const invoicesLink = `${appUrl}/invoices?filterStatus=PENDING_MANAGER`;

    let sent = 0;
    for (const manager of managers) {
      if (!manager.email) continue;

      // Count invoices in PENDING_MANAGER status whose owner reports to
      // this manager. We join by managerId on the invoice's user.
      const rows = await db
        .select({ value: count() })
        .from(invoices)
        .innerJoin(users, eq(users.id, invoices.userId))
        .where(
          and(
            eq(invoices.status, 'PENDING_MANAGER'),
            eq(users.managerId, manager.id),
          ),
        );
      const pendingCount = rows[0]?.value ?? 0;

      if (pendingCount === 0) {
        // Nothing waiting — skip to avoid noise.
        continue;
      }

      try {
        await sendManagerApprovalReminder(
          manager.email,
          manager.name || manager.email,
          pendingCount,
          invoicesLink,
        );
        sent += 1;
      } catch (err) {
        console.error('manager-approval-reminder: email failed', {
          managerId: manager.id,
          err,
        });
      }
    }

    return NextResponse.json({ success: true, managersNotified: sent });
  } catch (error) {
    console.error('manager-approval-reminder cron error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process manager approval reminders' },
      { status: 500 },
    );
  }
}
