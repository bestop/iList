import { sql, ensureSchema } from './_db.js';
import { getUserFromRequest } from './_auth.js';

export default async function handler(req, res) {
  await ensureSchema();

  if (req.method === 'POST') {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: '请先登录' });
    }
    try {
      const importedItems = req.body;

      if (!Array.isArray(importedItems)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      let importedCount = 0;

      for (const item of importedItems) {
        const { name, category, status, price, qty, date, shop, note, images } = item;

        const id = item.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const createdAt = item.createdAt || Date.now();

        await sql`
          INSERT INTO items (id, name, category, status, price, qty, date, shop, note, images, user_id, created_at)
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
            ${user.userId},
            ${createdAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            status = EXCLUDED.status,
            price = EXCLUDED.price,
            qty = EXCLUDED.qty,
            date = EXCLUDED.date,
            shop = EXCLUDED.shop,
            note = EXCLUDED.note,
            images = EXCLUDED.images
        `;
        importedCount++;
      }

      res.status(200).json({
        message: 'Data imported successfully',
        count: importedCount
      });
    } catch (error) {
      console.error('Error importing data:', error);
      res.status(500).json({ error: 'Failed to import data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
