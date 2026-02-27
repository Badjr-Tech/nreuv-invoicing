import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserDashboard from "@/components/dashboard/UserDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PayrollManagerDashboard from "@/components/dashboard/PayrollManagerDashboard";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role === "ADMIN") {
    return <AdminDashboard />;
  }

  if (session.user.role === "PAYROLL_MANAGER") {
    return <PayrollManagerDashboard />;
  }

  if (session.user.role === "USER") {
    return <UserDashboard />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-black mb-4">Welcome, {session.user.name || session.user.email}!</h1>
      <p className="text-lg text-gray-700">Your role: {session.user.role}</p>
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-black">Your Dashboard</h2>
        <p className="text-gray-600 mt-2">
          This area will display content specific to your role ({session.user.role}).
        </p>
      </div>
    </div>
  );
}