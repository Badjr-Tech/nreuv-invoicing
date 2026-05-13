import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserDashboard from "@/components/dashboard/UserDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PayrollManagerDashboard from "@/components/dashboard/PayrollManagerDashboard";
import OnboardingBanner from "@/components/dashboard/OnboardingBanner";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  let dashboard: React.ReactNode;
  if (session.user.role === "ADMIN") {
    dashboard = <AdminDashboard />;
  } else if (session.user.role === "PAYROLL_MANAGER") {
    dashboard = <PayrollManagerDashboard />;
  } else if (session.user.role === "USER" || session.user.role === "EMPLOYEE") {
    dashboard = <UserDashboard />;
  } else {
    dashboard = (
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

  return (
    <div className="p-2 md:p-4">
      <OnboardingBanner />
      {dashboard}
    </div>
  );
}