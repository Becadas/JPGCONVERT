const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { plan, amount, customer } = req.body;

    if (!customer?.email || !customer?.cpf || !amount) {
      return res.status(400).json({ message: 'Dados obrigatórios: email, cpf, amount' });
    }

    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description:        `JPG.convert — Plano ${plan}`,
        payment_method_id:  'pix',
        payer: {
          email:          customer.email,
          first_name:     customer.name?.split(' ')[0] || '',
          last_name:      customer.name?.split(' ').slice(1).join(' ') || '',
          identification: { type: 'CPF', number: customer.cpf },
        },
      },
    });

    return res.status(200).json({
      id:              result.id,
      status:          result.status,
      qr_code:         result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64:  result.point_of_interaction?.transaction_data?.qr_code_base64,
      expiration_date: result.date_of_expiration,
    });
  } catch (err) {
    console.error('[create-pix] Erro:', err);
    return res.status(500).json({ message: err.message || 'Erro interno' });
  }
};
