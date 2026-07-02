import { NextRequest, NextResponse } from "next/server";
import { requireAuthPayload, getDb, DB_URL } from "@/lib/server-auth";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

/**
 * GET /api/auth/me — Get current user profile
 */
export async function GET(req: NextRequest) {
  const authResult = requireAuthPayload(req);
  if ("error" in authResult) return authResult.error;
  const userId = authResult.payload.sub;

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, email, full_name, phone, role, is_active, created_at
      FROM users WHERE id = ${userId}::uuid AND is_deleted = false
    `;
    if (!rows.length) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("[Auth ME]", err);
    return NextResponse.json({ detail: "Failed to load profile" }, { status: 500 });
  }
}

/**
 * PATCH /api/auth/me — Update profile or change password
 */
export async function PATCH(req: NextRequest) {
  const authResult = requireAuthPayload(req);
  if ("error" in authResult) return authResult.error;
  const userId = authResult.payload.sub;

  try {
    const body = await req.json();
    const { full_name, phone, current_password, new_password } = body;
    const sql = neon(DB_URL);

    // If changing password
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ detail: "Current password is required" }, { status: 400 });
      }
      if (new_password.length < 8) {
        return NextResponse.json({ detail: "New password must be at least 8 characters" }, { status: 400 });
      }

      // Verify current password
      const userRows = await sql`
        SELECT hashed_password FROM users WHERE id = ${userId}::uuid AND is_deleted = false
      `;
      if (!userRows.length) {
        return NextResponse.json({ detail: "User not found" }, { status: 404 });
      }

      const valid = await bcrypt.compare(current_password, userRows[0].hashed_password);
      if (!valid) {
        return NextResponse.json({ detail: "Current password is incorrect" }, { status: 400 });
      }

      const hashed = await bcrypt.hash(new_password, 12);
      await sql`
        UPDATE users SET hashed_password = ${hashed}, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    // Update profile fields
    if (full_name !== undefined || phone !== undefined) {
      await sql`
        UPDATE users SET
          full_name = COALESCE(${full_name || null}, full_name),
          phone = COALESCE(${phone || null}, phone),
          updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    const updatedRows = await sql`
      SELECT id, email, full_name, phone, role, is_active, created_at
      FROM users WHERE id = ${userId}::uuid
    `;

    return NextResponse.json({
      ...updatedRows[0],
      message: new_password ? "Password changed successfully" : "Profile updated",
    });
  } catch (err) {
    console.error("[Auth ME PATCH]", err);
    return NextResponse.json({ detail: "Failed to update profile" }, { status: 500 });
  }
}
