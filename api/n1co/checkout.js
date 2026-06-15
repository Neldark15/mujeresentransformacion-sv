/**
 * POST /api/n1co/checkout
 *
 * Crea un link de pago en n1co a partir del carrito + datos de envío.
 *
 * Variables de entorno requeridas (Vercel):
 *   - N1CO_CLIENT_ID
 *   - N1CO_CLIENT_SECRET
 *   - N1CO_BASE_URL          (ej: https://api-sandbox.n1co.shop)
 *   - N1CO_CHECKOUT_BASE_URL (ej: igual al base, o el host dedicado)
 *   - SITE_URL               (ej: https://mujeresentransformacion.com)
 *
 * IMPORTANTE: los precios se recomputan SIEMPRE server-side a partir
 * del catálogo en productos.js. Nunca se confía en lo que envía el cliente.
 */

import { PRODUCTOS, getProductoById } from '../../js/productos.js';

const SHIPPING_FLAT = 4.00;   // ← ajustar cuando el cliente confirme
const MAX_ITEM_QTY  = 10;
const MAX_ITEMS     = 20;

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
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MET-${ts}-${rnd}`;
}

function bad(res, code, msg) {
  res.status(code).json({ error: msg });
}

/**
 * Toma los items del cliente y los resuelve contra el catálogo,
 * descartando productos inexistentes y normalizando cantidades.
 */
function resolveItems(rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { items: [], subtotal: 0 };
  }
  const slice = rawItems.slice(0, MAX_ITEMS);
  const items = [];
  let subtotal = 0;

  for (const raw of slice) {
    const product = getProductoById(raw?.productId);
    if (!product || product.stock === 0) continue;
    const qty = Math.max(1, Math.min(MAX_ITEM_QTY, parseInt(raw.quantity || 1, 10)));
    // Validar variante (si el producto tiene)
    let variantId = null;
    let variantLabel = null;
    if (product.variantes) {
      const found = product.variantes.opciones.find(o => o.id === raw.variantId);
      if (!found) continue;       // variante requerida pero no enviada → ignoramos el item
      variantId = found.id;
      variantLabel = found.label;
    }
    items.push({
      product,
      qty,
      variantId,
      variantLabel,
      lineTotal: +(product.precio * qty).toFixed(2)
    });
    subtotal += product.precio * qty;
  }

  return { items, subtotal: +subtotal.toFixed(2) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return bad(res, 405, 'Método no permitido');
  }

  try {
    const body = req.body || {};
    const { customer = {}, shipping = {} } = body;

    // ---- Validación de datos del cliente ----
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

    // ---- Resolver items del carrito ----
    const { items, subtotal } = resolveItems(body.items);
    if (items.length === 0) {
      return bad(res, 400, 'El carrito está vacío o no contiene productos válidos');
    }

    // Si todo el carrito es digital, no cobramos envío
    const allDigital = items.every(i => i.product.digital);
    const shippingCost = allDigital ? 0 : SHIPPING_FLAT;
    const total = +(subtotal + shippingCost).toFixed(2);
    const orderReference = generateOrderReference();

    const lineItems = items.map(i => ({
      sku: i.product.sku,
      product: {
        name: i.variantLabel ? `${i.product.nombre} — ${i.variantLabel}` : i.product.nombre,
        price: i.product.precio,
        imageUrl: `${process.env.SITE_URL}${i.product.imagenes?.[0]?.src?.startsWith('/') ? '' : '/'}${i.product.imagenes?.[0]?.src || 'images/logo-morado.png'}`,
        requiresShipping: !i.product.digital
      },
      quantity: i.qty
    }));

    // Resumen humano para n1co
    const orderName = items.length === 1
      ? items[0].product.nombre
      : `Pedido MET (${items.reduce((s, i) => s + i.qty, 0)} productos)`;
    const orderDescription = items
      .map(i => `${i.qty}× ${i.product.nombre}${i.variantLabel ? ` (${i.variantLabel})` : ''}`)
      .join(' · ')
      .slice(0, 2048);

    const checkoutPayload = {
      orderReference,
      orderName,
      orderDescription,
      amount: total,
      successUrl: `${process.env.SITE_URL}/gracias.html?order=${encodeURIComponent(orderReference)}`,
      cancelUrl:  `${process.env.SITE_URL}/pago-cancelado.html`,
      expirationMinutes: 60,
      lineItems,
      metadata: [
        { name: 'customerName',       value: customer.fullName },
        { name: 'customerEmail',      value: customer.email },
        { name: 'customerPhone',      value: customer.phone },
        { name: 'shippingDepartment', value: shipping.department },
        { name: 'shippingCity',       value: shipping.city },
        { name: 'shippingAddress',    value: shipping.address },
        { name: 'shippingNotes',      value: shipping.notes || '' },
        { name: 'shippingPrice',      value: String(shippingCost) },
        { name: 'subtotal',           value: String(subtotal) },
        { name: 'allDigital',         value: String(allDigital) }
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

    // TODO (Sprint 3): persistir el pedido en Supabase con status=PENDING
    // para reconciliar luego con el webhook (PAID/CANCELLED).

    return res.status(200).json({
      orderCode: out.orderCode,
      orderId: out.orderId,
      paymentLinkUrl: out.paymentLinkUrl,
      orderReference,
      total,
      subtotal,
      shipping: shippingCost
    });
  } catch (err) {
    console.error('checkout fatal', err);
    return bad(res, 500, err.message || 'Error interno');
  }
}
