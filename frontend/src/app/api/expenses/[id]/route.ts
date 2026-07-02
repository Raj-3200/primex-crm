import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAuthPayload, getDb } from "@/lib/server-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuthPayload(req);
  if ("error" in authResult) return authResult.error;
  const { id } = await params;

  try {
    const body = await req.json();
    const { category, description, amount, expense_date, reference } = body;
    const sql = getDb();

    const validCategories = ["VEHICLE", "EQUIPMENT", "SUPPLIES", "STAFF", "UTILITIES", "OTHER"];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ detail: "Invalid category" }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM expenses WHERE id = ${id}::uuid AND is_deleted = false`;
    if (!existing.length) return NextResponse.json({ detail: "Expense not found" }, { status: 404 });

    const updated = await sql`
      UPDATE expenses SET
        category    = CASE WHEN ${category != null} THEN ${category}::expensecategory ELSE category END,
        description = CASE WHEN ${description != null} THEN ${description} ELSE description END,
        amount      = CASE WHEN ${amount != null} THEN ${Number(amount)} ELSE amount END,
        expense_date = CASE WHEN ${expense_date != null} THEN ${expense_date}::date ELSE expense_date END,
        reference   = CASE WHEN ${reference !== undefined} THEN ${reference || null} ELSE reference END,
        updated_at  = now()
      WHERE id = ${id}::uuid AND is_deleted = false
      RETURNING id, category, description, amount, expense_date, reference, created_at
    `;
    return NextResponse.json({ ...updated[0], amount: Number(updated[0].amount) });
  } catch (err) {
    console.error("[Expenses PATCH]", err);
    return NextResponse.json({ detail: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const { id } = await params;

  try {
    const sql = getDb();
    const result = await sql`
      UPDATE expenses SET is_deleted = true, updated_at = now()
      WHERE id = ${id}::uuid AND is_deleted = false
      RETURNING id
    `;
    if (!result.length) return NextResponse.json({ detail: "Expense not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Expenses DELETE]", err);
    return NextResponse.json({ detail: "Failed to delete expense" }, { status: 500 });
  }
}
