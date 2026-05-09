// proxy.ts
import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // For Better Auth, we check the session using the API
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const user = session?.user;

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

  if (!user) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (pathname.startsWith("/dashboard")) {
    const requestedRole = pathname.split("/")[2];
    const userRole = (user.role as string).toLowerCase();

    if (requestedRole && requestedRole !== userRole) {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
