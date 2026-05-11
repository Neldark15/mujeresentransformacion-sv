# Análisis del sitio mujeresentransformacion.com
## Estado actual y propuesta de mejoras

**Fecha:** 10/05/2026
**URL analizada:** https://www.mujeresentransformacion.com
**Stack detectado:** Next.js + v0.app (Vercel) — landing page de una sola sección

---

## 1. Lo que YA tiene el sitio (funcional)

- Landing page (one-page) con anclas internas (`#que-incluye`, `#sobre-met`)
- Hero con CTA principal "Quiero mi cuaderno"
- Sección "Este cuaderno es para ti si…" (6 perfiles del público objetivo)
- Sección "Dentro de tu cuaderno" (6 features con íconos)
- Galería con 3 imágenes muestra de páginas interiores
- Cita inspiracional / testimonio de marca
- Sección "¿Qué es MET?" con pilares (Fe, Propósito, Transformación)
- Sección de compra con bullets y botón a WhatsApp
- Footer con logo, descripción, redes sociales y copyright
- 3 botones flotantes hacia WhatsApp (+503 6309 6466)
- Enlaces a Instagram y TikTok
- Meta tags básicos (description, OG, Twitter Card)

---

## 2. Lo que LE FALTA — Prioridad ALTA

### 2.1 Precio del producto NO aparece visible
- En todo el sitio NO se muestra el costo del cuaderno
- Esto baja la tasa de conversión: el usuario debe entrar a WhatsApp solo para preguntar precio
- **Recomendación:** Mostrar precio claramente en la sección "Comprar". Si hay envío con costo, indicarlo aquí.

### 2.2 Sin formulario de contacto o de pedido
- Todo depende de WhatsApp (un solo canal, frágil)
- Si el cliente pierde el WhatsApp, se cae todo el embudo
- **Recomendación:**
  - Formulario de pedido con campos: nombre, ciudad, teléfono, cantidad, método de pago, dirección
  - Conectar a un email (Formspree, Web3Forms, Netlify Forms) y/o a una hoja de Google
  - Backup como email opcional además de WhatsApp

### 2.3 Sin método de pago integrado / sin checkout
- El sitio dice "Pago seguro" pero no hay pasarela
- **Recomendación según presupuesto:**
  - **Económico:** Wompi (El Salvador), N1co, o links de pago de PayPal/Stripe
  - **Avanzado:** Tienda completa con Shopify/WooCommerce/Stripe Checkout
  - **Híbrido:** Link de pago + confirmación por WhatsApp (sigue el flujo actual pero acelerado)

### 2.4 No tiene sección de testimonios reales
- Solo hay una cita inspiracional (parece de la propia marca, no de clientas)
- **Recomendación:** Agregar 3-6 testimonios reales de mujeres que ya tienen el cuaderno (foto + nombre + ciudad + frase corta). Genera prueba social, esencial para vender.

### 2.5 Sin sección de FAQs (Preguntas Frecuentes)
- Faltan respuestas a dudas comunes: ¿cuánto cuesta?, ¿cuántos días tarda el envío?, ¿hacen envíos fuera de El Salvador?, ¿es digital o físico?, ¿tiene devolución?, ¿qué tamaño es?
- **Recomendación:** Acordeón con 6-10 FAQs. Reduce tráfico de WhatsApp con preguntas básicas.

### 2.6 Página de error 404 personalizada
- Actualmente cualquier ruta inexistente muestra el 404 de Next.js por defecto
- **Recomendación:** Diseñar un 404 con la identidad de la marca y un CTA para volver al home

---

## 3. Lo que LE FALTA — Prioridad MEDIA

### 3.1 Política de privacidad y términos
- Por requisito legal y de plataformas (Meta Ads, Google), faltan:
  - Política de privacidad
  - Términos y condiciones
  - Política de envíos y devoluciones
- **Recomendación:** Páginas separadas enlazadas desde el footer

### 3.2 SEO básico ausente
- El meta tag `robots` actualmente está en `noindex` en algunas respuestas — **el sitio podría no estar indexado en Google**
- Falta `sitemap.xml`
- Falta `robots.txt`
- Falta marcado estructurado (Schema.org Product/Organization)
- **Recomendación:** Habilitar indexación, generar sitemap, agregar JSON-LD de tipo `Product` y `Organization`

### 3.3 Sin Google Analytics / Meta Pixel
- No hay pixel de Facebook ni Google Analytics detectable
- **Recomendación:** Instalar GA4 + Meta Pixel para medir tráfico, fuentes y poder hacer remarketing en redes

### 3.4 Sin video del producto
- Solo hay fotos del cuaderno
- **Recomendación:** Video corto (15-30s) mostrando el cuaderno físico hojeado. Aumenta conversión en e-commerce hasta 80%.

### 3.5 Sección "Sobre nosotras" muy genérica
- Dice "dos mujeres" pero no se ven sus rostros, nombres ni historias
- **Recomendación:** Fotos profesionales de las fundadoras + bio corta de cada una. Humaniza la marca.

### 3.6 Newsletter / captura de leads
- No hay forma de capturar el email de visitantes que no compran hoy
- **Recomendación:** Pop-up suave o sección con: "Recibe contenido gratuito de transformación" → email a Mailchimp/Brevo/MailerLite

### 3.7 Blog / contenido recurrente
- Sin blog no hay forma de atraer tráfico orgánico SEO
- **Recomendación:** Blog con 1-2 posts mensuales: meditaciones, ejercicios de visualización, testimonios, devocionales. SEO + retención.

### 3.8 Multi-idioma
- Solo español
- **Recomendación:** Si hay público en USA (mujeres latinas), evaluar versión EN

---

## 4. Lo que LE FALTA — Prioridad BAJA (mejora de experiencia)

### 4.1 Cookie banner / aviso legal de cookies
### 4.2 Mejor accesibilidad (a11y)
- Algunos botones y íconos no tienen `aria-label`
- Contraste de algunos textos sobre fondos morados puede ser bajo en pantallas pequeñas
### 4.3 Optimización de imágenes
- La portada del cuaderno pesa **2.2 MB** (debería pesar < 300 KB con WebP/AVIF)
- Las otras imágenes también podrían optimizarse
### 4.4 Performance / Core Web Vitals
- El sitio actual hace renderizado del lado del cliente (BAILOUT_TO_CLIENT_SIDE_RENDERING). Esto perjudica el SEO y la velocidad.
- **Recomendación:** Server-Side Rendering o Static Generation real (mover componentes interactivos a 'use client' solo donde sea necesario)
### 4.5 Calendario / sección de eventos o talleres
- Si MET hace charlas, retiros o lanzamientos, debería verse aquí
### 4.6 Galería de Instagram embebida
- Mostrar últimas 6-9 fotos de IG con embed automático
### 4.7 Sello de "Hecho en El Salvador" o de pequeña empresa
- Refuerza el "compra local"

---

## 5. Bugs / Problemas detectados

| # | Problema | Severidad |
|---|----------|-----------|
| 1 | Etiqueta `<meta name="robots" content="noindex">` presente — bloquea Google | Crítico |
| 2 | Doble título `<title>` (uno dice "404" y otro el correcto) | Alto |
| 3 | Mensajes de WhatsApp algunos llevan tildes y otros no | Medio |
| 4 | Imagen de portada pesada (2.2 MB) | Medio |
| 5 | Botón "Contacto" en menú abre WhatsApp directamente sin opción de email | Bajo |
| 6 | Footer dice "2026" hardcodeado — debería ser dinámico | Bajo |
| 7 | El "@" del handle de TikTok en el enlace lleva guion bajo final (`@mujeresentransformacion_`), distinto a Instagram (`.sv`) — verificar que ambos sean los oficiales | Verificar |

---

## 6. Lo que ENTREGAMOS en esta carpeta

```
mujeresentransformacionSV/
├── www.mujeresentransformacion.com/   ← copia cruda (Next.js)
│   ├── index-rendered.html            ← HTML renderizado completo
│   ├── _next/static/...               ← chunks JS/CSS originales
│   └── images/                        ← imágenes originales descargadas
│
├── sitio-mujeres-transformacion/      ← COPIA FUNCIONAL LIMPIA (lista para editar)
│   ├── index.html                     ← HTML semántico, accesible
│   ├── css/style.css                  ← estilos limpios (paleta morada MET)
│   ├── js/script.js                   ← menú móvil + scroll suave + animaciones
│   └── images/                        ← imágenes con nombres claros
│
└── ANALISIS-Y-MEJORAS.md              ← este documento
```

La carpeta **sitio-mujeres-transformacion/** es una copia editable en HTML/CSS/JS puro. Se puede abrir directamente en cualquier navegador o servir con:

```bash
cd sitio-mujeres-transformacion
python3 -m http.server 8080
# abrir http://localhost:8080
```

---

## 7. Plan de acción sugerido (orden recomendado)

### Sprint 1 — Quick wins (1 semana)
1. Mostrar precio del cuaderno en la sección de compra
2. Habilitar indexación en Google + sitemap.xml + robots.txt
3. Optimizar imágenes (WebP, lazy-load correcto)
4. Agregar Google Analytics 4 y Meta Pixel
5. Corregir bugs menores (doble title, año dinámico)

### Sprint 2 — Conversión (2 semanas)
6. Sección de Testimonios reales
7. Sección de FAQs
8. Formulario de pedido como backup de WhatsApp
9. Página de Política de privacidad + Términos

### Sprint 3 — Crecimiento (3-4 semanas)
10. Pasarela de pago (Wompi / N1co / Stripe)
11. Newsletter + captura de leads
12. Página "Sobre nosotras" con las fundadoras
13. Video del producto
14. Blog inicial con 3-4 posts seed

### Sprint 4 — Largo plazo
15. Tienda completa con catálogo de productos
16. Versión bilingüe ES/EN
17. Sección de talleres/eventos
18. App o portal de comunidad
