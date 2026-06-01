import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Middleware
 * Handles optimistic routing and role-based redirection.
 */
export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Check for session (Better Auth)
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const user = session?.user;

  // 1. Public / Login handling
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/api/register" ||
    pathname.startsWith("/api/auth")
  ) {
    if (user && pathname === "/login") {
      const role = (user.role as string).toLowerCase();
      return NextResponse.redirect(new URL(`/dashboard/${role}`, nextUrl));
    }
    return NextResponse.next();
  }

  // 2. Protect all other routes
  if (!user) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 3. Role-based Dashboard Protection
  if (pathname.startsWith("/dashboard")) {
    const userRole = (user.role as string).toUpperCase();

    if (pathname.startsWith("/dashboard/doctor") && userRole !== "DOCTOR" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${userRole.toLowerCase()}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/receptionist") && userRole !== "RECEPTIONIST" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${userRole.toLowerCase()}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/patient") && userRole !== "PATIENT" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${userRole.toLowerCase()}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${userRole.toLowerCase()}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/pharmacy") && userRole !== "PHARMACIST" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${userRole.toLowerCase()}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/lab") && userRole !== "LABTECH" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${userRole.toLowerCase()}`, nextUrl));
    }
  }

  return NextResponse.next();
}

// Next.js 16 requires a config for the proxy matcher
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
