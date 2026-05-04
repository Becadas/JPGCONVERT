const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://tujkgmzywebszkmpaeor.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const users = await userRes.json();

    if (!users.length) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const user = users[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    let activePlan = user.plan;
    if (user.plan !== 'free' && user.plan !== 'ilimitado' && user.plan_expires_at) {
      if (new Date(user.plan_expires_at) < new Date()) {
        activePlan = 'free';
        await fetch(
          `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ plan: 'free', plan_expires_at: null }),
          }
        );
      }
    }

    return res.status(200).json({
      name:            user.name,
      email:           user.email,
      plan:            activePlan,
      plan_expires_at: activePlan === 'free' ? null : user.plan_expires_at,
    });
  } catch (err) {
    console.error('[login] Erro:', err);
    return res.status(500).json({ message: err.message || 'Erro interno' });
  }
};
