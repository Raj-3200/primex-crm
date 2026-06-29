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

function mapOrder(r: any) {
  return { ...r, total_amount: Number(r.total_amount), subtotal: Number(r.subtotal), discount: Number(r.discount), tax_amount: Number(r.tax_amount) };
}

// GET /api/orders — paginated list with filters
export async function GET(req: NextRequest) {
  try { auth(req); } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const per_page = Math.min(100, parseInt(searchParams.get("per_page") || "20"));
  const search = (searchParams.get("search") || "").trim();
  const status = (searchParams.get("status") || "").trim();
  const service_type = (searchParams.get("service_type") || "").trim();
  const customer_id = (searchParams.get("customer_id") || "").trim();
  const offset = (page - 1) * per_page;
  const sp = search ? `%${search}%` : "";

  try {
    const sql = neon(DB);
    let rows: any[], countRows: any[];

    // No filters — most common case
    if (!search && !status && !service_type && !customer_id) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.scheduled_time,o.completed_at,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.customer_id,o.assigned_to,o.created_by,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,u.full_name AS assigned_name FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN users u ON u.id=o.assigned_to WHERE o.is_deleted=false ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE is_deleted=false`,
      ]);
    } else if (search && status && service_type) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.scheduled_time,o.completed_at,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.customer_id,o.assigned_to,o.created_by,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,u.full_name AS assigned_name FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN users u ON u.id=o.assigned_to WHERE o.is_deleted=false AND o.status=${status} AND o.service_type=${service_type} AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp}) ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.status=${status} AND o.service_type=${service_type} AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp})`,
      ]);
    } else if (search && status) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.scheduled_time,o.completed_at,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.customer_id,o.assigned_to,o.created_by,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,u.full_name AS assigned_name FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN users u ON u.id=o.assigned_to WHERE o.is_deleted=false AND o.status=${status} AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp}) ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.status=${status} AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp})`,
      ]);
    } else if (search && service_type) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.scheduled_time,o.completed_at,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.customer_id,o.assigned_to,o.created_by,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,u.full_name AS assigned_name FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN users u ON u.id=o.assigned_to WHERE o.is_deleted=false AND o.service_type=${service_type} AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp}) ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND o.service_type=${service_type} AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp})`,
      ]);
    } else if (status && service_type) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.scheduled_time,o.completed_at,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.customer_id,o.assigned_to,o.created_by,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,u.full_name AS assigned_name FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN users u ON u.id=o.assigned_to WHERE o.is_deleted=false AND o.status=${status} AND o.service_type=${service_type} ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE is_deleted=false AND status=${status} AND service_type=${service_type}`,
      ]);
    } else if (search) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.scheduled_time,o.completed_at,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.customer_id,o.assigned_to,o.created_by,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,u.full_name AS assigned_name FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN users u ON u.id=o.assigned_to WHERE o.is_deleted=false AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp}) ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.is_deleted=false AND(o.order_number ILIKE ${sp} OR c.name ILIKE ${sp})`,
      ]);
    } else if (status) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.scheduled_time,o.completed_at,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.customer_id,o.assigned_to,o.created_by,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,u.full_name AS assigned_name FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN users u ON u.id=o.assigned_to WHERE o.is_deleted=false AND o.status=${status} ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE is_deleted=false AND status=${status}`,
      ]);
    } else if (service_type) {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.scheduled_time,o.completed_at,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.customer_id,o.assigned_to,o.created_by,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,u.full_name AS assigned_name FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN users u ON u.id=o.assigned_to WHERE o.is_deleted=false AND o.service_type=${service_type} ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE is_deleted=false AND service_type=${service_type}`,
      ]);
    } else {
      [rows, countRows] = await Promise.all([
        sql`SELECT o.id,o.order_number,o.service_type,o.status,o.scheduled_date,o.scheduled_time,o.completed_at,o.subtotal,o.discount,o.tax_rate,o.tax_amount,o.total_amount,o.notes,o.customer_id,o.assigned_to,o.created_by,o.created_at,o.updated_at,c.name AS customer_name,c.phone AS customer_phone,u.full_name AS assigned_name FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN users u ON u.id=o.assigned_to WHERE o.is_deleted=false AND o.customer_id=${customer_id}::uuid ORDER BY o.created_at DESC LIMIT ${per_page} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int AS total FROM orders WHERE is_deleted=false AND customer_id=${customer_id}::uuid`,
      ]);
    }

    const total = countRows[0]?.total ?? 0;
    return NextResponse.json({ items: rows.map(mapOrder), total, page, per_page, pages: Math.ceil(total / per_page) });
  } catch (err) {
    console.error("[Orders GET]", err);
    return NextResponse.json({ detail: "Failed to load orders" }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(req: NextRequest) {
  let userId: string;
  try { const p = auth(req); userId = p.sub; } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }

  try {
    const body = await req.json();
    const { customer_id, service_type, scheduled_date, scheduled_time, subtotal, discount = 0, tax_rate = 0, notes, assigned_to, solar_detail, tank_detail } = body;

    if (!customer_id) return NextResponse.json({ detail: "Customer is required" }, { status: 400 });
    if (!service_type) return NextResponse.json({ detail: "Service type is required" }, { status: 400 });

    const sql = neon(DB);
    const countRow = await sql`SELECT COUNT(*)::int AS cnt FROM orders WHERE is_deleted=false`;
    const num = String((countRow[0]?.cnt ?? 0) + 1).padStart(4, "0");
    const order_number = `PX-${new Date().getFullYear()}-${num}`;

    const sub = Number(subtotal) || 0;
    const disc = Number(discount) || 0;
    const taxRate = Number(tax_rate) || 0;
    const taxable = sub - disc;
    const tax_amount = parseFloat((taxable * taxRate / 100).toFixed(2));
    const total_amount = parseFloat((taxable + tax_amount).toFixed(2));

    const orderRows = await sql`
      INSERT INTO orders(id,order_number,customer_id,service_type,status,scheduled_date,scheduled_time,subtotal,discount,tax_rate,tax_amount,total_amount,notes,assigned_to,created_by,is_deleted)
      VALUES(gen_random_uuid(),${order_number},${customer_id}::uuid,${service_type},'PENDING',${scheduled_date||null},${scheduled_time||null},${sub},${disc},${taxRate},${tax_amount},${total_amount},${notes||null},${assigned_to||null}::uuid,${userId}::uuid,false)
      RETURNING id,order_number,service_type,status,scheduled_date,scheduled_time,subtotal,discount,tax_rate,tax_amount,total_amount,notes,customer_id,created_at
    `;

    const order = orderRows[0];

    if (service_type === "SOLAR" && solar_detail) {
      const { panel_count, capacity_kw, roof_type, panel_type, remarks } = solar_detail;
      await sql`INSERT INTO solar_cleaning_details(id,order_id,panel_count,capacity_kw,roof_type,panel_type,remarks) VALUES(gen_random_uuid(),${order.id}::uuid,${panel_count||0},${capacity_kw||0},${roof_type||'FLAT'},${panel_type||'MONOCRYSTALLINE'},${remarks||null})`;
    }
    if ((service_type === "TANK" || service_type === "COMBINED") && tank_detail) {
      const { tank_type, capacity_liters, number_of_tanks, chemical_used, remarks } = tank_detail;
      await sql`INSERT INTO tank_cleaning_details(id,order_id,tank_type,capacity_liters,number_of_tanks,chemical_used,remarks) VALUES(gen_random_uuid(),${order.id}::uuid,${tank_type||'OVERHEAD'},${capacity_liters||0},${number_of_tanks||1},${chemical_used||null},${remarks||null})`;
    }

    await sql`INSERT INTO activity_logs(id,order_id,user_id,action,details,entity_type,entity_id) VALUES(gen_random_uuid(),${order.id}::uuid,${userId}::uuid,'ORDER_CREATED','Order created','order',${order.id})`.catch(()=>{});

    return NextResponse.json({ ...order, total_amount: Number(order.total_amount) }, { status: 201 });
  } catch (err: any) {
    console.error("[Orders POST]", err);
    return NextResponse.json({ detail: "Failed to create order" }, { status: 500 });
  }
}
