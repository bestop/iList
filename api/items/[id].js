import { sql } from '../_db.js';
import { getUserFromRequest } from '../_auth.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: '请先登录' });
    }
    try {
      const body = req.body;

      const sets = [];
      if (body.name != null && body.name !== '') sets.push(sql`name = ${body.name}`);
      if (body.category != null && body.category !== '') sets.push(sql`category = ${body.category}`);
      if (body.status != null && body.status !== '') sets.push(sql`status = ${body.status}`);
      if (body.price != null) sets.push(sql`price = ${body.price}`);
      if (body.qty != null) sets.push(sql`qty = ${body.qty}`);
      if (body.date != null) sets.push(sql`date = ${body.date}`);
      if (body.shop != null) sets.push(sql`shop = ${body.shop}`);
      if (body.note != null) sets.push(sql`note = ${body.note}`);
      if (body.images != null) sets.push(sql`images = ${JSON.stringify(body.images)}`);

      if (sets.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const result = await sql`
        UPDATE items SET ${sql.join(sets, sql`, `)}
        WHERE id = ${id}
        RETURNING *
      `;

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
        DELETE FROM items WHERE id = ${id} RETURNING *
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
