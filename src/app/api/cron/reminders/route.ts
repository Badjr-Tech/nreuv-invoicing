import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, users } from '@/db/schema';
import { eq, and, gt, lte } from 'drizzle-orm';
import { sendInvoiceReminderEmail } from '@/lib/email';
import { addDays, startOfDay, endOfDay, format as formatDate } from 'date-fns';

// This is a dynamic route for the cron job
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Check for an authorization token to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    const targetDate = addDays(today, 3); // Due in 3 days
    
    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);

    // Find all invoices due on the target date regardless of status
    const upcomingInvoices = await db.query.invoices.findMany({
      where: and(
        gt(invoices.dueDate, startOfTargetDay),
        lte(invoices.dueDate, endOfTargetDay)
      ),
      with: {
        user: true,
      },
    });

    console.log(`Found ${upcomingInvoices.length} invoices due in 3 days.`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nreuv-invoicing.vercel.app';

    for (const invoice of upcomingInvoices) {
      if (invoice.user?.email && invoice.user?.name) {
        const invoiceLink = `${appUrl}/invoices/${invoice.id}`;
        await sendInvoiceReminderEmail(invoice.user.email, invoice.user.name, invoiceLink);
      }
    }

    return NextResponse.json({ success: true, count: upcomingInvoices.length });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process reminders' }, { status: 500 });
  }
}
