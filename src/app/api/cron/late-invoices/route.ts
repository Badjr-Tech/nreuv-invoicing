import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq, and, gt, lte } from 'drizzle-orm';
import { sendLateInvoiceEmail } from '@/lib/email';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Check for an authorization token to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Find all DRAFT invoices due today
    const upcomingInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.status, "DRAFT"),
        gt(invoices.dueDate, startOfToday),
        lte(invoices.dueDate, endOfToday)
      ),
      with: {
        user: true,
      },
    });

    console.log(`Found ${upcomingInvoices.length} invoices due today (late).`);

    for (const invoice of upcomingInvoices) {
      if (invoice.user?.email && invoice.user?.name) {
        await sendLateInvoiceEmail(invoice.user.email, invoice.user.name);
      }
    }

    return NextResponse.json({ success: true, count: upcomingInvoices.length });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process late invoices' }, { status: 500 });
  }
}
