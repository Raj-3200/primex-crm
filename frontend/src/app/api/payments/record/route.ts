import { NextRequest, NextResponse } from "next/server";
import { requireAuthPayload, getDb, DB_URL } from "@/lib/server-auth";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  const authResult = requireAuthPayload(req);
  if ("error" in authResult) return authResult.error;
  const userId = authResult.payload.sub;

  try {
    const body = await req.json();
    const { order_number, amount, method, reference_number, notes, paid_date } = body;

    if (!order_number?.trim()) {
      return NextResponse.json({ detail: "Order number is required" }, { status: 400 });
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ detail: "Valid amount is required" }, { status: 400 });
    }
    if (!["CASH", "UPI", "BANK", "CHEQUE"].includes(method)) {
      return NextResponse.json({ detail: "Invalid payment method" }, { status: 400 });
    }

    const sql = neon(DB_URL);

    // Find the order by order_number
    const orders = await sql`
      SELECT id, total_amount, status FROM orders
      WHERE order_number = ${order_number.trim()} AND is_deleted = false
    `;

    if (!orders.length) {
      return NextResponse.json({ detail: `Order ${order_number} not found` }, { status: 404 });
    }

    const order = orders[0];

    // Mark the order as completed and record payment metadata
    await sql`
      UPDATE orders SET
        status = 'COMPLETED',
        completed_at = ${paid_date || new Date().toISOString()},
        updated_at = now()
      WHERE id = ${order.id}::uuid
    `;

    // Log activity
    await sql`
      INSERT INTO activity_logs(id, entity_type, entity_id, action, details, user_id, created_at, updated_at)
      VALUES(
        gen_random_uuid(), 'order', ${String(order.id)},
        'PAYMENT_RECORDED',
        ${JSON.stringify({ method, amount: Number(amount), reference: reference_number || null, notes: notes || null })}::json,
        ${userId}::uuid, now(), now()
      )
    `;

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: Number(amount),
      method,
      message: `Payment of ₹${Number(amount).toFixed(2)} recorded for order ${order_number}`,
    }, { status: 201 });
  } catch (err) {
    console.error("[Payments Record POST]", err);
    return NextResponse.json({ detail: "Failed to record payment" }, { status: 500 });
  }
}
