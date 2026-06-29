import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DB = "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SECRET = process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";
const ACCESS_TTL = "24h";
const REFRESH_TTL = "7d";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password are required" }, { status: 400 });
    }

    const sql = neon(DB);
    const users = await sql`
      SELECT id, email, full_name, phone, role, hashed_password, is_active
      FROM users
      WHERE email = ${email.toLowerCase().trim()} AND is_deleted = false
      LIMIT 1
    `;

    if (!users.length) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const user = users[0];

    if (!user.is_active) {
      return NextResponse.json({ detail: "Account is inactive" }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.hashed_password);
    if (!passwordValid) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = jwt.sign(payload, SECRET, { expiresIn: ACCESS_TTL, algorithm: "HS256" });
    const refresh_token = jwt.sign({ sub: user.id }, SECRET, { expiresIn: REFRESH_TTL, algorithm: "HS256" });

    return NextResponse.json({
      access_token,
      refresh_token,
      token_type: "bearer",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[Auth Login]", err);
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
