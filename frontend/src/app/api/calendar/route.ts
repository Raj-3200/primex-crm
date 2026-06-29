import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const DB_URL =
  "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SECRET =
  process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";

function verifyAuth(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) throw new Error("No token");
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] });
}

export async function GET(req: NextRequest) {
  try {
    verifyAuth(req);
  } catch {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = neon(DB_URL);

    const rows = await sql`
      SELECT
        o.id,
        o.order_number,
        o.service_type,
        o.status,
        o.scheduled_date,
        o.scheduled_time,
        o.total_amount,
        c.name AS customer_name
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE o.scheduled_date IS NOT NULL
        AND o.is_deleted = false
        AND o.status NOT IN ('CANCELLED')
      ORDER BY o.scheduled_date ASC, o.scheduled_time ASC NULLS LAST
    `;

    const jobs = rows.map((r: any) => ({
      id: r.id,
      order_number: r.order_number,
      service_type: r.service_type,
      status: r.status,
      scheduled_date: r.scheduled_date
        ? new Date(r.scheduled_date).toISOString().split("T")[0]
        : null,
      scheduled_time: r.scheduled_time
        ? String(r.scheduled_time).slice(0, 5)
        : null,
      total_amount: Number(r.total_amount ?? 0),
      customer_name: r.customer_name,
    }));

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("[Calendar API Error]", err);
    return NextResponse.json(
      { detail: "Failed to load calendar data" },
      { status: 500 }
    );
  }
}
