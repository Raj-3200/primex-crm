import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'primex-crm-secret-key-2024-neon-production';
const DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

function verifyAuth(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) throw new Error('No token');
  jwt.verify(token, SECRET, { algorithms: ['HS256'] });
}

export async function GET(req: NextRequest) {
  try {
    verifyAuth(req);

    const sql = neon(DB_URL);

    const orders = await sql`
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.scheduled_date,
        o.scheduled_time,
        o.completed_at,
        o.subtotal,
        o.discount,
        o.tax_amount,
        o.total_amount,
        o.notes,
        o.assigned_to,
        o.created_at,
        o.updated_at,
        c.id        AS customer_id,
        c.name      AS customer_name,
        c.email     AS customer_email,
        c.phone     AS customer_phone,
        c.address   AS customer_address
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id AND c.is_deleted = false
      WHERE o.service_type = 'TANK'
        AND o.is_deleted = false
      ORDER BY o.created_at DESC
    `;

    const stats = await sql`
      SELECT
        COUNT(*)                                              AS total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')         AS completed,
        COUNT(*) FILTER (WHERE status = 'PENDING')           AS pending,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'COMPLETED'), 0) AS revenue
      FROM orders
      WHERE service_type = 'TANK'
        AND is_deleted = false
    `;

    return NextResponse.json({
      orders,
      stats: {
        total:     Number(stats[0].total),
        completed: Number(stats[0].completed),
        pending:   Number(stats[0].pending),
        revenue:   Number(stats[0].revenue),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isAuthError = message === 'No token' || message.includes('jwt') || message.includes('invalid') || message.includes('expired');
    return NextResponse.json({ error: message }, { status: isAuthError ? 401 : 500 });
  }
}
