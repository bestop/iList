import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT '其他',
      status VARCHAR(50) DEFAULT '待发货',
      price DECIMAL(10, 2) DEFAULT 0,
      qty INTEGER DEFAULT 1,
      date DATE,
      shop VARCHAR(255),
      note TEXT,
      images JSONB DEFAULT '[]',
      user_id VARCHAR(255),
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    )
  `;
  try {
    await sql`ALTER TABLE items ADD COLUMN user_id VARCHAR(255)`;
  } catch (e) { }
}

export { sql };
