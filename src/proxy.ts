import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/auth/signin"];
const userRoutes = ["/my-invoices", "/invoices/new"];
const payrollManagerRoutes = ["/invoices"];
const adminRoutes = ["/admin/users", "/admin/settings"];

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  if (isPublicRoute) {
    if (isLoggedIn) {
      // If logged in and trying to access a public route, redirect to home or dashboard
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // If not logged in and trying to access a protected route, redirect to sign-in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  // Check role-based access for protected routes
  if (userRole === "USER") {
    if (userRoutes.some(route => nextUrl.pathname.startsWith(route))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (userRole === "PAYROLL_MANAGER") {
    if (payrollManagerRoutes.some(route => nextUrl.pathname.startsWith(route)) || userRoutes.some(route => nextUrl.pathname.startsWith(route))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (userRole === "ADMIN") {
    if (adminRoutes.some(route => nextUrl.pathname.startsWith(route)) || payrollManagerRoutes.some(route => nextUrl.pathname.startsWith(route)) || userRoutes.some(route => nextUrl.pathname.startsWith(route))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Default to redirect to home if no specific role matches or route is not handled
  return NextResponse.redirect(new URL("/", nextUrl));
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
