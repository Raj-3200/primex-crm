import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const DB = "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SECRET = process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const refresh_token = body?.refresh_token;

    if (!refresh_token) {
      return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
    }

    const payload = jwt.verify(refresh_token, SECRET, { algorithms: ["HS256"] }) as { sub: string };

    const sql = neon(DB);
    const rows = await sql`
      SELECT id, email, role, is_active FROM users
      WHERE id = ${payload.sub}::uuid AND is_deleted = false LIMIT 1
    `;
    const user = rows[0];
    if (!user || !user.is_active) {
      return NextResponse.json({ detail: "User not found" }, { status: 401 });
    }

    const access_token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      SECRET,
      { expiresIn: "24h", algorithm: "HS256" }
    );
    const new_refresh_token = jwt.sign(
      { sub: user.id },
      SECRET,
      { expiresIn: "7d", algorithm: "HS256" }
    );

    return NextResponse.json({ access_token, refresh_token: new_refresh_token, token_type: "bearer" });
  } catch {
    return NextResponse.json({ detail: "Invalid or expired token" }, { status: 401 });
  }
}
