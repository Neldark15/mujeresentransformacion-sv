# Mujeres en Transformación — Sitio Web

Landing page de **Mujeres en Transformación (MET)** para la venta del *Cuaderno de mis Sueños*.

Sitio en producción: https://www.mujeresentransformacion.com

## Stack

- HTML5 semántico
- CSS3 (Custom Properties / Grid / Flexbox)
- JavaScript vanilla (sin dependencias)
- Tipografías: Outfit + Dancing Script (Google Fonts)

## Estructura

```
.
├── index.html          # Página principal
├── css/style.css       # Estilos
├── js/script.js        # Interacciones (menú, scroll, animaciones)
└── images/             # Imágenes del sitio
    ├── cuaderno-portada.png
    ├── cuaderno-pagina-1.png
    ├── cuaderno-pagina-2.png
    ├── cuaderno-pagina-3.png
    ├── logo-morado.png
    ├── logo-blanco.png
    └── icono-blanco.png
```

## Cómo correr localmente

```bash
# Servidor simple con Python
python3 -m http.server 8080

# O con Node
npx serve .

# Abrir
open http://localhost:8080
```

## Roadmap

Ver `ANALISIS-Y-MEJORAS.md` (raíz del repo padre) para el plan completo.

### Sprint 1 — Quick wins
- [ ] Habilitar indexación (quitar `noindex`)
- [ ] Mostrar precio del cuaderno
- [ ] Optimizar imágenes (WebP, lazy-load)
- [ ] Google Analytics 4 + Meta Pixel
- [ ] sitemap.xml + robots.txt

### Sprint 2 — Conversión
- [ ] Sección de testimonios reales
- [ ] FAQs
- [ ] Formulario de pedido (backup de WhatsApp)
- [ ] Política de Privacidad + Términos

### Sprint 3 — Pagos en línea
- [ ] Integración con N1co o Wompi (pasarela de pago)
- [ ] Checkout y página de éxito/error
- [ ] Webhooks para confirmación de pago
- [ ] Email automático de confirmación

### Sprint 4 — Crecimiento
- [ ] Newsletter (Brevo / Mailchimp)
- [ ] Blog
- [ ] Sección "Sobre nosotras" con las fundadoras
- [ ] Video del producto

## Contacto

WhatsApp: +503 6309 6466
Instagram: [@mujeresentransformacion.sv](https://www.instagram.com/mujeresentransformacion.sv/)
TikTok: [@mujeresentransformacion_](https://www.tiktok.com/@mujeresentransformacion_)
