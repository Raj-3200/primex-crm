import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getDb } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const sql = getDb();

    const invoices = await sql`
      SELECT
        o.id, o.order_number, o.service_type, o.status,
        o.subtotal, o.discount, o.tax_rate, o.tax_amount, o.total_amount,
        o.created_at, o.completed_at,
        c.name AS customer_name, c.customer_id AS customer_code,
        c.email AS customer_email, c.phone AS customer_phone
      FROM orders o
      JOIN customers c ON c.id = o.customer_id AND c.is_deleted = false
      WHERE o.is_deleted = false AND o.total_amount > 0
      ORDER BY o.created_at DESC
    `;

    const totalAmount = invoices.reduce(
      (sum: number, i: any) => sum + Number(i.total_amount || 0),
      0
    );
    const paidAmount = invoices
      .filter((i: any) => i.status === "COMPLETED")
      .reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0);

    return NextResponse.json({
      invoices,
      stats: {
        total_count: invoices.length,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        pending_amount: totalAmount - paidAmount,
      },
    });
  } catch (err) {
    console.error("[Invoices API]", err);
    return NextResponse.json(
      { detail: "Failed to load invoices" },
      { status: 500 }
    );
  }
}
