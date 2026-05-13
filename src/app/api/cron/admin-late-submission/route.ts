import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, users } from '@/db/schema';
import { eq, and, gt, lte, inArray } from 'drizzle-orm';
import { sendAdminLateSubmissionEmail } from '@/lib/email';
import { addDays, startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Check for an authorization token to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    const targetDate = addDays(today, -2); // Due 2 days ago
    
    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);

    // Find all invoices that were due 2 days ago and are still not APPROVED
    const lateInvoices = await db.query.invoices.findMany({
      where: and(
        inArray(invoices.status, ["DRAFT", "PENDING_MANAGER", "PENDING_ADMIN"]),
        gt(invoices.dueDate, startOfTargetDay),
        lte(invoices.dueDate, endOfTargetDay)
      ),
      with: {
        user: true,
      },
    });

    console.log(`Found ${lateInvoices.length} invoices that were due 2 days ago and are not yet approved.`);

    // Fetch all admins to notify
    const admins = await db.query.users.findMany({
      where: eq(users.role, "ADMIN"),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nreuv-invoicing.vercel.app';

    for (const invoice of lateInvoices) {
      const userName = invoice.user?.name || invoice.user?.email || "Unknown User";
      const userEmail = invoice.user?.email || "";
      const invoiceNumber = invoice.invoiceNumber || invoice.id.substring(0, 8);
      const amount = Number(invoice.totalCost || 0);
      const submittedDate = invoice.submittedDate ? new Date(invoice.submittedDate) : null;
      const adminLink = `${appUrl}/invoices/${invoice.id}`;

      for (const admin of admins) {
        if (admin.email) {
          await sendAdminLateSubmissionEmail(
            admin.email,
            userName,
            invoiceNumber,
            userEmail,
            amount,
            submittedDate,
            adminLink,
          );
        }
      }
    }

    return NextResponse.json({ success: true, count: lateInvoices.length });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process admin late submission reminders' }, { status: 500 });
  }
}
