# Integración n1co - Guía técnica

## Resumen

El sitio ahora tiene un flujo completo de checkout que llama a la API CheckoutLink de n1co. Funciona en dos planos:

- **Frontend estático** (`checkout.html`, `gracias.html`, `pago-cancelado.html`): captura datos de la clienta y consume `/api/n1co/checkout`.
- **Backend serverless** (Vercel Functions en `api/n1co/`): obtiene el token OAuth de n1co, crea el link de pago, y recibe webhooks de confirmación.

## Arquitectura del flujo

```
Index (botón "Pedir con pago en línea")
  │
  ▼
checkout.html  ── usuaria llena el form
  │
  ▼
POST /api/n1co/checkout
  ├─ 1) Obtiene token OAuth de n1co
  │     POST {N1CO_BASE_URL}/api/v3/Token
  │     body: { clientId, clientSecret }
  │     → { accessToken, expiresIn }
  │
  ├─ 2) Crea el link de pago
  │     POST {N1CO_BASE_URL}/paymentlink/checkout
  │     header: Authorization: Bearer {token}
  │     body: { orderReference, amount, lineItems, successUrl, cancelUrl, metadata }
  │     → { orderCode, orderId, paymentLinkUrl }
  │
  └─ 3) Devuelve paymentLinkUrl al frontend
        │
        ▼
        Redirect → checkout de n1co (paymentLinkUrl)
        │
        ▼
        Usuaria paga con tarjeta
        │
        ├──→ Éxito  → redirect a /gracias.html?order=MET-xxx
        └──→ Falla  → redirect a /pago-cancelado.html

Paralelamente:
n1co → POST /api/n1co/webhook (status: PAID / CANCELLED)
       ├─ Verifica firma HMAC (si está configurada)
       ├─ Actualiza pedido en DB
       ├─ Envía email a clienta
       └─ Notifica al admin
```

## Endpoints de la API de n1co usados

### 1. Obtener token OAuth 2.0

```
POST {N1CO_BASE_URL}/api/v3/Token
Content-Type: application/json

{
  "clientId": "xxx",
  "clientSecret": "xxx"
}
```

Respuesta:
```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

El token se cachea en memoria del runtime de Vercel y se renueva ~30s antes de expirar.

### 2. Crear link de pago (CheckoutLink)

```
POST {N1CO_CHECKOUT_BASE_URL}/paymentlink/checkout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "orderReference": "MET-1731270000123-XK7",
  "orderName": "Cuaderno de mis Sueños",
  "orderDescription": "...",
  "amount": 29.00,
  "successUrl": "https://mujeresentransformacion.com/gracias.html?order=MET-xxx",
  "cancelUrl": "https://mujeresentransformacion.com/pago-cancelado.html",
  "expirationMinutes": 60,
  "lineItems": [
    {
      "sku": "CMS-MET-001",
      "product": {
        "name": "Cuaderno de mis Sueños",
        "price": 25.00,
        "imageUrl": "https://mujeresentransformacion.com/images/cuaderno-portada.png",
        "requiresShipping": true
      },
      "quantity": 1
    }
  ],
  "metadata": [
    { "name": "customerName",  "value": "Juana Pérez" },
    { "name": "customerEmail", "value": "j@ejemplo.com" },
    { "name": "customerPhone", "value": "+503 7000 0000" },
    { "name": "shippingDepartment", "value": "San Salvador" },
    { "name": "shippingCity",    "value": "Soyapango" },
    { "name": "shippingAddress", "value": "..." }
  ]
}
```

Respuesta:
```json
{
  "orderCode": "ORD-XYZ-001",
  "orderId": 12345,
  "paymentLinkUrl": "https://pay.n1co.com/..."
}
```

### 3. Webhook (n1co → nuestro endpoint)

n1co llama a `POST /api/n1co/webhook` cuando una orden cambia de estado:

- **PAID** → pago confirmado, hay que avisar al admin y enviar email a la clienta
- **CANCELLED** → la usuaria abandonó o el banco rechazó
- **FINALIZED** → orden cerrada definitivamente

**Importante:** la documentación pública aún no detalla el shape exacto del payload del webhook. El handler `api/n1co/webhook.js` cubre claves probables (`orderCode`, `status`, `metadata`) y debe ajustarse cuando recibamos el primer evento real desde sandbox.

## Configuración paso a paso

### 1. Solicitar acceso a n1co

1. Crear cuenta de comercio en https://n1co.com/merchants/
2. Solicitar credenciales API (clientId + clientSecret) en sandbox y producción
3. Pedir que activen el módulo **CheckoutLink API**

### 2. Configurar variables de entorno en Vercel

En `Vercel → Project → Settings → Environment Variables`, agregar:

| Variable | Valor sandbox | Valor producción |
|----------|---------------|-------------------|
| `N1CO_CLIENT_ID` | (dado por n1co) | (dado por n1co) |
| `N1CO_CLIENT_SECRET` | (dado por n1co) | (dado por n1co) |
| `N1CO_BASE_URL` | `https://api-sandbox.n1co.shop` | (confirmar con n1co) |
| `N1CO_CHECKOUT_BASE_URL` | igual a base | igual a base |
| `N1CO_WEBHOOK_SECRET` | (opcional) | (opcional) |
| `SITE_URL` | `https://<rama>.vercel.app` | `https://mujeresentransformacion.com` |

### 3. Configurar webhook en el panel de n1co

URL del webhook: `https://<dominio>/api/n1co/webhook`
Eventos: `order.paid`, `order.cancelled`, `order.finalized` (los nombres exactos los confirma n1co al darnos acceso al panel)

### 4. Probar el flujo en sandbox

1. Levantar el proyecto local con `vercel dev`
2. Llenar el formulario en `/checkout.html`
3. n1co debería emitir un link de pago de prueba
4. Usar tarjeta de prueba (n1co proporciona números de test)
5. Verificar que tras pagar lleguen los webhooks a `/api/n1co/webhook`
6. Revisar logs con `vercel logs`

### 5. Pasar a producción

- Cambiar las env vars a las credenciales de producción
- Solicitar a n1co la activación del entorno productivo
- Hacer una venta de prueba con monto pequeño ($1)
- Confirmar que llegue el desembolso al banco

## Archivos relevantes

| Archivo | Función |
|---------|---------|
| `checkout.html` | Formulario de captura de datos de la clienta |
| `js/checkout.js` | Lógica del form, llama a `/api/n1co/checkout` |
| `css/checkout.css` | Estilos del checkout |
| `api/n1co/checkout.js` | Serverless function: token + creación de link |
| `api/n1co/webhook.js` | Serverless function: recibe notificaciones de pago |
| `gracias.html` | Página de éxito (post-pago) |
| `pago-cancelado.html` | Página de pago cancelado |
| `.env.example` | Plantilla de variables de entorno |
| `vercel.json` | Configuración de hosting, headers de seguridad |
| `package.json` | Metadata + dependencias |

## Pendientes / TODOs

- [ ] Confirmar con n1co la URL base de producción
- [ ] Definir el shape exacto del payload del webhook (ajustar `webhook.js`)
- [ ] Conectar Supabase para guardar pedidos (status PENDING → PAID)
- [ ] Conectar Resend o Brevo para emails de confirmación
- [ ] Agregar notificación al admin por email/WhatsApp Business
- [ ] Cargar precio real del cuaderno (hoy: `$25` placeholder en `api/n1co/checkout.js`)
- [ ] Calcular envío dinámicamente según departamento
- [ ] Agregar reCAPTCHA invisible para prevenir spam en el form
- [ ] Test E2E con Playwright del flujo completo

## Recursos

- [Documentación n1co](https://n1-docs.pages.dev/docs/intro/)
- [CheckoutLink API - Endpoints](https://n1-docs.pages.dev/docs/checkoutlink-api/endpoints/)
- [Integration API - Auth](https://n1-docs.pages.dev/docs/integration-api/auth/)
- [Portal API](https://api-docs.n1co.com/)
