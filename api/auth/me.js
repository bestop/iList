import { getUserFromRequest } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(200).json({ user: null });
    }
    res.status(200).json({ user: { userId: user.userId, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
}
