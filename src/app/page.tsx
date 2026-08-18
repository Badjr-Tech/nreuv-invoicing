import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PayrollManagerDashboard from "@/components/dashboard/PayrollManagerDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const params = await searchParams;

  if (session.user.role === "ADMIN") {
    return <AdminDashboard searchParams={params as any} />;
  }

  if (session.user.role === "PAYROLL_MANAGER") {
    return <PayrollManagerDashboard searchParams={params as any} />;
  }

  return <UserDashboard />;
}
