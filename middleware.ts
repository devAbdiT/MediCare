import { NextResponse, type NextRequest } from "next/server";

/**
 * Maps a role string to its dashboard path.
 * Needed because some roles have different path names (e.g. LABTECH → lab, PHARMACIST → pharmacy).
 */
function roleToDashboardPath(role: string): string {
  switch (role.toUpperCase()) {
    case "LABTECH":    return "lab";
    case "PHARMACIST": return "pharmacy";
    default:           return role.toLowerCase();
  }
}

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

  // ── Rate Limiting (all /api/* except /api/auth/*) ──────────────────────────
  if (pathname.startsWith("/api/")) {
    // Extract client IP from standard proxy headers, fall back to loopback
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp    = request.headers.get("x-real-ip");
    const ip        = (forwarded ? forwarded.split(",")[0].trim() : realIp) || "127.0.0.1";

    // Dynamic import keeps this module out of the Edge bundle when not needed
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Allowed — attach rate-limit headers to the proxied response
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", "60");
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Get session details
  const session = await getSession(request);
  const user = session?.user;

  // Login page handling
  if (pathname === "/login") {
    if (user) {
      const dashPath = roleToDashboardPath(user.role as string);
      return NextResponse.redirect(new URL(`/dashboard/${dashPath}`, nextUrl));
    }
    return NextResponse.next();
  }

  // 2. Protect all other routes
  if (!user) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 3. Email Verification Gate — block unverified users from /dashboard/*
  if (pathname.startsWith("/dashboard") && user.emailVerified === false) {
    const email = encodeURIComponent(user.email ?? "");
    return NextResponse.redirect(
      new URL(`/verify-email?email=${email}`, nextUrl)
    );
  }

  // 4. Role-based Dashboard Protection
  if (pathname.startsWith("/dashboard")) {
    const userRole = (user.role as string).toUpperCase();

    if (pathname.startsWith("/dashboard/doctor") && userRole !== "DOCTOR" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${roleToDashboardPath(userRole)}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/receptionist") && userRole !== "RECEPTIONIST" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${roleToDashboardPath(userRole)}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/patient") && userRole !== "PATIENT" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${roleToDashboardPath(userRole)}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${roleToDashboardPath(userRole)}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/pharmacy") && userRole !== "PHARMACIST" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${roleToDashboardPath(userRole)}`, nextUrl));
    }

    if (pathname.startsWith("/dashboard/lab") && userRole !== "LABTECH" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/dashboard/${roleToDashboardPath(userRole)}`, nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/verify-email", "/api/:path*"],
};
