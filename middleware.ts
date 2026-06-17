import { NextResponse, type NextRequest } from "next/server";

/**
 * Fetch session from the API to avoid loading Prisma Client in the Next.js Edge Runtime.
 */
async function getSession(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const response = await fetch(`${origin}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
        "user-agent": request.headers.get("user-agent") || "",
      },
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error("Middleware session fetch error:", err);
  }
  return null;
}

/**
 * Next.js 16 Middleware
 * Handles optimistic routing and role-based redirection.
 */
export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // 1. Fast Path for public, static and auth endpoints
  if (
    pathname === "/" ||
    pathname === "/register" ||
    pathname === "/api/register" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Get session details
  const session = await getSession(request);
  const user = session?.user;

  // Login page handling
  if (pathname === "/login") {
    if (user) {
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

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
