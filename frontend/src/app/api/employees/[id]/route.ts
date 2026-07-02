import { NextRequest, NextResponse } from "next/server";
import { requireAuthPayload, getDb, DB_URL } from "@/lib/server-auth";
import { neon } from "@neondatabase/serverless";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuthPayload(req);
  if ("error" in authResult) return authResult.error;
  if (authResult.payload.role !== "ADMIN") {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { full_name, phone, role, is_active } = body;
    const sql = neon(DB_URL);

    // Build update query based on provided fields
    const allowedRoles = ["ADMIN", "MANAGER", "TECHNICIAN"];
    if (role !== undefined && !allowedRoles.includes(role)) {
      return NextResponse.json({ detail: "Invalid role" }, { status: 400 });
    }

    // Check employee exists
    const existing = await sql`
      SELECT id FROM users WHERE id = ${id}::uuid AND is_deleted = false
    `;
    if (!existing.length) {
      return NextResponse.json({ detail: "Employee not found" }, { status: 404 });
    }

    const updated = await sql`
      UPDATE users SET
        full_name = CASE WHEN ${full_name !== undefined} THEN ${full_name || null} ELSE full_name END,
        phone = CASE WHEN ${phone !== undefined} THEN ${phone || null} ELSE phone END,
        role = CASE WHEN ${role !== undefined} THEN ${role || null}::userrole ELSE role END,
        is_active = CASE WHEN ${is_active !== undefined} THEN ${is_active === true} ELSE is_active END,
        updated_at = now()
      WHERE id = ${id}::uuid AND is_deleted = false
      RETURNING id, email, full_name, phone, role, is_active, created_at
    `;

    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error("[Employees PATCH]", err);
    return NextResponse.json({ detail: "Failed to update employee" }, { status: 500 });
  }
}
