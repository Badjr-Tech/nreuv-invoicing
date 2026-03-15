import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions";
import { format } from "date-fns";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userNotifications = await db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    orderBy: [desc(notifications.createdAt)],
  });

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-nreuv-black">Notifications</h1>
        {unreadCount > 0 && (
          <form action={markAllNotificationsAsRead}>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {userNotifications.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border border-slate-200 shadow-sm">
          <p className="text-slate-500">You don't have any notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 divide-y divide-slate-100">
          {userNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-5 flex gap-4 items-start ${
                !notification.read ? "bg-blue-50/50" : "bg-white"
              }`}
            >
              <div className="flex-1">
                <p className={`text-sm ${!notification.read ? "text-slate-900 font-medium" : "text-slate-700"}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {format(new Date(notification.createdAt), "MMM dd, yyyy h:mm a")}
                </p>
              </div>
              {!notification.read && (
                <form action={markNotificationAsRead.bind(null, notification.id)}>
                  <button
                    type="submit"
                    className="text-xs text-nreuv-primary hover:text-nreuv-accent font-medium bg-white border border-slate-200 rounded px-3 py-1.5 shadow-sm transition-colors"
                  >
                    Mark read
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
