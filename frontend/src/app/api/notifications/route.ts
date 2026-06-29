import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const DB = "postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SECRET = process.env.JWT_SECRET || "primex-crm-secret-key-2024-neon-production";

function getAuth(req: NextRequest): string {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) throw new Error("unauthorized");
  jwt.verify(token, SECRET, { algorithms: ["HS256"] });
  return token;
}

// GET /api/notifications — list all notifications
export async function GET(req: NextRequest) {
  try {
    getAuth(req);
  } catch {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = neon(DB);
    const notifications = await sql`
      SELECT n.id, n.user_id, n.type, n.title, n.message, n.is_read,
             n.entity_type, n.entity_id, n.created_at, u.full_name
      FROM notifications n
      LEFT JOIN users u ON u.id = n.user_id
      ORDER BY n.created_at DESC
      LIMIT 50
    `;
    const unreadCount = notifications.filter((n: any) => !n.is_read).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[Notifications GET]", err);
    return NextResponse.json({ detail: "Failed to load notifications" }, { status: 500 });
  }
}

// POST /api/notifications — mark as read
export async function POST(req: NextRequest) {
  try {
    getAuth(req);
  } catch {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = neon(DB);
    const body = await req.json().catch(() => ({}));
    const { id, markAllRead } = body;

    if (markAllRead) {
      await sql`UPDATE notifications SET is_read = true, updated_at = NOW()`;
      return NextResponse.json({ success: true, message: "All marked as read" });
    }
    if (id) {
      await sql`UPDATE notifications SET is_read = true, updated_at = NOW() WHERE id = ${id}::uuid`;
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }
    return NextResponse.json({ detail: "Invalid request" }, { status: 400 });
  } catch (err) {
    console.error("[Notifications POST]", err);
    return NextResponse.json({ detail: "Failed" }, { status: 500 });
  }
}
