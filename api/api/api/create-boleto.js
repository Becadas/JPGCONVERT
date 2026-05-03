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

    if (!customer?.email || !customer?.cpf || !customer?.name || !amount) {
      return res.status(400).json({ message: 'Dados obrigatórios: email, cpf, name, amount' });
    }

    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description:        `JPG.convert — Plano ${plan}`,
        payment_method_id:  'bolbradesco',
        payer: {
          email:          customer.email,
          first_name:     customer.name.split(' ')[0] || '',
          last_name:      customer.name.split(' ').slice(1).join(' ') || '',
          identification: { type: 'CPF', number: customer.cpf },
          address: {
            zip_code:      customer.cep          || '01310-100',
            street_name:   customer.street       || 'Av. Paulista',
            street_number: customer.number       || '1',
            neighborhood:  customer.neighborhood || 'Bela Vista',
            city:          customer.city         || 'São Paulo',
            federal_unit:  customer.state        || 'SP',
          },
        },
      },
    });

    return res.status(200).json({
      id:                    result.id,
      status:                result.status,
      barcode:               result.barcode?.content,
      external_resource_url: result.transaction_details?.external_resource_url,
      date_of_expiration:    result.date_of_expiration,
    });
  } catch (err) {
    console.error('[create-boleto] Erro:', err);
    return res.status(500).json({ message: err.message || 'Erro interno' });
  }
};
