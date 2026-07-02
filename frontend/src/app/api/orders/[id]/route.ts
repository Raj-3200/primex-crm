import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { DB_URL, SECRET } from "@/lib/server-auth";
import jwt from "jsonwebtoken";

function auth(req: NextRequest): { sub: string; role: string } {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) throw new Error("No token");
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as { sub: string; role: string };
}

type Params = { params: Promise<{ id: string }> };


// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try { auth(req); } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  try {
    const sql = neon(DB_URL);
    const orders = await sql`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
                 c.email as customer_email, c.address as customer_address,
                 c.customer_id as customer_code,
                 u.full_name as assigned_name, cb.full_name as created_by_name
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      LEFT JOIN users u ON u.id = o.assigned_to
      LEFT JOIN users cb ON cb.id = o.created_by
      WHERE o.id = ${id}::uuid AND o.is_deleted = false LIMIT 1
    `;
    if (!orders[0]) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    // These tables may not exist yet — return null/[] gracefully
    const [solar, tank, logs] = await Promise.all([
      sql`SELECT * FROM solar_cleaning_details WHERE order_id = ${id}::uuid LIMIT 1`.catch(() => []),
      sql`SELECT * FROM tank_cleaning_details WHERE order_id = ${id}::uuid LIMIT 1`.catch(() => []),
      sql`SELECT al.*, u.full_name FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id WHERE al.order_id = ${id}::uuid ORDER BY al.created_at DESC LIMIT 20`.catch(() => []),
    ]);

    const o = orders[0];
    return NextResponse.json({
      order: { ...o, total_amount: Number(o.total_amount), subtotal: Number(o.subtotal), discount: Number(o.discount), tax_amount: Number(o.tax_amount) },
      solar_detail: solar[0] || null,
      tank_detail: tank[0] || null,
      activity_logs: logs,
    });
  } catch (err) { console.error(err); return NextResponse.json({ detail: "Server error" }, { status: 500 }); }
}

// PATCH /api/orders/[id] — update status or fields
export async function PATCH(req: NextRequest, { params }: Params) {
  let userId: string;
  try { const p = auth(req); userId = p.sub; } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  try {
    const body = await req.json();
    const { status, notes, scheduled_date, scheduled_time, assigned_to } = body;
    const sql = neon(DB_URL);

    const completedAt = status === "COMPLETED" ? new Date().toISOString() : null;

    const rows = await sql`
      UPDATE orders SET
        status = COALESCE(${status || null}, status),
        notes = COALESCE(${notes || null}, notes),
        scheduled_date = COALESCE(${scheduled_date || null}, scheduled_date),
        scheduled_time = COALESCE(${scheduled_time || null}, scheduled_time),
        assigned_to = COALESCE(${assigned_to ? assigned_to : null}::uuid, assigned_to),
        completed_at = CASE WHEN ${status || ''} = 'COMPLETED' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
      WHERE id = ${id}::uuid AND is_deleted = false
      RETURNING id, order_number, status, notes, scheduled_date, scheduled_time,
                completed_at, total_amount, subtotal, discount, tax_amount
    `;
    if (!rows[0]) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    // Log activity
    if (status) {
      await sql`
        INSERT INTO activity_logs (id, order_id, user_id, action, details, entity_type, entity_id)
        VALUES (gen_random_uuid(), ${id}::uuid, ${userId}::uuid, 'STATUS_CHANGED', ${'Status changed to ' + status}, 'order', ${id})
      `.catch(() => {});
    }

    const r = rows[0];
    return NextResponse.json({ ...r, total_amount: Number(r.total_amount) });
  } catch (err) { console.error(err); return NextResponse.json({ detail: "Failed to update order" }, { status: 500 }); }
}

// DELETE /api/orders/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  let userRole: string;
  try { const p = auth(req); userRole = p.role; } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }
  if (!["ADMIN", "MANAGER"].includes(userRole)) return NextResponse.json({ detail: "Not authorized" }, { status: 403 });
  const { id } = await params;
  try {
    const sql = neon(DB_URL);
    await sql`UPDATE orders SET is_deleted = true, updated_at = NOW() WHERE id = ${id}::uuid`;
    return NextResponse.json({ detail: "Deleted" });
  } catch (err) { console.error(err); return NextResponse.json({ detail: "Failed to delete" }, { status: 500 }); }
}
