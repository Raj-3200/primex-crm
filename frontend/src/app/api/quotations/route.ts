import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getDb } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const sql = getDb();
    const [quotations, statsRows] = await Promise.all([
      sql`SELECT o.id, o.order_number, o.service_type, o.status, o.total_amount, o.created_at, o.scheduled_date, c.name AS customer_name, c.customer_id AS customer_code, c.phone AS customer_phone FROM orders o JOIN customers c ON c.id = o.customer_id AND c.is_deleted = false WHERE o.status IN ('PENDING','SCHEDULED') AND o.is_deleted = false ORDER BY o.created_at DESC`,
      sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='PENDING') AS pending, COUNT(*) FILTER (WHERE status='SCHEDULED') AS scheduled, COALESCE(SUM(total_amount), 0) AS total_value FROM orders WHERE status IN ('PENDING','SCHEDULED') AND is_deleted = false`,
    ]);
    return NextResponse.json({ items: quotations, stats: { total: Number(statsRows[0].total), pending: Number(statsRows[0].pending), scheduled: Number(statsRows[0].scheduled), total_value: Number(statsRows[0].total_value) } });
  } catch (err) {
    console.error("[Quotations API]", err);
    return NextResponse.json({ detail: "Failed to load quotations" }, { status: 500 });
  }
}
