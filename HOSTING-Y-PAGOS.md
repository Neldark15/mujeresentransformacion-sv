# Plan de Hosting + Integración de Pagos Online
## Mujeres en Transformación

---

## 1. URLs activas del proyecto

| Recurso | URL |
|---------|-----|
| Repositorio GitHub | https://github.com/Neldark15/mujeresentransformacion-sv |
| GitHub Pages (preview gratis) | https://neldark15.github.io/mujeresentransformacion-sv/ |
| Sitio actual del cliente | https://www.mujeresentransformacion.com |

GitHub Pages se publica en ~1–3 minutos después de cada `git push`.

---

## 2. Análisis de hosting — Comparativa para este proyecto

El sitio actual está hecho en **Next.js (v0.app)**. Si vamos a integrar pagos en línea con N1co/Wompi/Serfinsa, vamos a necesitar:

- Variables de entorno seguras (API keys que NO deben estar en el HTML)
- Endpoints serverless para procesar pagos y recibir webhooks
- SSL/HTTPS obligatorio (requisito de los gateways)
- Dominio personalizado (mujeresentransformacion.com)

### Comparativa

| Hosting | Plan gratis | Funciones serverless | Variables de entorno | Webhooks | Dominio personalizado | Recomendado para este caso |
|---------|-------------|---------------------|----------------------|----------|------------------------|---------------------------|
| **Vercel** | Sí (hobby) | Sí (Edge/Node) | Sí | Sí | Sí, SSL automático | ⭐⭐⭐⭐⭐ |
| **Netlify** | Sí | Sí (Functions) | Sí | Sí | Sí | ⭐⭐⭐⭐ |
| **Cloudflare Pages** | Sí | Sí (Workers) | Sí | Sí | Sí | ⭐⭐⭐⭐ |
| **GitHub Pages** | Sí | ❌ No | ❌ No (es estático) | ❌ | Sí | ⭐⭐ (solo demo) |
| **Hostinger/SiteGround** | No (paga) | Sí (PHP) | Sí | Sí | Sí | ⭐⭐⭐ |

### Recomendación: **Vercel**

**Por qué:**
1. El sitio actual ya está hecho en v0.app, que es de Vercel → migración natural
2. Tiene `Vercel Insights` integrado (analytics gratis)
3. Edge functions ultra-rápidas en El Salvador
4. SSL automático y gratis
5. Despliegue automático en cada `git push`
6. **Plan Hobby gratis cubre perfectamente este proyecto** (100 GB de banda/mes)
7. Cuando integremos N1co/Wompi, las API routes corren en serverless sin configuración extra

**Cuando pasar a plan pago ($20/mes Pro):** Solo si el sitio supera ~50,000 visitas/mes o si necesitamos analytics avanzados.

---

## 3. Pasos para activar Vercel + dominio

### Paso 1: Crear cuenta en Vercel (5 min)
- Entrar a https://vercel.com → Sign Up con GitHub
- Autorizar el repo `Neldark15/mujeresentransformacion-sv`

### Paso 2: Importar el proyecto (2 min)
- Click "Add New Project" → seleccionar el repo
- Framework Preset: **"Other"** (es HTML estático)
- Root Directory: `./`
- Build Command: (vacío)
- Output Directory: `./`
- Click "Deploy"

### Paso 3: Conectar dominio mujeresentransformacion.com (15 min)
- En Vercel → Project → Settings → Domains
- Agregar `mujeresentransformacion.com` y `www.mujeresentransformacion.com`
- En el proveedor del dominio (donde se compró) cambiar los DNS:
  - Tipo A `@` → `76.76.21.21`
  - Tipo CNAME `www` → `cname.vercel-dns.com`
- En 1-24h Vercel emite SSL automático

### Paso 4: Configurar variables de entorno (cuando integremos pagos)
- Settings → Environment Variables
- Agregar: `WOMPI_API_KEY`, `WOMPI_SECRET`, `N1CO_API_KEY`, etc.

---

## 4. Integración de pagos — Análisis técnico

### 4.1 Comparativa rápida de gateways en El Salvador

| Característica | **Wompi (Banco Agrícola)** | **N1co** | **Serfinsa** |
|----------------|-----------------------------|----------|--------------|
| API REST documentada | ✅ docs.wompi.sv | ✅ api-docs.n1co.com | ✅ pero menos pública |
| Sandbox / pruebas | ✅ | ✅ | ✅ por convenio |
| Link de pago (sin código) | ✅ Sí, simple | ✅ CheckoutLink | ✅ Botón de pago |
| Checkout embebido | ✅ | ✅ | ✅ |
| Webhooks | ✅ | ✅ | ✅ |
| Plugins WooCommerce | ✅ oficial | ✅ oficial | ❌ |
| Tarjetas crédito/débito | ✅ Visa, MC | ✅ Visa, MC | ✅ Visa, MC, Amex |
| Pago con QR | ✅ | ✅ | ✅ |
| Requisito de banco | Cuenta Banco Agrícola activa 3+ meses | Cualquier banco SV | Cualquier banco SV |
| Comisión transacción | ~2.85% (variable) | ~2.5% – 3.5% | ~2.5% – 3.5% (negociable) |
| Tiempo de desembolso | T+1 (después del primer pago a 7 días) | T+1 a T+3 | Negociable |
| Cobertura | Solo El Salvador | El Salvador, Guatemala, Honduras | Solo El Salvador |
| Mejor para | Comercios pequeños con Banco Agrícola | Multi-país, integración moderna | Empresas medianas |

### 4.2 Recomendación: **N1co como primario, Wompi como respaldo**

**Por qué N1co:**
- Tiene SDK / API moderna estilo REST (mejor DX)
- CheckoutLink API muy simple para empezar
- Soporta El Salvador + opcionalmente expandir a Guatemala/Honduras
- No requiere cuenta específica en un banco

**Por qué tener Wompi como respaldo:**
- Si la clienta del cuaderno solo tiene Banco Agrícola y prefiere ese flujo
- Da redundancia: si un gateway falla, hay otra opción

### 4.3 Arquitectura propuesta

```
[Cliente abre sitio]
       │
       ▼
[Click "Comprar"]
       │
       ▼
[Formulario: nombre, email, teléfono, ciudad, dirección]
       │
       ▼
┌──────────────────────────────────────┐
│ Vercel Serverless Function           │
│ POST /api/checkout                   │
│  → Genera link de pago en N1co       │
│  → Guarda intent en base (Supabase)  │
└──────────────────────────────────────┘
       │
       ▼
[Redirect a N1co checkout]
       │
       ▼
[Usuario paga con tarjeta]
       │
       ▼
[N1co webhook → /api/webhooks/n1co]
       │
       ├──→ Actualiza estado en Supabase
       ├──→ Envía email de confirmación (Resend)
       └──→ Notifica al admin por WhatsApp Business API
       │
       ▼
[Redirect a /gracias.html con datos del pedido]
```

### 4.4 Stack técnico necesario

| Capa | Tecnología | Costo |
|------|-----------|-------|
| Frontend | HTML/CSS/JS (ya hecho) o Next.js | $0 |
| Hosting | Vercel | $0 |
| Pasarela | N1co + Wompi backup | % por transacción |
| Base de datos | Supabase (Postgres) | $0 hasta 500 MB |
| Emails | Resend o Brevo | $0 hasta 3,000/mes |
| WhatsApp notif. | API de WhatsApp Business o webhook a Twilio | ~$0.005/mensaje |
| Dominio | Ya lo tienen | $10–15/año |

**Total mensual estimado para empezar: $0** (solo se paga la comisión por venta)

---

## 5. ¿Qué necesito de ti para avanzar?

Para que pueda continuar implementando, necesito:

### Para hosting (Vercel + dominio)
1. **Acceso al panel del dominio** `mujeresentransformacion.com` (donde se compró: GoDaddy, Namecheap, etc.) — para cambiar los DNS
2. **Acceso al proyecto actual de Vercel** (si el sitio está ya allí desde v0.app) — para hacer la migración limpia, o confirmar si lo creamos nuevo
3. **Decisión:** ¿quieren que el HTML estático sea el sitio nuevo, o prefieren mantener el Next.js de v0 y solo agregarle los módulos?

### Para integración de pagos
4. **¿Qué gateway prefieren? N1co, Wompi o ambos?** Mi recomendación es N1co.
5. **Cuenta del comercio en el gateway elegido:**
   - Si es **N1co**: registrarse en https://n1co.com/merchants/ → solicitar API keys (necesito `Client ID` + `Client Secret` de sandbox y producción)
   - Si es **Wompi**: requiere cuenta Banco Agrícola activa con 3+ meses → solicitar acceso a https://wompi.sv → API keys
6. **Precio oficial del Cuaderno de mis Sueños** (no aparece en el sitio)
7. **Política de envíos**: ¿hacen envío físico? ¿costo? ¿cobertura geográfica? ¿días estimados?
8. **¿El producto es físico o digital (PDF)?** El sitio dice "descarga inmediata" pero también "envío a todo El Salvador" — clarificar
9. **Email del negocio** para recibir notificaciones de ventas
10. **Política de devolución** (requisito legal para procesar pagos online)

### Para complementar el sitio
11. **Logo en SVG o alta resolución** (los actuales son PNG, pesados)
12. **Fotos de las fundadoras** (para sección "Sobre nosotras")
13. **3-6 testimonios reales** de clientas (texto + foto + nombre + ciudad)
14. **¿Tienen presupuesto para campañas Meta Ads/Google Ads?** — afecta cómo configuramos el pixel y analytics

---

## 6. Próximos pasos sugeridos (orden recomendado)

### Esta semana
- [x] Repositorio en GitHub creado
- [x] Sitio en GitHub Pages como preview (https://neldark15.github.io/mujeresentransformacion-sv/)
- [ ] **Tú:** revisar el preview y dar feedback de diseño
- [ ] **Tú:** responder los puntos 1–10 de arriba
- [ ] Crear cuenta en Vercel y conectar el repo
- [ ] Iniciar trámite de cuenta de comercio en N1co o Wompi

### Próxima semana
- [ ] Migrar a Vercel + conectar dominio
- [ ] Agregar formulario de pedido con validación
- [ ] Crear endpoint `/api/checkout` (serverless)
- [ ] Probar flujo de pago en sandbox del gateway
- [ ] Implementar webhook de confirmación
- [ ] Agregar página de "Pago exitoso" y "Pago rechazado"

### Semana 3
- [ ] Conectar Supabase para guardar pedidos
- [ ] Enviar emails automáticos (Resend)
- [ ] Quitar `noindex` y publicar sitemap
- [ ] Conectar Google Analytics + Meta Pixel
- [ ] Optimizar imágenes (WebP + lazy)
- [ ] Pruebas en producción con pagos reales (montos pequeños)

---

## 7. Fuentes consultadas

- [Wompi El Salvador — Documentación API](https://docs.wompi.sv/)
- [Wompi — Crear Enlace de Pago](https://docs.wompi.sv/metodos-api/enlace-de-pago)
- [Wompi — Tarifas](https://wompi.sv/Tarifas)
- [Wompi — Preguntas Frecuentes](https://wompisv.zendesk.com/hc/es-419/articles/360050835893-Preguntas-Frecuentes)
- [Wompi en Banco Agrícola](https://www.bancoagricola.com/wompi)
- [n1co — API de pagos](https://n1co.com/api-de-pagos/)
- [n1co — Documentación oficial](https://n1-docs.pages.dev/)
- [n1co — Portal de API](https://api-docs.n1co.com/)
- [n1co — Plugin WooCommerce](https://n1-docs.pages.dev/en/docs/N1co-Woocommerce/)
- [Serfinsa — Pagos Online](https://www.redserfinsa.com/pagos-online.html)
- [Serfinsa — Sitio principal](https://redserfinsa.com/)
