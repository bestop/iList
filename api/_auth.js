import { sql } from './_db.js';
import { createHmac, randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'ilist-default-secret-change-me';

function hashPassword(password) {
  return createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    const expected = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function ensureUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    )
  `;
}

export async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  return payload;
}

export async function registerUser(username, password) {
  await ensureUsersTable();
  const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
  if (existing.length > 0) {
    return { error: '用户名已存在' };
  }
  const userCount = await sql`SELECT COUNT(*) as count FROM users`;
  const role = parseInt(userCount[0].count) === 0 ? 'admin' : 'user';
  const id = Date.now().toString(36) + randomBytes(4).toString('hex');
  const passwordHash = hashPassword(password);
  await sql`
    INSERT INTO users (id, username, password_hash, role)
    VALUES (${id}, ${username}, ${passwordHash}, ${role})
  `;
  const token = createToken({ userId: id, username, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  return { token, user: { id, username, role } };
}

export async function loginUser(username, password) {
  await ensureUsersTable();
  const passwordHash = hashPassword(password);
  const result = await sql`
    SELECT id, username, role FROM users WHERE username = ${username} AND password_hash = ${passwordHash}
  `;
  if (result.length === 0) {
    return { error: '用户名或密码错误' };
  }
  const user = result[0];
  const token = createToken({ userId: user.id, username: user.username, role: user.role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  return { token, user: { id: user.id, username: user.username, role: user.role } };
}

export { ensureUsersTable };
