import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/refresh",
  "/_next",
  "/favicon.ico",
];

// Next.js 16: export must be named "proxy" (previously "middleware")
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // All /api/* routes handle their own auth via JWT verification
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Dashboard routes: auth handled client-side via Zustand + localStorage
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
