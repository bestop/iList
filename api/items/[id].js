import { sql, initializeDatabase } from '../_db.js';

export default async function handler(req, res) {
  try {
    await initializeDatabase();
  } catch (e) {
    console.error('Failed to initialize database:', e);
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { name, category, status, price, qty, date, shop, note, images } = req.body;

      const result = await sql`
        UPDATE items
        SET
          name = COALESCE(${name}, name),
          category = COALESCE(${category}, category),
          status = COALESCE(${status}, status),
          price = COALESCE(${price}, price),
          qty = COALESCE(${qty}, qty),
          date = COALESCE(${date}, date),
          shop = COALESCE(${shop}, shop),
          note = COALESCE(${note}, note),
          images = COALESCE(${JSON.stringify(images)}, images)
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