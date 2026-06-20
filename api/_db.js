import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function query(text, params) {
  try {
    const result = await sql(text, params);
    return { data: result, error: null };
  } catch (error) {
    console.error('Database query error:', error);
    return { data: null, error: error.message };
  }
}

export async function initializeDatabase() {
  const createTableSQL = `
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
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );
  `;

  await sql(createTableSQL);
  console.log('Database initialized successfully');
}

export default sql;