import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/auth/signin", "/auth/request-account", "/auth/set-password"];
const userRoutes = ["/my-invoices", "/invoices", "/settings", "/notifications", "/profile"];
const payrollManagerRoutes = ["/invoices", "/notifications", "/profile"];
const adminRoutes = ["/admin/users", "/admin/settings", "/notifications", "/admin/analytics", "/admin/account-requests"];

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Add dynamic profile route for admin
  const isAdminUserProfileRoute = nextUrl.pathname.startsWith('/admin/users/') && nextUrl.pathname.endsWith('/profile');

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  // Allow public routes
  if (isPublicRoute) {
    if (isLoggedIn) {
      // If logged in and trying to access a public route, redirect to home
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // If not logged in and trying to access a protected route, redirect to sign-in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  // Check role-based access for authenticated users
  if (isLoggedIn) {
    if (userRole === "USER" || userRole === "EMPLOYEE") {
      if (nextUrl.pathname === "/" || userRoutes.some(route => nextUrl.pathname.startsWith(route))) {
        return NextResponse.next();
      }
      // If a USER or EMPLOYEE tries to access an unauthorized route, redirect to their dashboard
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    if (userRole === "PAYROLL_MANAGER") {
      if (nextUrl.pathname === "/" || payrollManagerRoutes.some(route => nextUrl.pathname.startsWith(route)) || userRoutes.some(route => nextUrl.pathname.startsWith(route))) {
        return NextResponse.next();
      }
      // If a PAYROLL_MANAGER tries to access an unauthorized route, redirect to their dashboard
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    if (userRole === "ADMIN") {
      if (nextUrl.pathname === "/" || adminRoutes.some(route => nextUrl.pathname.startsWith(route)) || isAdminUserProfileRoute) {
        return NextResponse.next();
      }
      // If an ADMIN tries to access an unauthorized route, redirect to their dashboard
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // Default redirect for any other case
  if (nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
