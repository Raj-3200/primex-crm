import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const DB = "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SECRET = process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";

function auth(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) throw new Error("No token");
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as { sub: string; role: string };
}

// Expenses derived from order discounts + external tracking via notes
// In production this would be an expenses table; for now we track expenses as order metadata
export async function GET(req: NextRequest) {
  try { auth(req); } catch { return NextResponse.json({ detail: "Unauthorized" }, { status: 401 }); }

  try {
    const sql = neon(DB);

    // Get revenue and discount data to compute expenses (cost ≈ 35% of revenue, discounts are real expenses)
    const [summary, monthly, byService] = await Promise.all([
      sql`
        SELECT
          COALESCE(SUM(total_amount), 0) AS total_revenue,
          COALESCE(SUM(discount), 0) AS total_discounts,
          COALESCE(SUM(tax_amount), 0) AS total_tax,
          COUNT(*)::int AS total_orders,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int AS completed_orders
        FROM orders WHERE is_deleted = false
      `,
      sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') AS month,
          DATE_TRUNC('month', created_at) AS month_date,
          COALESCE(SUM(total_amount), 0) AS revenue,
          COALESCE(SUM(discount), 0) AS discounts,
          COALESCE(SUM(total_amount) * 0.35, 0) AS estimated_cost
        FROM orders WHERE is_deleted = false AND status = 'COMPLETED'
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `,
      sql`
        SELECT service_type,
          COUNT(*)::int AS jobs,
          COALESCE(SUM(total_amount), 0) AS revenue,
          COALESCE(SUM(discount), 0) AS discounts
        FROM orders WHERE is_deleted = false
        GROUP BY service_type
      `,
    ]);

    const s = summary[0];
    const totalRevenue = Number(s.total_revenue);
    const estCost = totalRevenue * 0.35;
    const profit = totalRevenue - estCost - Number(s.total_discounts);

    return NextResponse.json({
      summary: {
        total_revenue: totalRevenue,
        estimated_cost: Math.round(estCost),
        total_discounts: Number(s.total_discounts),
        gross_profit: Math.round(profit),
        margin_pct: totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0,
        total_orders: s.total_orders,
        completed_orders: s.completed_orders,
      },
      monthly: monthly.map((m: any) => ({
        month: m.month,
        revenue: Number(m.revenue),
        discounts: Number(m.discounts),
        estimated_cost: Number(m.estimated_cost),
        profit: Number(m.revenue) - Number(m.estimated_cost) - Number(m.discounts),
      })),
      by_service: byService.map((b: any) => ({
        service_type: b.service_type,
        jobs: b.jobs,
        revenue: Number(b.revenue),
        discounts: Number(b.discounts),
      })),
    });
  } catch (err) { console.error(err); return NextResponse.json({ detail: "Failed" }, { status: 500 }); }
}
