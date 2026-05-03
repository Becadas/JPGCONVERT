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
    const { formData, plan, email, name, cpf } = req.body;

    if (!formData?.token || !formData?.transaction_amount) {
      return res.status(400).json({ message: 'Token do cartão e valor são obrigatórios' });
    }

    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        transaction_amount: Number(formData.transaction_amount),
        token:              formData.token,
        installments:       formData.installments || 1,
        payment_method_id:  formData.payment_method_id,
        issuer_id:          formData.issuer_id,
        description:        `JPG.convert — Plano ${plan}`,
        payer: {
          email,
          first_name:     name?.split(' ')[0] || '',
          last_name:      name?.split(' ').slice(1).join(' ') || '',
          identification: { type: 'CPF', number: cpf },
        },
      },
    });

    return res.status(200).json({
      id:            result.id,
      status:        result.status,
      status_detail: result.status_detail,
    });
  } catch (err) {
    console.error('[process-payment] Erro:', err);
    return res.status(500).json({ message: err.message || 'Erro interno' });
  }
};
