import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { DB_URL, requireAuth, SECRET } from "@/lib/server-auth";
import jwt from "jsonwebtoken";

function auth(req: NextRequest): { sub: string; role: string } {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) throw new Error("No token");
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as { sub: string; role: string };
}

type Params = { params: Promise<{ id: string }> };


// GET /api/customers/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try { auth(req); } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  try {
    const sql = neon(DB_URL);
    const [customers, orders, stats] = await Promise.all([
      sql`SELECT c.*, cb.full_name AS created_by_name
          FROM customers c
          LEFT JOIN users cb ON cb.id = c.created_by
          WHERE c.id = ${id}::uuid AND c.is_deleted = false LIMIT 1`,
      sql`SELECT id, order_number, service_type, status, total_amount, created_at, scheduled_date
          FROM orders WHERE customer_id = ${id}::uuid AND is_deleted = false ORDER BY created_at DESC LIMIT 20`,
      sql`SELECT COUNT(*)::int as total_orders,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)::int as completed
          FROM orders WHERE customer_id = ${id}::uuid AND is_deleted = false`,
    ]);
    if (!customers[0]) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    return NextResponse.json({
      customer: customers[0],
      orders: orders.map((o: any) => ({ ...o, total_amount: Number(o.total_amount) })),
      stats: { total_orders: Number(stats[0].total_orders), total_revenue: Number(stats[0].total_revenue), completed: Number(stats[0].completed) },
    });
  } catch (err) { console.error(err); return NextResponse.json({ detail: "Server error" }, { status: 500 }); }
}

// PUT /api/customers/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  let userId: string;
  try { const p = auth(req); userId = p.sub; } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, phone, alternate_phone, email, address, latitude, longitude,
            maps_url, gst_number, property_type, lead_source, notes } = body;
    const sql = neon(DB_URL);
    const rows = await sql`
      UPDATE customers SET
        name = COALESCE(${name || null}, name),
        phone = COALESCE(${phone || null}, phone),
        alternate_phone = ${alternate_phone || null},
        email = ${email || null},
        address = COALESCE(${address || null}, address),
        latitude = ${latitude || null},
        longitude = ${longitude || null},
        maps_url = ${maps_url || null},
        gst_number = ${gst_number || null},
        property_type = COALESCE(${property_type || null}::text, property_type::text)::propertytypenum,
        lead_source = COALESCE(${lead_source || null}::text, lead_source::text)::leadsourceenum,
        notes = ${notes || null},
        updated_at = NOW()
      WHERE id = ${id}::uuid AND is_deleted = false
      RETURNING id, customer_id, name, phone, alternate_phone, email, address,
                latitude, longitude, maps_url, gst_number, property_type,
                lead_source, notes, created_at, updated_at
    `;
    if (!rows[0]) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    return NextResponse.json({ ...rows[0], total_orders: 0, total_spent: 0 });
  } catch (err) { console.error(err); return NextResponse.json({ detail: "Failed to update" }, { status: 500 }); }
}

// PATCH /api/customers/[id] — alias for PUT
export const PATCH = PUT;


// DELETE /api/customers/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  let userRole: string;
  try { const p = auth(req); userRole = p.role; } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }
  if (userRole !== "ADMIN") return NextResponse.json({ detail: "Admin only" }, { status: 403 });
  const { id } = await params;
  try {
    const sql = neon(DB_URL);
    await sql`UPDATE customers SET is_deleted = true, updated_at = NOW() WHERE id = ${id}::uuid`;
    return NextResponse.json({ detail: "Deleted" });
  } catch (err) { console.error(err); return NextResponse.json({ detail: "Failed to delete" }, { status: 500 }); }
}
