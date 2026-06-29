import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const DB = "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SECRET = process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";

function auth(req: NextRequest): { sub: string; role: string } {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) throw new Error("No token");
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as { sub: string; role: string };
}

// GET /api/customers — paginated, filtered list with order counts
export async function GET(req: NextRequest) {
  try { auth(req); } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const per_page = Math.min(100, parseInt(searchParams.get("per_page") || "24"));
  const search = (searchParams.get("search") || "").trim();
  const property_type = (searchParams.get("property_type") || "").trim();
  const lead_source = (searchParams.get("lead_source") || "").trim();
  const offset = (page - 1) * per_page;

  try {
    const sql = neon(DB);
    const sp = search ? `%${search}%` : "";

    // Use neon's tagged template — all values are properly escaped by Neon's driver
    // We branch to avoid empty-string parameters causing type errors
    let rows: any[], countRows: any[];

    if (search && property_type) {
      [rows, countRows] = await Promise.all([
        sql`SELECT c.id,c.customer_id,c.name,c.phone,c.alternate_phone,c.email,c.address,c.latitude,c.longitude,c.maps_url,c.gst_number,c.property_type,c.lead_source,c.notes,c.created_at,c.updated_at,COUNT(DISTINCT o.id)::int AS total_orders,COALESCE(SUM(CASE WHEN o.status='COMPLETED' THEN o.total_amount ELSE 0 END),0) AS total_spent FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.is_deleted=false WHERE c.is_deleted=false AND c.property_type=${property_type} AND(c.name ILIKE ${sp} OR c.phone ILIKE ${sp} OR c.customer_id ILIKE ${sp}) GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM customers c WHERE c.is_deleted=false AND c.property_type=${property_type} AND(c.name ILIKE ${sp} OR c.phone ILIKE ${sp} OR c.customer_id ILIKE ${sp})`,
      ]);
    } else if (search) {
      [rows, countRows] = await Promise.all([
        sql`SELECT c.id,c.customer_id,c.name,c.phone,c.alternate_phone,c.email,c.address,c.latitude,c.longitude,c.maps_url,c.gst_number,c.property_type,c.lead_source,c.notes,c.created_at,c.updated_at,COUNT(DISTINCT o.id)::int AS total_orders,COALESCE(SUM(CASE WHEN o.status='COMPLETED' THEN o.total_amount ELSE 0 END),0) AS total_spent FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.is_deleted=false WHERE c.is_deleted=false AND(c.name ILIKE ${sp} OR c.phone ILIKE ${sp} OR c.customer_id ILIKE ${sp}) GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM customers c WHERE c.is_deleted=false AND(c.name ILIKE ${sp} OR c.phone ILIKE ${sp} OR c.customer_id ILIKE ${sp})`,
      ]);
    } else if (property_type) {
      [rows, countRows] = await Promise.all([
        sql`SELECT c.id,c.customer_id,c.name,c.phone,c.alternate_phone,c.email,c.address,c.latitude,c.longitude,c.maps_url,c.gst_number,c.property_type,c.lead_source,c.notes,c.created_at,c.updated_at,COUNT(DISTINCT o.id)::int AS total_orders,COALESCE(SUM(CASE WHEN o.status='COMPLETED' THEN o.total_amount ELSE 0 END),0) AS total_spent FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.is_deleted=false WHERE c.is_deleted=false AND c.property_type=${property_type} GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM customers WHERE is_deleted=false AND property_type=${property_type}`,
      ]);
    } else {
      [rows, countRows] = await Promise.all([
        sql`SELECT c.id,c.customer_id,c.name,c.phone,c.alternate_phone,c.email,c.address,c.latitude,c.longitude,c.maps_url,c.gst_number,c.property_type,c.lead_source,c.notes,c.created_at,c.updated_at,COUNT(DISTINCT o.id)::int AS total_orders,COALESCE(SUM(CASE WHEN o.status='COMPLETED' THEN o.total_amount ELSE 0 END),0) AS total_spent FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.is_deleted=false WHERE c.is_deleted=false GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM customers WHERE is_deleted=false`,
      ]);
    }

    const total = countRows[0]?.total ?? 0;
    return NextResponse.json({
      items: rows.map((r: any) => ({ ...r, total_spent: Number(r.total_spent) })),
      total, page, per_page, pages: Math.ceil(total / per_page),
    });
  } catch (err) {
    console.error("[Customers GET]", err);
    return NextResponse.json({ detail: "Failed to load customers" }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  let userId: string;
  try { const p = auth(req); userId = p.sub; } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }

  try {
    const body = await req.json();
    const { name, phone, alternate_phone, email, address, latitude, longitude, maps_url, gst_number, property_type, lead_source, notes } = body;

    if (!name?.trim()) return NextResponse.json({ detail: "Name is required" }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ detail: "Phone is required" }, { status: 400 });
    if (!address?.trim()) return NextResponse.json({ detail: "Address is required" }, { status: 400 });
    if (!property_type) return NextResponse.json({ detail: "Property type is required" }, { status: 400 });

    const sql = neon(DB);
    const countRow = await sql`SELECT COUNT(*)::int AS cnt FROM customers WHERE is_deleted=false`;
    const num = String((countRow[0]?.cnt ?? 0) + 1).padStart(4, "0");
    const customer_id = `PX-C-${num}`;

    const rows = await sql`
      INSERT INTO customers(id,customer_id,name,phone,alternate_phone,email,address,latitude,longitude,maps_url,gst_number,property_type,lead_source,notes,created_by,is_deleted)
      VALUES(gen_random_uuid(),${customer_id},${name.trim()},${phone.trim()},${alternate_phone||null},${email||null},${address.trim()},${latitude||null},${longitude||null},${maps_url||null},${gst_number||null},${property_type},${lead_source||"OTHER"},${notes||null},${userId}::uuid,false)
      RETURNING id,customer_id,name,phone,alternate_phone,email,address,latitude,longitude,maps_url,gst_number,property_type,lead_source,notes,created_at,updated_at
    `;
    return NextResponse.json({ ...rows[0], total_orders: 0, total_spent: 0 }, { status: 201 });
  } catch (err: any) {
    console.error("[Customers POST]", err);
    if (String(err).includes("unique")) return NextResponse.json({ detail: "Phone number already exists" }, { status: 409 });
    return NextResponse.json({ detail: "Failed to create customer" }, { status: 500 });
  }
}
