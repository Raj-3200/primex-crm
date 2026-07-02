import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAuthPayload, getDb } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";

    let expenses: any[];
    if (category && date_from && date_to) {
      expenses = await sql`
        SELECT id, category, description, amount, expense_date, reference, created_at
        FROM expenses WHERE is_deleted = false
        AND category = ${category}
        AND expense_date BETWEEN ${date_from}::date AND ${date_to}::date
        ORDER BY expense_date DESC, created_at DESC
      `;
    } else if (category) {
      expenses = await sql`
        SELECT id, category, description, amount, expense_date, reference, created_at
        FROM expenses WHERE is_deleted = false AND category = ${category}
        ORDER BY expense_date DESC, created_at DESC
      `;
    } else if (date_from && date_to) {
      expenses = await sql`
        SELECT id, category, description, amount, expense_date, reference, created_at
        FROM expenses WHERE is_deleted = false
        AND expense_date BETWEEN ${date_from}::date AND ${date_to}::date
        ORDER BY expense_date DESC, created_at DESC
      `;
    } else {
      expenses = await sql`
        SELECT id, category, description, amount, expense_date, reference, created_at
        FROM expenses WHERE is_deleted = false
        ORDER BY expense_date DESC, created_at DESC
      `;
    }

    // Monthly summary
    const [monthlySummary] = await sql`
      SELECT
        COALESCE(SUM(amount), 0)::float AS total,
        COALESCE(SUM(amount) FILTER (
          WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)
        ), 0)::float AS this_month
      FROM expenses WHERE is_deleted = false
    `;

    return NextResponse.json({
      expenses: expenses.map((e: any) => ({ ...e, amount: Number(e.amount) })),
      summary: {
        total: Number(monthlySummary?.total ?? 0),
        this_month: Number(monthlySummary?.this_month ?? 0),
      },
    });
  } catch (err) {
    console.error("[Expenses GET]", err);
    return NextResponse.json({ detail: "Failed to load expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = requireAuthPayload(req);
  if ("error" in authResult) return authResult.error;
  const userId = authResult.payload.sub;
  try {
    const body = await req.json();
    const { category, description, amount, expense_date, reference } = body;

    const validCategories = ["VEHICLE", "EQUIPMENT", "SUPPLIES", "STAFF", "UTILITIES", "OTHER"];
    if (!description?.trim()) return NextResponse.json({ detail: "Description is required" }, { status: 400 });
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return NextResponse.json({ detail: "Valid amount is required" }, { status: 400 });
    if (!expense_date) return NextResponse.json({ detail: "Date is required" }, { status: 400 });
    if (!validCategories.includes(category)) return NextResponse.json({ detail: "Invalid category" }, { status: 400 });

    const sql = getDb();
    const rows = await sql`
      INSERT INTO expenses(id, category, description, amount, expense_date, reference, recorded_by, is_deleted, created_at, updated_at)
      VALUES(gen_random_uuid(), ${category}::expensecategory, ${description.trim()}, ${Number(amount)}, ${expense_date}::date, ${reference || null}, ${userId}::uuid, false, now(), now())
      RETURNING id, category, description, amount, expense_date, reference, created_at
    `;
    return NextResponse.json({ ...rows[0], amount: Number(rows[0].amount) }, { status: 201 });
  } catch (err) {
    console.error("[Expenses POST]", err);
    return NextResponse.json({ detail: "Failed to record expense" }, { status: 500 });
  }
}
