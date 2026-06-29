import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const DB = "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SECRET = process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";

export async function GET(req: NextRequest) {
  try {
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const payload = jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as { sub: string };

    const sql = neon(DB);
    const rows = await sql`
      SELECT id, email, full_name, phone, role, is_active
      FROM users WHERE id = ${payload.sub}::uuid AND is_deleted = false LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ detail: "User not found" }, { status: 404 });

    const u = rows[0];
    return NextResponse.json({ id: u.id, email: u.email, full_name: u.full_name, phone: u.phone, role: u.role, is_active: u.is_active });
  } catch {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
}
