import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getDb } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const sql = getDb();
    const [contracts, statsRows] = await Promise.all([
      sql`SELECT o.id, o.order_number, o.service_type, o.status, o.total_amount, o.created_at, o.scheduled_date, o.notes, c.name AS customer_name, c.customer_id AS customer_code, c.phone AS customer_phone, c.address AS customer_address FROM orders o JOIN customers c ON c.id = o.customer_id AND c.is_deleted = false WHERE o.service_type = 'COMBINED' AND o.is_deleted = false ORDER BY o.created_at DESC`,
      sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status IN ('PENDING','SCHEDULED','IN_PROGRESS')) AS active, COUNT(*) FILTER (WHERE status = 'COMPLETED') AS expired, COALESCE(SUM(total_amount), 0) AS total_value FROM orders WHERE service_type = 'COMBINED' AND is_deleted = false`,
    ]);
    return NextResponse.json({ items: contracts, stats: { total: Number(statsRows[0].total), active: Number(statsRows[0].active), expired: Number(statsRows[0].expired), total_value: Number(statsRows[0].total_value) } });
  } catch (err) {
    console.error("[Contracts API]", err);
    return NextResponse.json({ detail: "Failed to load contracts" }, { status: 500 });
  }
}
