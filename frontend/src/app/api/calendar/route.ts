import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAuthPayload, getDb } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const sql = getDb();
    const events = await sql`
      SELECT o.id, o.order_number, o.service_type, o.status,
             o.scheduled_date, o.scheduled_time, o.total_amount,
             c.name AS customer_name, c.phone AS customer_phone
      FROM orders o
      JOIN customers c ON c.id = o.customer_id AND c.is_deleted = false
      WHERE o.scheduled_date IS NOT NULL AND o.is_deleted = false
        AND o.status NOT IN ('CANCELLED', 'COMPLETED')
      ORDER BY o.scheduled_date ASC, o.scheduled_time ASC NULLS LAST
    `;
    return NextResponse.json({ jobs: events });
  } catch (err) {
    console.error("[Calendar API]", err);
    return NextResponse.json({ detail: "Failed to load calendar" }, { status: 500 });
  }
}
