/**
 * PrimeX CRM — Server-side Auth Utility for Next.js API Routes
 *
 * Usage in any API route:
 *   import { requireAuth, serverError, unauthorized } from "@/lib/server-auth";
 *   export async function GET(req: NextRequest) {
 *     const authError = requireAuth(req);
 *     if (authError) return authError;
 *     // ... rest of handler
 *   }
 */

import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// ─── Constants ────────────────────────────────────────────────────────────────
export const SECRET =
  process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";

export const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

// ─── Database ─────────────────────────────────────────────────────────────────
export function getDb() {
  return neon(DB_URL);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface TokenPayload {
  sub: string;
  role: string;
  email?: string;
}

/** Returns the decoded token, or throws with a 401 status */
export function verifyToken(req: NextRequest): TokenPayload {
  const raw = req.headers.get("authorization") || "";
  const token = raw.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw Object.assign(new Error("No token provided"), { status: 401 });
  }
  try {
    return jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as TokenPayload;
  } catch {
    throw Object.assign(new Error("Token invalid or expired"), { status: 401 });
  }
}

// ─── Response Helpers ─────────────────────────────────────────────────────────
export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ detail: message }, { status: 401 });
}

export function serverError(message = "Internal server error", err?: unknown) {
  if (err instanceof Error) console.error("[API Error]", err.message);
  return NextResponse.json({ detail: message }, { status: 500 });
}

/**
 * Use at the TOP of any GET/POST/PATCH/DELETE handler.
 * Returns a 401 response if auth fails, otherwise null (auth ok).
 *
 * @example
 * const authError = requireAuth(req);
 * if (authError) return authError;
 */
export function requireAuth(
  req: NextRequest
): NextResponse | null {
  try {
    verifyToken(req);
    return null; // auth ok
  } catch {
    return unauthorized();
  }
}

/**
 * Same as requireAuth but also returns the decoded payload.
 */
export function requireAuthPayload(
  req: NextRequest
): { error: NextResponse } | { payload: TokenPayload } {
  try {
    const payload = verifyToken(req);
    return { payload };
  } catch {
    return { error: unauthorized() };
  }
}
