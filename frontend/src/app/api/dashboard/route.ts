import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { DB_URL, requireAuth } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });


  try {
    const sql = neon(DB_URL);
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];

    const [stats, revenueChart, serviceDistrib, upcomingJobs, recentActivity] = await Promise.all([
      // KPI stats
      sql`
        SELECT
          COALESCE(SUM(CASE WHEN status='COMPLETED' AND DATE(completed_at)=CURRENT_DATE THEN total_amount END),0) AS today_revenue,
          COALESCE(SUM(CASE WHEN status='COMPLETED' AND completed_at >= ${monthStart}::date THEN total_amount END),0) AS monthly_revenue,
          COALESCE(SUM(CASE WHEN status='COMPLETED' AND completed_at >= ${yearStart}::date THEN total_amount END),0) AS yearly_revenue,
          COALESCE(SUM(CASE WHEN status NOT IN ('COMPLETED','CANCELLED') THEN total_amount END),0) AS total_outstanding,
          COUNT(CASE WHEN DATE(scheduled_date)=CURRENT_DATE AND status NOT IN ('COMPLETED','CANCELLED') THEN 1 END)::int AS today_jobs,
          COUNT(CASE WHEN scheduled_date > CURRENT_DATE AND status NOT IN ('COMPLETED','CANCELLED') THEN 1 END)::int AS upcoming_jobs,
          (SELECT COUNT(*)::int FROM customers WHERE is_deleted=false) AS total_customers,
          (SELECT COUNT(*)::int FROM customers WHERE is_deleted=false AND created_at >= ${monthStart}::date) AS new_customers_this_month
        FROM orders WHERE is_deleted=false
      `,
      // Revenue last 7 months
      sql`
        SELECT TO_CHAR(DATE_TRUNC('month',completed_at),'Mon') AS month,
               COALESCE(SUM(total_amount),0) AS revenue,
               COUNT(*)::int AS orders
        FROM orders WHERE status='COMPLETED' AND is_deleted=false
          AND completed_at >= NOW() - INTERVAL '7 months'
        GROUP BY DATE_TRUNC('month',completed_at)
        ORDER BY DATE_TRUNC('month',completed_at) ASC
      `,
      // Service distribution
      sql`
        SELECT service_type, COUNT(*)::int AS count
        FROM orders WHERE is_deleted=false
        GROUP BY service_type
      `,
      // Upcoming jobs (next 7 days)
      sql`
        SELECT o.id, o.order_number, o.service_type, o.status, o.scheduled_date, o.scheduled_time, o.total_amount,
               c.name AS customer_name, c.phone AS customer_phone
        FROM orders o JOIN customers c ON c.id=o.customer_id
        WHERE o.is_deleted=false AND o.scheduled_date >= CURRENT_DATE
          AND o.status NOT IN ('COMPLETED','CANCELLED')
        ORDER BY o.scheduled_date ASC, o.scheduled_time ASC NULLS LAST
        LIMIT 5
      `,
      // Recent activity (latest orders)
      sql`
        SELECT o.id, o.order_number, o.service_type, o.status, o.total_amount, o.created_at,
               c.name AS customer_name
        FROM orders o JOIN customers c ON c.id=o.customer_id
        WHERE o.is_deleted=false
        ORDER BY o.created_at DESC LIMIT 8
      `,
    ]);

    const s = stats[0];
    const dist: Record<string, number> = { solar: 0, tank: 0, combined: 0 };
    serviceDistrib.forEach((r: any) => {
      if (r.service_type === "SOLAR") dist.solar = r.count;
      if (r.service_type === "TANK") dist.tank = r.count;
      if (r.service_type === "COMBINED") dist.combined = r.count;
    });

    const serviceLabel = (t: string) =>
      t === "SOLAR" ? "☀️ Solar Cleaning" : t === "TANK" ? "💧 Tank Cleaning" : "🔧 AMC Service";

    return NextResponse.json({
      stats: {
        today_revenue: Number(s.today_revenue),
        monthly_revenue: Number(s.monthly_revenue),
        yearly_revenue: Number(s.yearly_revenue),
        total_outstanding: Number(s.total_outstanding),
        today_jobs: s.today_jobs,
        upcoming_jobs: s.upcoming_jobs,
        total_customers: s.total_customers,
        new_customers_this_month: s.new_customers_this_month,
      },
      revenue_chart: revenueChart.map((r: any) => ({
        month: r.month,
        revenue: Number(r.revenue),
        profit: Math.round(Number(r.revenue) * 0.35), // ~35% margin estimate
        orders: r.orders,
      })),
      service_distribution: dist,
      upcoming_jobs: upcomingJobs.map((j: any) => ({ ...j, total_amount: Number(j.total_amount) })),
      recent_activity: recentActivity.map((a: any) => ({
        id: a.id,
        title: `${serviceLabel(a.service_type)} — ${a.customer_name}`,
        description: `${a.order_number} · ₹${Number(a.total_amount).toLocaleString("en-IN")}`,
        time: new Date(a.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: a.status,
      })),
    });
  } catch (err) {
    console.error("[Dashboard]", err);
    return NextResponse.json({ detail: "Failed to load dashboard" }, { status: 500 });
  }
}
