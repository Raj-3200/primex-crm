import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getDb } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const [orders, statsRows] = await Promise.all([
      sql`
        SELECT
          o.id, o.order_number, o.status, o.subtotal, o.discount,
          o.tax_amount, o.total_amount, o.scheduled_date, o.scheduled_time,
          o.completed_at, o.notes, o.assigned_to, o.created_at,
          c.id AS customer_id, c.name AS customer_name,
          c.email AS customer_email, c.phone AS customer_phone,
          c.address AS customer_address
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id AND c.is_deleted = false
        WHERE o.service_type = 'SOLAR' AND o.is_deleted = false
        ORDER BY o.created_at DESC
      `,
      sql`
        SELECT
          COUNT(*)                                                           AS total,
          COUNT(*) FILTER (WHERE status = 'COMPLETED')                      AS completed,
          COUNT(*) FILTER (WHERE status IN ('PENDING','SCHEDULED','IN_PROGRESS')) AS pending,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'COMPLETED'), 0) AS revenue
        FROM orders WHERE service_type = 'SOLAR' AND is_deleted = false
      `,
    ]);

    return NextResponse.json({
      orders,
      stats: {
        total: Number(statsRows[0].total),
        completed: Number(statsRows[0].completed),
        pending: Number(statsRows[0].pending),
        revenue: Number(statsRows[0].revenue),
      },
    });
  } catch (err) {
    console.error("[Solar API]", err);
    return NextResponse.json({ detail: "Failed to load solar jobs" }, { status: 500 });
  }
}
