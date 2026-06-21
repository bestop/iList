import { sql, ensureSchema } from '../_db.js';
import { getUserFromRequest } from '../_auth.js';

export default async function handler(req, res) {
  await ensureSchema();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: '请先登录' });
    }
    try {
      const body = req.body;

      const keys = [];
      const values = [];

      if (body.name != null && body.name !== '') { keys.push('name'); values.push(body.name); }
      if (body.category != null && body.category !== '') { keys.push('category'); values.push(body.category); }
      if (body.status != null && body.status !== '') { keys.push('status'); values.push(body.status); }
      if (body.price != null) { keys.push('price'); values.push(body.price); }
      if (body.qty != null) { keys.push('qty'); values.push(body.qty); }
      if (body.date != null) { keys.push('date'); values.push(body.date); }
      if (body.shop != null) { keys.push('shop'); values.push(body.shop); }
      if (body.note != null) { keys.push('note'); values.push(body.note); }
      if (body.images != null) { keys.push('images'); values.push(JSON.stringify(body.images)); }

      if (keys.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`);
      const query = `UPDATE items SET ${setClauses.join(', ')} WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2} RETURNING *`;
      const params = [...values, id, user.userId];

      const result = await sql(query, params);

      if (result.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ error: 'Failed to update item' });
    }
  } else if (req.method === 'DELETE') {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: '请先登录' });
    }
    try {
      const result = await sql`
        DELETE FROM items WHERE id = ${id} AND user_id = ${user.userId} RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
