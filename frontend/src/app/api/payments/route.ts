import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getDb } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const [payments, thisMonthPayments] = await Promise.all([
      sql`
        SELECT
          o.id, o.order_number, o.service_type, o.status,
          o.subtotal, o.discount, o.tax_amount, o.total_amount,
          o.completed_at, o.created_at,
          c.name AS customer_name, c.customer_id AS customer_code,
          c.phone AS customer_phone
        FROM orders o
        JOIN customers c ON c.id = o.customer_id AND c.is_deleted = false
        WHERE o.status = 'COMPLETED' AND o.is_deleted = false
        ORDER BY o.completed_at DESC NULLS LAST
      `,
      sql`
        SELECT COALESCE(SUM(total_amount), 0) AS amount, COUNT(*) AS count
        FROM orders
        WHERE status = 'COMPLETED'
          AND is_deleted = false
          AND completed_at >= ${thisMonthStart}::date
      `,
    ]);

    const totalCollected = payments.reduce(
      (sum: number, p: any) => sum + Number(p.total_amount || 0),
      0
    );

    return NextResponse.json({
      payments,
      stats: {
        totalCollected,
        thisMonth: Number(thisMonthPayments[0]?.amount || 0),
        totalTransactions: payments.length,
        thisMonthTransactions: Number(thisMonthPayments[0]?.count || 0),
      },
    });
  } catch (err) {
    console.error("[Payments API]", err);
    return NextResponse.json(
      { detail: "Failed to load payments" },
      { status: 500 }
    );
  }
}
