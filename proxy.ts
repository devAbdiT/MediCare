// proxy.ts
import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy Layer
 * Handles optimistic routing and role-based redirection.
 */
export async function proxy(request: NextRequest) {
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
    const requestedRole = pathname.split("/")[2];
    const userRole = (user.role as string).toLowerCase();

    // If trying to access a dashboard that doesn't match the role
    if (requestedRole && requestedRole !== userRole) {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, nextUrl));
    }
  }

  return NextResponse.next();
}

// Next.js 16 requires a config for the proxy matcher
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
