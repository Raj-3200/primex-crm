import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getDb } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const sql = getDb();
    const [monthly, topCustomers, serviceBreakdown, statusBreakdown] =
      await Promise.all([
        sql`SELECT TO_CHAR(DATE_TRUNC('month', completed_at), 'Mon YYYY') AS month, DATE_TRUNC('month', completed_at) AS month_date, COALESCE(SUM(total_amount), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE status = 'COMPLETED' AND is_deleted = false AND completed_at >= NOW() - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', completed_at) ORDER BY month_date ASC`,
        sql`SELECT c.name AS customer_name, c.customer_id AS customer_code, COUNT(o.id)::int AS order_count, COALESCE(SUM(o.total_amount), 0) AS total_revenue FROM customers c JOIN orders o ON o.customer_id = c.id AND o.is_deleted = false WHERE c.is_deleted = false GROUP BY c.id, c.name, c.customer_id ORDER BY total_revenue DESC LIMIT 5`,
        sql`SELECT service_type, COUNT(*)::int AS count, COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE is_deleted = false GROUP BY service_type`,
        sql`SELECT status, COUNT(*)::int AS count FROM orders WHERE is_deleted = false GROUP BY status`,
      ]);
    const serviceDistribution = Object.fromEntries(
      serviceBreakdown.map((r: any) => [
        r.service_type,
        { count: r.count, revenue: Number(r.revenue) },
      ]),
    );
    const statusBreakdownData = statusBreakdown.map((r: any) => ({
      status: r.status,
      count: r.count,
    }));
    return NextResponse.json({
      monthly_revenue: monthly.map((r: any) => ({
        ...r,
        revenue: Number(r.revenue),
      })),
      top_customers: topCustomers.map((r: any) => ({
        ...r,
        total_revenue: Number(r.total_revenue),
      })),
      service_breakdown: serviceDistribution,
      status_breakdown: statusBreakdownData,
    });
  } catch (err) {
    console.error("[Reports API]", err);
    return NextResponse.json(
      { detail: "Failed to load reports" },
      { status: 500 },
    );
  }
}
