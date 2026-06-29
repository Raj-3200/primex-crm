import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'primex-crm-secret-key-2024-neon-production';

function verifyAuth(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) throw new Error('unauthorized');
  return jwt.verify(token, SECRET, { algorithms: ['HS256'] }) as any;
}

export async function GET(req: NextRequest) {
  try {
    verifyAuth(req);
    const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require');

    const invoices = await sql`
      SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE o.is_deleted = false
        AND o.total_amount > 0
      ORDER BY o.created_at DESC
    `;

    return NextResponse.json({ invoices });
  } catch (err: any) {
    if (err.message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Invoices API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
