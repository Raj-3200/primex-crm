const { neon } = require('@neondatabase/serverless');

const DB = 'postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function migrate() {
  const sql = neon(DB);

  const steps = [
    {
      name: 'solar_cleaning_details',
      query: `CREATE TABLE IF NOT EXISTS solar_cleaning_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        panel_count INT DEFAULT 0,
        capacity_kw NUMERIC(8,2) DEFAULT 0,
        roof_type TEXT DEFAULT 'FLAT',
        panel_type TEXT DEFAULT 'MONOCRYSTALLINE',
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    },
    {
      name: 'tank_cleaning_details',
      query: `CREATE TABLE IF NOT EXISTS tank_cleaning_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        tank_type TEXT DEFAULT 'OVERHEAD',
        capacity_liters INT DEFAULT 0,
        number_of_tanks INT DEFAULT 1,
        chemical_used TEXT,
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    },
    {
      name: 'activity_logs',
      query: `CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        entity_type TEXT,
        entity_id TEXT,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    },
    {
      name: 'notifications',
      query: `CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'INFO',
        is_read BOOLEAN DEFAULT FALSE,
        entity_type TEXT,
        entity_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    },
    { name: 'idx_orders_customer_id', query: 'CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)' },
    { name: 'idx_orders_status', query: 'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)' },
    { name: 'idx_orders_scheduled_date', query: 'CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date ON orders(scheduled_date)' },
    { name: 'idx_orders_service_type', query: 'CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(service_type)' },
    { name: 'idx_customers_phone', query: 'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)' },
    { name: 'idx_customers_customer_id', query: 'CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id)' },
    { name: 'idx_expenses_date', query: 'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)' },
    { name: 'idx_activity_logs_order_id', query: 'CREATE INDEX IF NOT EXISTS idx_activity_logs_order_id ON activity_logs(order_id)' },
    { name: 'idx_notifications_user_id', query: 'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)' },
  ];

  for (const step of steps) {
    try {
      await sql.unsafe(step.query);
      console.log(`OK ${step.name}`);
    } catch (e) {
      console.error(`FAIL ${step.name}: ${e.message}`);
    }
  }
  console.log('MIGRATION DONE');
}

migrate().catch(console.error);
