import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/auth/signin", "/auth/request-account"]; // Added /auth/request-account
const userRoutes = ["/my-invoices", "/invoices", "/settings", "/notifications"];
const payrollManagerRoutes = ["/invoices", "/notifications"];
const adminRoutes = ["/admin/users", "/admin/settings", "/notifications", "/admin/analytics"];

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

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
      // ADMINs have full access, no specific route checks needed here as they can access all
      // We will assume that any route not caught by previous conditions is accessible to ADMIN
      return NextResponse.next();
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