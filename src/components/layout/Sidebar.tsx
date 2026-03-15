import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { db } from "@/db"; // Import db
import { notifications, invoices } from "@/db/schema"; // Import notifications and invoices schema
import { eq, count, and, desc } from "drizzle-orm"; // Import count, and, desc
import { markAllNotificationsAsRead } from "@/app/actions"; // Import the action
import { format } from "date-fns";

export default async function Sidebar() {
  const session = await auth();

  let unreadNotificationsCount = 0;
  let approvedDates: { invoiceDate: Date }[] = [];

  if (session?.user?.id) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(notifications)
      .where(eq(notifications.userId, session.user.id));
    unreadNotificationsCount = value;

    // Fetch distinct approved dates
    let datesQuery;
    if (session.user.role === "ADMIN" || session.user.role === "PAYROLL_MANAGER") {
      datesQuery = await db
        .select({ invoiceDate: invoices.invoiceDate })
        .from(invoices)
        .where(eq(invoices.status, "APPROVED"))
        .groupBy(invoices.invoiceDate)
        .orderBy(desc(invoices.invoiceDate));
    } else {
      datesQuery = await db
        .select({ invoiceDate: invoices.invoiceDate })
        .from(invoices)
        .where(and(eq(invoices.status, "APPROVED"), eq(invoices.userId, session.user.id)))
        .groupBy(invoices.invoiceDate)
        .orderBy(desc(invoices.invoiceDate));
    }
    approvedDates = datesQuery;
  }

  return (
    <aside className="w-64 bg-nreuv-primary text-white p-4 space-y-4 shadow-lg flex flex-col h-screen overflow-hidden">
      <div className="mb-6 flex-shrink-0">
        <Link href="/">
          <Image src="/companylogo1.png" alt="Company Logo" width={150} height={40} priority />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto pr-2 pb-4">
        <ul className="space-y-1">
          <li>
            <Link href="/" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-black/20">
              Dashboard
            </Link>
          </li>
          {session?.user?.role === "ADMIN" && (
            <li>
              <Link href="/admin/users" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-black/20">
                Manage Users
              </Link>
            </li>
          )}
          {session?.user?.role === "ADMIN" && (
            <li>
              <Link href="/admin/settings" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-black/20">
                System Settings
              </Link>
            </li>
          )}
          {(session?.user?.role === "USER" || session?.user?.role === "EMPLOYEE" || session?.user?.role === "PAYROLL_MANAGER") && (
            <li>
              <Link href="/settings" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-black/20">
                My Settings
              </Link>
            </li>
          )}
          {(session?.user?.role === "ADMIN" || session?.user?.role === "PAYROLL_MANAGER") && (
            <li>
              <Link href="/invoices" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-black/20">
                All Invoices
              </Link>
            </li>
          )}
          {(session?.user?.role === "USER" || session?.user?.role === "EMPLOYEE") && (
            <li>
              <Link href="/my-invoices" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-black/20">
                My Invoices
              </Link>
            </li>
          )}
          {(session?.user?.role === "USER" || session?.user?.role === "EMPLOYEE") && (
            <li>
              <Link href="/invoices/new" className="block py-2.5 px-4 rounded transition duration-200 hover:opacity-90 bg-nreuv-accent font-semibold mt-4 text-center">
                + Create Invoice
              </Link>
            </li>
          )}
          {session?.user?.id && (
            <li className="mt-4 border-t border-white/20 pt-4">
              <Link href="/notifications" className="flex justify-between items-center py-2.5 px-4 rounded transition duration-200 hover:bg-black/20">
                <span>Notifications</span>
                {unreadNotificationsCount > 0 && (
                  <span className="bg-nreuv-accent text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>
              {unreadNotificationsCount > 0 && (
                <form action={markAllNotificationsAsRead} className="mt-2">
                  <button type="submit" className="block w-full text-left text-sm text-gray-300 hover:text-white hover:underline px-4 transition-colors">
                    Mark all as read
                  </button>
                </form>
              )}
            </li>
          )}
          {approvedDates.length > 0 && (
            <li className="mt-4 border-t border-white/20 pt-4">
              <span className="block px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Approved Payments
              </span>
              <ul className="space-y-1">
                {approvedDates.map((d, index) => {
                  const dateStr = format(new Date(d.invoiceDate), "yyyy-MM-dd");
                  return (
                    <li key={index}>
                      <Link
                        href={`/invoices?filterPaymentDateStart=${dateStr}&filterPaymentDateEnd=${dateStr}&filterStatus=APPROVED`}
                        className="block py-1.5 px-4 text-sm rounded transition duration-200 hover:bg-black/20 text-gray-200 hover:text-white"
                      >
                        {format(new Date(d.invoiceDate), "MMM dd, yyyy")}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          )}
        </ul>
      </nav>
      {session?.user ? (
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
          className="mt-auto pt-4 flex-shrink-0"
        >
          <button type="submit" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-nreuv-accent text-white w-full text-left font-medium">
            Sign Out
          </button>
        </form>
      ) : (
        <div className="mt-auto pt-4 flex-shrink-0">
          <Link href="/auth/signin" className="block py-2.5 px-4 rounded transition duration-200 bg-nreuv-accent text-white hover:opacity-90 w-full text-center font-bold shadow-md">
            Sign In
          </Link>
        </div>
      )}
    </aside>
  );
}