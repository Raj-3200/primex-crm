import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const DB = "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SECRET = process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";

function auth(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) throw new Error("No token");
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] });
}

export async function GET(req: NextRequest) {
  try { auth(req); } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const per_page = Math.min(100, parseInt(searchParams.get("per_page") || "20"));
  const search = (searchParams.get("search") || "").trim();
  const offset = (page - 1) * per_page;
  const sp = search ? `%${search}%` : "";

  try {
    const sql = neon(DB);

    let rows: any[], countRows: any[];

    if (search) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.total_amount,o.notes,o.created_at,(o.created_at+INTERVAL '1 year') AS renewal_date,c.id AS customer_id,c.name AS customer_name,c.phone AS customer_phone FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.service_type='COMBINED' AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp}) ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.service_type='COMBINED' AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp})`,
      ]);
    } else {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.total_amount,o.notes,o.created_at,(o.created_at+INTERVAL '1 year') AS renewal_date,c.id AS customer_id,c.name AS customer_name,c.phone AS customer_phone FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.service_type='COMBINED' ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE is_deleted=false AND service_type='COMBINED'`,
      ]);
    }

    const stats = await sql`SELECT COUNT(*)::int AS total,COALESCE(SUM(total_amount),0) AS value,SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END)::int AS active,SUM(CASE WHEN(created_at+INTERVAL '1 year')<NOW() THEN 1 ELSE 0 END)::int AS expired FROM orders WHERE is_deleted=false AND service_type='COMBINED'`;

    const s = stats[0];
    return NextResponse.json({
      items: rows.map((r: any) => ({
        ...r,
        total_amount: Number(r.total_amount),
        is_expiring_soon: new Date(r.renewal_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_expired: new Date(r.renewal_date) < new Date(),
      })),
      total: countRows[0]?.total ?? 0,
      page, per_page,
      pages: Math.ceil((countRows[0]?.total ?? 0) / per_page),
      stats: { total: Number(s.total), value: Number(s.value), active: Number(s.active), expired: Number(s.expired) },
    });
  } catch (err) {
    console.error("[Contracts]", err);
    return NextResponse.json({ detail: "Failed to load contracts" }, { status: 500 });
  }
}
