import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const sql = neon(process.env.DATABASE_URL);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

async function initDB() {
  try {
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
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
      )
    `;
    console.log('✅ Database table ready');
  } catch (e) {
    console.error('❌ DB init error:', e.message);
  }
}

function serveStatic(res, filePath) {
  if (!existsSync(filePath)) return false;
  const data = readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
  res.end(data);
  return true;
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleAPI(req, res, pathname) {
  if (pathname === '/api/items' && req.method === 'GET') {
    try {
      const result = await sql`SELECT * FROM items ORDER BY created_at DESC`;
      json(res, result);
    } catch (e) {
      json(res, { error: e.message }, 500);
    }
    return true;
  }

  if (pathname === '/api/items' && req.method === 'POST') {
    try {
      const { name, category, status, price, qty, date, shop, note, images } = await parseBody(req);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const createdAt = Date.now();
      const result = await sql`
        INSERT INTO items (id, name, category, status, price, qty, date, shop, note, images, created_at)
        VALUES (${id}, ${name}, ${category || '其他'}, ${status || '待发货'}, ${price || 0}, ${qty || 1}, ${date || null}, ${shop || ''}, ${note || ''}, ${JSON.stringify(images || [])}, ${createdAt})
        RETURNING *
      `;
      json(res, result[0], 201);
    } catch (e) {
      json(res, { error: e.message }, 500);
    }
    return true;
  }

  const itemMatch = pathname.match(/^\/api\/items\/(.+)$/);
  if (itemMatch) {
    const id = itemMatch[1];
    if (req.method === 'PUT') {
      try {
        const { name, category, status, price, qty, date, shop, note, images } = await parseBody(req);
        const result = await sql`
          UPDATE items SET
            name = COALESCE(${name}, name),
            category = COALESCE(${category}, category),
            status = COALESCE(${status}, status),
            price = COALESCE(${price}, price),
            qty = COALESCE(${qty}, qty),
            date = COALESCE(${date}, date),
            shop = COALESCE(${shop}, shop),
            note = COALESCE(${note}, note),
            images = COALESCE(${JSON.stringify(images)}, images)
          WHERE id = ${id} RETURNING *
        `;
        if (result.length === 0) return json(res, { error: 'Not found' }, 404);
        json(res, result[0]);
      } catch (e) {
        json(res, { error: e.message }, 500);
      }
      return true;
    }
    if (req.method === 'DELETE') {
      try {
        const result = await sql`DELETE FROM items WHERE id = ${id} RETURNING *`;
        if (result.length === 0) return json(res, { error: 'Not found' }, 404);
        json(res, { message: 'Deleted' });
      } catch (e) {
        json(res, { error: e.message }, 500);
      }
      return true;
    }
  }

  if (pathname === '/api/import' && req.method === 'POST') {
    try {
      const items = await parseBody(req);
      if (!Array.isArray(items)) return json(res, { error: 'Invalid format' }, 400);
      let count = 0;
      for (const item of items) {
        const id = item.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const createdAt = item.createdAt || Date.now();
        await sql`
          INSERT INTO items (id, name, category, status, price, qty, date, shop, note, images, created_at)
          VALUES (${id}, ${item.name}, ${item.category || '其他'}, ${item.status || '待发货'}, ${item.price || 0}, ${item.qty || 1}, ${item.date || null}, ${item.shop || ''}, ${item.note || ''}, ${JSON.stringify(item.images || [])}, ${createdAt})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, category = EXCLUDED.category, status = EXCLUDED.status,
            price = EXCLUDED.price, qty = EXCLUDED.qty, date = EXCLUDED.date,
            shop = EXCLUDED.shop, note = EXCLUDED.note, images = EXCLUDED.images
        `;
        count++;
      }
      json(res, { message: 'Imported', count });
    } catch (e) {
      json(res, { error: e.message }, 500);
    }
    return true;
  }

  return false;
}

const server = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    const handled = await handleAPI(req, res, pathname);
    if (handled) return;
  }

  let filePath = join(__dirname, pathname === '/' ? 'index.html' : pathname);
  if (!existsSync(filePath) && !extname(filePath)) {
    filePath += '.html';
  }
  if (!serveStatic(res, filePath)) {
    res.writeHead(404);
    res.end('Not Found');
  }
};

const PORT = 3000;
initDB().then(() => {
  import('http').then(({ createServer }) => {
    createServer(server).listen(PORT, () => {
      console.log(`\n🚀 Local server running at http://localhost:${PORT}\n`);
    });
  });
});
