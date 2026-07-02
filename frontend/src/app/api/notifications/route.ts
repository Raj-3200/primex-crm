import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAuthPayload, getDb } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const authResult = requireAuthPayload(req);
  if ("error" in authResult) return authResult.error;
  const userId = authResult.payload.sub;
  try {
    const sql = getDb();
    const notifications = await sql`
      SELECT id, title, message, type, is_read, entity_type, entity_id, created_at
      FROM notifications
      WHERE user_id = ${userId}::uuid OR user_id IS NULL
      ORDER BY created_at DESC LIMIT 50
    `;
    const unreadCount = notifications.filter((n: any) => !n.is_read).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[Notifications GET]", err);
    return NextResponse.json({ detail: "Failed to load notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = requireAuthPayload(req);
  if ("error" in authResult) return authResult.error;
  const userId = authResult.payload.sub;
  try {
    const sql = getDb();
    const body = await req.json();
    if (body.id) {
      // Only mark own notifications as read
      await sql`UPDATE notifications SET is_read = true WHERE id = ${body.id}::uuid AND (user_id = ${userId}::uuid OR user_id IS NULL)`;
    } else if (body.markAllRead) {
      await sql`UPDATE notifications SET is_read = true WHERE (user_id = ${userId}::uuid OR user_id IS NULL) AND is_read = false`;
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Notifications POST]", err);
    return NextResponse.json({ detail: "Failed to update notification" }, { status: 500 });
  }
}

