import { sql } from '../_db.js';
import { getUserFromRequest, ensureUsersTable } from '../_auth.js';

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }

  await ensureUsersTable();

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT u.id, u.username, u.role, u.created_at,
          (SELECT COUNT(*) FROM items WHERE user_id = u.id) as item_count
        FROM users u ORDER BY u.created_at ASC
      `;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, role } = req.body;
      if (!id || !role || !['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: '参数无效' });
      }
      if (id === user.userId) {
        return res.status(400).json({ error: '不能修改自己的角色' });
      }
      const result = await sql`
        UPDATE users SET role = ${role} WHERE id = ${id} RETURNING id, username, role
      `;
      if (result.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: '缺少用户ID' });
      }
      if (id === user.userId) {
        return res.status(400).json({ error: '不能删除自己' });
      }
      await sql`DELETE FROM items WHERE user_id = ${id}`;
      const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING id, username`;
      if (result.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.status(200).json({ message: '用户已删除' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
