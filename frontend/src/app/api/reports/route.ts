import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const DB = "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SECRET = process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";

function auth(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) throw new Error("No token");
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] });
}

export async function GET(req: NextRequest) {
  try { auth(req); } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }

  try {
    const sql = neon(DB);

    const [summary, monthly, topCustomers, serviceBreakdown, statusBreakdown] = await Promise.all([
      // Overall summary
      sql`
        SELECT
          COUNT(*)::int AS total_orders,
          SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END)::int AS completed_orders,
          SUM(CASE WHEN status='PENDING' OR status='SCHEDULED' THEN 1 ELSE 0 END)::int AS pending_orders,
          COALESCE(SUM(CASE WHEN status='COMPLETED' THEN total_amount ELSE 0 END),0) AS total_revenue,
          COALESCE(SUM(CASE WHEN status NOT IN ('COMPLETED','CANCELLED') THEN total_amount ELSE 0 END),0) AS outstanding,
          COALESCE(SUM(CASE WHEN status='COMPLETED' AND completed_at >= DATE_TRUNC('month',NOW()) THEN total_amount ELSE 0 END),0) AS monthly_revenue
        FROM orders WHERE is_deleted=false
      `,
      // Monthly revenue last 6 months
      sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', completed_at), 'Mon YY') AS month,
          DATE_TRUNC('month', completed_at) AS month_date,
          COALESCE(SUM(total_amount), 0) AS revenue,
          COUNT(*)::int AS order_count
        FROM orders
        WHERE status='COMPLETED' AND is_deleted=false AND completed_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', completed_at)
        ORDER BY DATE_TRUNC('month', completed_at) ASC
      `,
      // Top 10 customers by revenue
      sql`
        SELECT c.id, c.name, c.phone, c.property_type,
          COUNT(o.id)::int AS order_count,
          COALESCE(SUM(o.total_amount),0) AS total_revenue,
          MAX(o.created_at) AS last_order_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id=c.id AND o.is_deleted=false
        WHERE c.is_deleted=false
        GROUP BY c.id, c.name, c.phone, c.property_type
        ORDER BY total_revenue DESC, order_count DESC
        LIMIT 10
      `,
      // Service type breakdown
      sql`
        SELECT service_type, COUNT(*)::int AS count, COALESCE(SUM(total_amount),0) AS revenue
        FROM orders WHERE is_deleted=false
        GROUP BY service_type ORDER BY count DESC
      `,
      // Status breakdown
      sql`
        SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total_amount),0) AS total_value
        FROM orders WHERE is_deleted=false
        GROUP BY status ORDER BY count DESC
      `,
    ]);

    const s = summary[0];
    return NextResponse.json({
      summary: {
        total_orders: s.total_orders,
        completed_orders: s.completed_orders,
        pending_orders: s.pending_orders,
        total_revenue: Number(s.total_revenue),
        outstanding: Number(s.outstanding),
        monthly_revenue: Number(s.monthly_revenue),
      },
      monthly_revenue: monthly.map((r: any) => ({
        month: r.month,
        revenue: Number(r.revenue),
        order_count: r.order_count,
      })),
      top_customers: topCustomers.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        property_type: c.property_type,
        order_count: c.order_count,
        total_revenue: Number(c.total_revenue),
        last_order_at: c.last_order_at,
      })),
      service_breakdown: serviceBreakdown.map((s: any) => ({
        service_type: s.service_type,
        count: s.count,
        revenue: Number(s.revenue),
      })),
      status_breakdown: statusBreakdown.map((s: any) => ({
        status: s.status,
        count: s.count,
        total_value: Number(s.total_value),
      })),
    });
  } catch (err) {
    console.error("[Reports]", err);
    return NextResponse.json({ detail: "Failed to load reports" }, { status: 500 });
  }
}
