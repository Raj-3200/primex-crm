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
  const status = (searchParams.get("status") || "").trim();
  const offset = (page - 1) * per_page;
  const sp = search ? `%${search}%` : "";

  try {
    const sql = neon(DB);
    let rows: any[], countRows: any[];

    if (search && status) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.created_at,o.updated_at,c.id AS customer_id,c.name AS customer_name,c.phone AS customer_phone,c.email AS customer_email FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.status=${status} AND o.total_amount>0 AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp}) ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.status=${status} AND o.total_amount>0 AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp})`,
      ]);
    } else if (search) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.created_at,o.updated_at,c.id AS customer_id,c.name AS customer_name,c.phone AS customer_phone,c.email AS customer_email FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.status IN('PENDING','SCHEDULED','CANCELLED') AND o.total_amount>0 AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp}) ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.status IN('PENDING','SCHEDULED','CANCELLED') AND o.total_amount>0 AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp})`,
      ]);
    } else if (status) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.created_at,o.updated_at,c.id AS customer_id,c.name AS customer_name,c.phone AS customer_phone,c.email AS customer_email FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.status=${status} AND o.total_amount>0 ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE is_deleted=false AND status=${status} AND total_amount>0`,
      ]);
    } else {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.created_at,o.updated_at,c.id AS customer_id,c.name AS customer_name,c.phone AS customer_phone,c.email AS customer_email FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.status IN('PENDING','SCHEDULED','CANCELLED') AND o.total_amount>0 ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE is_deleted=false AND status IN('PENDING','SCHEDULED','CANCELLED') AND total_amount>0`,
      ]);
    }

    const stats = await sql`SELECT COUNT(*)::int AS total,SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END)::int AS pending,SUM(CASE WHEN status='SCHEDULED' THEN 1 ELSE 0 END)::int AS sent,COALESCE(SUM(total_amount),0) AS total_value FROM orders WHERE is_deleted=false AND status IN('PENDING','SCHEDULED','CANCELLED') AND total_amount>0`;

    const s = stats[0];
    return NextResponse.json({
      items: rows.map((r: any) => ({
        ...r,
        total_amount: Number(r.total_amount),
        subtotal: Number(r.subtotal),
        discount: Number(r.discount),
        tax_amount: Number(r.tax_amount),
      })),
      total: countRows[0]?.total ?? 0,
      page, per_page,
      pages: Math.ceil((countRows[0]?.total ?? 0) / per_page),
      stats: { total: Number(s.total), pending: Number(s.pending), sent: Number(s.sent), total_value: Number(s.total_value) },
    });
  } catch (err) {
    console.error("[Quotations]", err);
    return NextResponse.json({ detail: "Failed to load quotations" }, { status: 500 });
  }
}
