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
    <aside className="w-64 bg-dark-red text-white p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Invoice Platform</h2>
      <nav>
        <ul>
          <li>
            <Link href="/" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-red-700">
              Dashboard
            </Link>
          </li>
          {session?.user?.role === "ADMIN" && (
            <li>
              <Link href="/admin/users" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-red-700">
                Manage Users
              </Link>
            </li>
          )}
          {session?.user?.role === "ADMIN" && (
            <li>
              <Link href="/admin/settings" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-red-700">
                Settings
              </Link>
            </li>
          )}
          {(session?.user?.role === "ADMIN" || session?.user?.role === "PAYROLL_MANAGER") && (
            <li>
              <Link href="/invoices" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-red-700">
                All Invoices
              </Link>
            </li>
          )}
          {session?.user?.role === "USER" && (
            <li>
              <Link href="/my-invoices" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-red-700">
                My Invoices
              </Link>
            </li>
          )}
          {session?.user?.role === "USER" && (
            <li>
              <Link href="/invoices/new" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-red-700">
                Create Invoice
              </Link>
            </li>
          )}
          {session?.user?.id && (
            <li>
              <Link href="/notifications" className="flex justify-between items-center py-2.5 px-4 rounded transition duration-200 hover:bg-red-700">
                <span>Notifications</span>
                {unreadNotificationsCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>
              {unreadNotificationsCount > 0 && (
                <form action={markAllNotificationsAsRead} className="mt-2">
                  <button type="submit" className="block w-full text-left text-sm text-gray-300 hover:text-white hover:underline px-4">
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
          className="absolute bottom-4"
        >
          <button type="submit" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-red-700 w-full text-left">
            Sign Out
          </button>
        </form>
      ) : (
        <Link href="/auth/signin" className="absolute bottom-4 block py-2.5 px-4 rounded transition duration-200 bg-dark-red text-white hover:bg-red-700 w-full text-left">
          Sign In
        </Link>
      )}
    </aside>
  );
}