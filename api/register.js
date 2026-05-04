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
    const { name, email, password, plan } = req.body;

    if (!name || !email || !password || !plan) {
      return res.status(400).json({ message: 'Dados obrigatórios: name, email, password, plan' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    let plan_expires_at = null;
    if (plan === 'basico') {
      plan_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (plan === 'pro') {
      plan_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,name,plan,plan_expires_at`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const existing = await checkRes.json();

    if (existing.length > 0) {
      const upRes = await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ plan, plan_expires_at }),
        }
      );
      const updated = await upRes.json();
      const u = updated[0];
      return res.status(200).json({ name: u.name, email, plan: u.plan, plan_expires_at: u.plan_expires_at });
    }

    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ name, email, password_hash, plan, plan_expires_at }),
    });
    const users = await insRes.json();
    const u = users[0];

    return res.status(200).json({ name: u.name, email, plan: u.plan, plan_expires_at: u.plan_expires_at });
  } catch (err) {
    console.error('[register] Erro:', err);
    return res.status(500).json({ message: err.message || 'Erro interno' });
  }
};
