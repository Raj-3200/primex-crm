import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/refresh", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public paths and static assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow all /api/* routes (they handle their own auth via JWT verification)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // For dashboard routes: auth is handled client-side via Zustand + localStorage
  // The dashboard layout redirects to /login if no token is found
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
};
