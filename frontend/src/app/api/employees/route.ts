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

    const employees = await sql`
      SELECT id, email, full_name, phone, role, is_active, created_at
      FROM users
      WHERE is_deleted = false
      ORDER BY created_at DESC
    `;

    const stats = {
      total: employees.length,
      admins: employees.filter((e: any) => e.role === 'ADMIN').length,
      managers: employees.filter((e: any) => e.role === 'MANAGER').length,
      technicians: employees.filter((e: any) => e.role === 'TECHNICIAN').length,
    };

    return NextResponse.json({ employees, stats });
  } catch (err: any) {
    if (err.message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Employees API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
