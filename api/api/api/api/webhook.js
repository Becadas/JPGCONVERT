const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const body = req.body || {};

    if (body.type !== 'payment' || !body.data?.id) {
      return res.status(200).json({ received: true });
    }

    const payment = new Payment(client);
    const result = await payment.get({ id: body.data.id });

    console.log(`[webhook] Payment ${body.data.id} — status: ${result.status}`);

    if (result.status === 'approved') {
      console.log(`[webhook] Aprovado! Valor: R$${result.transaction_amount}, Payer: ${result.payer?.email}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] Erro:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
};
