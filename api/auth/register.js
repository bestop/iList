import { registerUser } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    if (username.length < 2 || username.length > 50) {
      return res.status(400).json({ error: '用户名长度需在2-50之间' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: '密码至少4位' });
    }
    const result = await registerUser(username, password);
    if (result.error) {
      return res.status(409).json({ error: result.error });
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
}
