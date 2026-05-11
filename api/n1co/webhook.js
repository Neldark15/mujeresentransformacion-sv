/**
 * POST /api/n1co/webhook
 *
 * Endpoint que recibe notificaciones de n1co cuando una orden cambia de estado:
 *   PENDING → PAID / CANCELLED / FINALIZED
 *
 * URL a configurar en el panel de n1co:
 *   https://<tu-dominio>/api/n1co/webhook
 *
 * Variables de entorno opcionales:
 *   - N1CO_WEBHOOK_SECRET   (si n1co envía firma HMAC para validar el origen)
 *   - ADMIN_NOTIFY_EMAIL    (dónde notificar al admin cada venta)
 *   - RESEND_API_KEY        (para enviar emails de confirmación a la clienta)
 *
 * NOTA: la documentación pública de n1co aún no detalla el formato exacto del
 *       payload del webhook. Este handler intenta cubrir las claves probables
 *       (orderCode, orderReference, status, amount, metadata) y debe ajustarse
 *       cuando recibamos el primer evento real desde sandbox.
 */

import crypto from 'node:crypto';

function verifySignature(rawBody, signatureHeader) {
  if (!process.env.N1CO_WEBHOOK_SECRET) return true; // si no hay secret, omitimos
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac('sha256', process.env.N1CO_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
  } catch {
    return false;
  }
}

// Lee el body como string para validar la firma antes de parsear JSON
async function readRawBody(req) {
  if (req.body && typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  let raw;
  try {
    raw = await readRawBody(req);
  } catch (err) {
    return res.status(400).json({ error: 'No se pudo leer el cuerpo del webhook' });
  }

  const signature =
    req.headers['x-n1co-signature'] ||
    req.headers['x-signature'] ||
    req.headers['signature'];

  if (!verifySignature(raw, signature)) {
    console.warn('webhook n1co: firma inválida');
    return res.status(401).json({ error: 'Firma inválida' });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Payload no es JSON válido' });
  }

  // Normalización defensiva (ajustar cuando confirmemos el shape real con n1co)
  const orderCode = event.orderCode || event.order?.code || event.data?.orderCode;
  const orderRef = event.orderReference || event.order?.reference || event.data?.orderReference;
  const status = (event.status || event.order?.status || event.data?.status || '').toUpperCase();
  const amount = event.amount || event.order?.amount || event.data?.amount;
  const metadata = event.metadata || event.order?.metadata || event.data?.metadata || [];

  console.log('[n1co webhook]', { orderCode, orderRef, status, amount });

  // Reconstruimos los datos de la clienta desde la metadata enviada al crear el link
  const meta = Array.isArray(metadata)
    ? Object.fromEntries(metadata.map(m => [m.name, m.value]))
    : metadata;

  try {
    if (status === 'PAID' || status === 'FINALIZED') {
      // TODO: actualizar el pedido en Supabase a status=PAID
      // TODO: enviar email de confirmación a la clienta (Resend / Brevo)
      // TODO: notificar al admin por email/WhatsApp Business API

      console.log('Pago confirmado', {
        orderRef,
        customer: meta.customerName,
        email: meta.customerEmail,
        phone: meta.customerPhone,
        address: `${meta.shippingAddress}, ${meta.shippingCity}, ${meta.shippingDepartment}`,
        notes: meta.shippingNotes
      });
    } else if (status === 'CANCELLED') {
      // TODO: actualizar estado en Supabase a CANCELLED
      console.log('Pago cancelado', { orderRef });
    }
  } catch (err) {
    console.error('Error procesando webhook', err);
    // Devolver 200 igual para que n1co no reintente indefinidamente si el
    // error es nuestro (idempotencia / fallback manual)
  }

  return res.status(200).json({ received: true });
}
