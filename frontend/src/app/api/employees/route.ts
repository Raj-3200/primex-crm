import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAuthPayload, getDb, DB_URL } from "@/lib/server-auth";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const sql = getDb();
    const employees = await sql`
      SELECT id, email, full_name, phone, role, is_active, created_at
      FROM users WHERE is_deleted = false ORDER BY created_at DESC
    `;
    const total = employees.length;
    const admins = employees.filter((e: any) => e.role === "ADMIN").length;
    const managers = employees.filter((e: any) => e.role === "MANAGER").length;
    const technicians = employees.filter((e: any) => e.role === "TECHNICIAN").length;
    return NextResponse.json({ employees, stats: { total, admins, managers, technicians } });
  } catch (err) {
    console.error("[Employees GET]", err);
    return NextResponse.json({ detail: "Failed to load employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = requireAuthPayload(req);
  if ("error" in authResult) return authResult.error;
  if (authResult.payload.role !== "ADMIN") {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { full_name, email, phone, role, password } = body;

    if (!full_name?.trim()) return NextResponse.json({ detail: "Name is required" }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ detail: "Email is required" }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ detail: "Password must be at least 8 characters" }, { status: 400 });
    if (!["ADMIN", "MANAGER", "TECHNICIAN"].includes(role)) return NextResponse.json({ detail: "Invalid role" }, { status: 400 });

    const sql = neon(DB_URL);
    const hashed = await bcrypt.hash(password, 12);

    const rows = await sql`
      INSERT INTO users(id, email, hashed_password, full_name, phone, role, is_active, is_deleted)
      VALUES(gen_random_uuid(), ${email.trim().toLowerCase()}, ${hashed}, ${full_name.trim()}, ${phone || null}, ${role}, true, false)
      RETURNING id, email, full_name, phone, role, is_active, created_at
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: any) {
    console.error("[Employees POST]", err);
    if (String(err).includes("unique")) {
      return NextResponse.json({ detail: "An employee with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ detail: "Failed to create employee" }, { status: 500 });
  }
}
