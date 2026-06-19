import { sql, initializeDatabase } from './db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT * FROM items ORDER BY created_at DESC
      `;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, category, status, price, qty, date, shop, note, images } = req.body;

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const createdAt = Date.now();

      const result = await sql`
        INSERT INTO items (id, name, category, status, price, qty, date, shop, note, images, created_at)
        VALUES (
          ${id},
          ${name},
          ${category || '其他'},
          ${status || '待发货'},
          ${price || 0},
          ${qty || 1},
          ${date || null},
          ${shop || ''},
          ${note || ''},
          ${JSON.stringify(images || [])},
          ${createdAt}
        )
        RETURNING *
      `;

      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error adding item:', error);
      res.status(500).json({ error: 'Failed to add item' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}