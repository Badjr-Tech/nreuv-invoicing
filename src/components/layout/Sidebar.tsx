import Link from "next/link";
import { auth, signOut } from "@/auth";
import { db } from "@/db"; // Import db
import { notifications } from "@/db/schema"; // Import notifications schema
import { eq, count } from "drizzle-orm"; // Import count
import { markAllNotificationsAsRead } from "@/app/actions"; // Import the action

export default async function Sidebar() {
  const session = await auth();

  let unreadNotificationsCount = 0;
  if (session?.user?.id) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(notifications)
      .where(eq(notifications.userId, session.user.id));
    unreadNotificationsCount = value;
  }

  return (
    <aside className="w-64 bg-nreuv-primary text-white p-4 space-y-4 shadow-lg flex flex-col">
      <h2 className="text-2xl font-bold mb-6 tracking-wide">Invoice Platform</h2>
      <nav className="flex-1">
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
        </ul>
      </nav>
      {session?.user ? (
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
          className="mt-auto"
        >
          <button type="submit" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-nreuv-accent text-white w-full text-left font-medium">
            Sign Out
          </button>
        </form>
      ) : (
        <Link href="/auth/signin" className="mt-auto block py-2.5 px-4 rounded transition duration-200 bg-nreuv-accent text-white hover:opacity-90 w-full text-center font-bold shadow-md">
          Sign In
        </Link>
      )}
    </aside>
  );
}