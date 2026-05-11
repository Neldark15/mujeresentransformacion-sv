/**
 * POST /api/n1co/checkout
 *
 * Crea un link de pago en n1co a partir de los datos del formulario.
 *
 * Variables de entorno requeridas (Vercel):
 *   - N1CO_CLIENT_ID
 *   - N1CO_CLIENT_SECRET
 *   - N1CO_BASE_URL          (ej: https://api-sandbox.n1co.shop)
 *   - N1CO_CHECKOUT_BASE_URL (ej: https://api-sandbox.n1co.shop o el host
 *                             dedicado de CheckoutLink que provea n1co)
 *   - SITE_URL               (ej: https://mujeresentransformacion.com)
 *
 * El precio se define server-side por seguridad (NO confiar en el cliente).
 */

const PRODUCT_PRICE = 25.00;   // ← actualizar al precio real
const SHIPPING_PRICE = 4.00;   // ← actualizar a la política de envío
const PRODUCT_NAME = 'Cuaderno de mis Sueños';
const PRODUCT_DESCRIPTION = 'Mujeres en Transformación — Cuaderno físico para organizar metas, dones, agradecimiento y visualización.';

// Token cache (en memoria caliente del runtime de Vercel)
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const res = await fetch(`${process.env.N1CO_BASE_URL}/api/v3/Token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.N1CO_CLIENT_ID,
      clientSecret: process.env.N1CO_CLIENT_SECRET
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`n1co token error ${res.status}: ${text}`);
  }

  const data = await res.json();
  cachedToken = data.accessToken;
  tokenExpiresAt = now + (data.expiresIn || 3600) * 1000;
  return cachedToken;
}

function generateOrderReference() {
  // Ejemplo: MET-1731270000123-XK7
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MET-${ts}-${rnd}`;
}

function bad(res, code, msg) {
  res.status(code).json({ error: msg });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return bad(res, 405, 'Método no permitido');
  }

  try {
    const body = req.body || {};
    const { customer = {}, shipping = {}, item = {} } = body;

    // Validación mínima
    const required = [
      [customer.fullName, 'fullName'],
      [customer.email, 'email'],
      [customer.phone, 'phone'],
      [shipping.department, 'department'],
      [shipping.city, 'city'],
      [shipping.address, 'address']
    ];
    for (const [val, name] of required) {
      if (!val || typeof val !== 'string' || !val.trim()) {
        return bad(res, 400, `Campo requerido: ${name}`);
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return bad(res, 400, 'Email inválido');
    }

    const quantity = Math.max(1, Math.min(10, parseInt(item.quantity || 1, 10)));
    const subtotal = +(PRODUCT_PRICE * quantity).toFixed(2);
    const total = +(subtotal + SHIPPING_PRICE).toFixed(2);
    const orderReference = generateOrderReference();

    // Construye el payload para n1co CheckoutLink
    const checkoutPayload = {
      orderReference,
      orderName: PRODUCT_NAME,
      orderDescription: PRODUCT_DESCRIPTION,
      amount: total,
      successUrl: `${process.env.SITE_URL}/gracias.html?order=${encodeURIComponent(orderReference)}`,
      cancelUrl: `${process.env.SITE_URL}/pago-cancelado.html`,
      expirationMinutes: 60,
      lineItems: [
        {
          sku: item.sku || 'CMS-MET-001',
          product: {
            name: PRODUCT_NAME,
            price: PRODUCT_PRICE,
            imageUrl: `${process.env.SITE_URL}/images/cuaderno-portada.png`,
            requiresShipping: true
          },
          quantity
        }
      ],
      metadata: [
        { name: 'customerName', value: customer.fullName },
        { name: 'customerEmail', value: customer.email },
        { name: 'customerPhone', value: customer.phone },
        { name: 'shippingDepartment', value: shipping.department },
        { name: 'shippingCity', value: shipping.city },
        { name: 'shippingAddress', value: shipping.address },
        { name: 'shippingNotes', value: shipping.notes || '' },
        { name: 'shippingPrice', value: String(SHIPPING_PRICE) }
      ]
    };

    const token = await getAccessToken();
    const apiBase = process.env.N1CO_CHECKOUT_BASE_URL || process.env.N1CO_BASE_URL;

    const r = await fetch(`${apiBase}/paymentlink/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutPayload)
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('n1co paymentlink error', r.status, errText);
      return bad(res, 502, 'No se pudo crear el link de pago. Intenta de nuevo.');
    }

    const out = await r.json();

    // TODO (Sprint siguiente): guardar el pedido en Supabase/Sheet con
    // status=PENDING para reconciliar con el webhook posterior.

    return res.status(200).json({
      orderCode: out.orderCode,
      orderId: out.orderId,
      paymentLinkUrl: out.paymentLinkUrl,
      orderReference
    });
  } catch (err) {
    console.error('checkout fatal', err);
    return bad(res, 500, err.message || 'Error interno');
  }
}
