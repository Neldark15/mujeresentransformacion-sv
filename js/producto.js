// =================================================
// Producto - página de detalle con galería y variantes
// =================================================
import { getProductoById, getRelacionados, CATEGORIAS } from './productos.js';
import { addToCart } from './cart.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const params = new URLSearchParams(location.search);
const productId = params.get('id');
const product = getProductoById(productId);

const content = $('#productContent');
const breadcrumb = $('#breadcrumbCurrent');

if (!product) {
  breadcrumb.textContent = 'No encontrado';
  content.innerHTML = `
    <div class="product-not-found">
      <h2>Producto no encontrado</h2>
      <p>El producto que buscas no existe o fue retirado del catálogo.</p>
      <a href="/tienda.html" class="btn btn-primary">Volver a la tienda</a>
    </div>
  `;
} else {
  document.title = `${product.nombre} | Mujeres en Transformación`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', product.descripcionCorta);
  breadcrumb.textContent = product.nombre;
  renderProduct(product);
  renderRelated(product);
}

let selectedVariant = null;
let currentImageIndex = 0;

function renderProduct(p) {
  const hasDiscount = p.precioAntes && p.precioAntes > p.precio;
  const discount = hasDiscount ? Math.round((1 - p.precio / p.precioAntes) * 100) : 0;
  const cat = CATEGORIAS.find(c => c.slug === p.categoria);

  content.innerHTML = `
    <div class="product-detail-grid">
      <!-- Galería -->
      <div class="product-gallery">
        <div class="gallery-main" id="galleryMain">
          ${p.imagenes.map((img, i) => `
            <button type="button" class="gallery-slide ${i === 0 ? 'active' : ''}" data-index="${i}" data-zoom="${img.src}" data-alt="${escapeAttr(img.alt || p.nombre)}" aria-label="Ampliar imagen ${i+1}">
              <picture>
                ${img.webp ? `<source srcset="${img.webp}" type="image/webp">` : ''}
                <img src="${img.src}" alt="${escapeAttr(img.alt || p.nombre)}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} />
              </picture>
              <span class="zoom-hint" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg>
              </span>
            </button>
          `).join('')}
        </div>
        ${p.imagenes.length > 1 ? `
        <div class="gallery-thumbs" role="tablist" aria-label="Miniaturas">
          ${p.imagenes.map((img, i) => `
            <button type="button" class="gallery-thumb ${i === 0 ? 'active' : ''}" data-thumb="${i}" role="tab" aria-selected="${i === 0}" aria-label="Imagen ${i+1}">
              <picture>
                ${img.webp ? `<source srcset="${img.webp}" type="image/webp">` : ''}
                <img src="${img.src}" alt="" loading="lazy" />
              </picture>
            </button>
          `).join('')}
        </div>` : ''}
      </div>

      <!-- Info -->
      <div class="product-info">
        ${cat ? `<a href="/tienda.html?cat=${cat.slug}" class="product-info-cat">${escapeHtml(cat.label)}</a>` : ''}
        <h1>${escapeHtml(p.nombre)}</h1>
        ${p.badge ? `<span class="product-badge product-badge--${badgeKind(p.badge)} inline">${escapeHtml(p.badge)}</span>` : ''}

        <div class="product-info-price">
          <span class="price-now">$ ${p.precio.toFixed(2)}</span>
          ${hasDiscount ? `
            <span class="price-before">$ ${p.precioAntes.toFixed(2)}</span>
            <span class="price-discount">Ahorra ${discount}%</span>
          ` : ''}
        </div>

        <p class="product-info-short">${escapeHtml(p.descripcionCorta)}</p>

        ${p.variantes ? renderVariants(p.variantes) : ''}

        <div class="product-info-qty">
          <label for="qtyInput">Cantidad</label>
          <div class="qty-stepper" role="group" aria-label="Cantidad">
            <button type="button" id="qtyDec" aria-label="Disminuir">−</button>
            <input type="number" id="qtyInput" value="1" min="1" max="${Math.min(p.stock, 99)}" />
            <button type="button" id="qtyInc" aria-label="Aumentar">+</button>
          </div>
          ${p.stock < 10 && p.stock > 0 ? `<span class="stock-warning">¡Solo quedan ${p.stock}!</span>` : ''}
        </div>

        <div class="product-info-actions">
          <button type="button" id="addToCartBtn" class="btn btn-primary btn-large" ${p.stock === 0 ? 'disabled' : ''}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h2l2.7 13.4A2 2 0 0 0 9.7 18h8.6a2 2 0 0 0 2-1.6L22 7H6"/><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/></svg>
            ${p.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
          </button>
          <button type="button" id="buyNowBtn" class="btn btn-ghost btn-large" ${p.stock === 0 ? 'disabled' : ''}>
            Comprar ahora
          </button>
        </div>

        <div class="product-info-perks">
          <div class="perk">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            <span>${p.digital ? 'Descarga inmediata tras el pago' : 'Envío a todo El Salvador'}</span>
          </div>
          <div class="perk">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Pago seguro con Visa & Mastercard</span>
          </div>
        </div>

        <!-- Tabs descripción / detalles -->
        <div class="product-tabs" role="tablist">
          <button type="button" class="tab active" data-tab="desc" role="tab" aria-selected="true">Descripción</button>
          <button type="button" class="tab" data-tab="features" role="tab" aria-selected="false">Características</button>
          <button type="button" class="tab" data-tab="shipping" role="tab" aria-selected="false">Envío</button>
        </div>
        <div class="product-tab-panel active" data-panel="desc">
          <div class="long-desc">${formatMultiline(p.descripcion)}</div>
        </div>
        <div class="product-tab-panel" data-panel="features" hidden>
          <ul class="check-list small">
            ${(p.caracteristicas || []).map(c => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
        <div class="product-tab-panel" data-panel="shipping" hidden>
          <p>${p.digital
            ? 'Este es un producto digital. Después de tu pago, recibirás un correo con el enlace de descarga inmediato.'
            : 'Hacemos envíos a los 14 departamentos de El Salvador. El tiempo estimado de entrega es de 2 a 5 días hábiles desde la confirmación del pago.'}
          </p>
          <p class="muted">Política completa de envíos y devoluciones disponible próximamente.</p>
        </div>
      </div>
    </div>
  `;

  bindHandlers(p);
}

function renderVariants(variantes) {
  return `
    <div class="product-variants">
      <label class="variants-label">${escapeHtml(variantes.label)}: <span id="variantValue" class="muted">Selecciona una opción</span></label>
      <div class="variant-options" role="radiogroup" aria-label="${escapeHtml(variantes.label)}">
        ${variantes.opciones.map(o => `
          <button type="button" class="variant-option ${variantes.tipo === 'color' ? 'variant-option--swatch' : 'variant-option--chip'}" data-variant="${escapeAttr(o.id)}" data-label="${escapeAttr(o.label)}" role="radio" aria-checked="false" aria-label="${escapeAttr(o.label)}">
            ${variantes.tipo === 'color' ? `<span class="swatch" style="background:${o.color}"></span>` : ''}
            <span class="variant-label">${escapeHtml(o.label)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function bindHandlers(p) {
  // Galería: thumbs
  $$('.gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.thumb, 10);
      setSlide(idx);
    });
  });
  // Galería: slides → abrir lightbox
  $$('.gallery-slide').forEach(slide => {
    slide.addEventListener('click', () => {
      const idx = parseInt(slide.dataset.index, 10);
      openLightboxAt(idx, p.imagenes);
    });
  });

  // Variantes
  $$('.variant-option').forEach(opt => {
    opt.addEventListener('click', () => {
      $$('.variant-option').forEach(o => { o.classList.remove('active'); o.setAttribute('aria-checked', 'false'); });
      opt.classList.add('active');
      opt.setAttribute('aria-checked', 'true');
      selectedVariant = opt.dataset.variant;
      const lbl = opt.dataset.label;
      const v = $('#variantValue');
      if (v) { v.textContent = lbl; v.classList.remove('muted'); }
    });
  });

  // Cantidad
  const qty = $('#qtyInput');
  $('#qtyDec')?.addEventListener('click', () => {
    qty.value = Math.max(1, parseInt(qty.value || 1) - 1);
  });
  $('#qtyInc')?.addEventListener('click', () => {
    qty.value = Math.min(parseInt(qty.max || 99), parseInt(qty.value || 1) + 1);
  });

  // Tabs
  $$('.product-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.product-tabs .tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const name = tab.dataset.tab;
      $$('.product-tab-panel').forEach(panel => {
        const active = panel.dataset.panel === name;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
    });
  });

  // Add to cart / Buy now
  $('#addToCartBtn')?.addEventListener('click', () => {
    if (p.variantes && !selectedVariant) {
      shakeVariants();
      return;
    }
    const q = parseInt(qty.value || 1, 10);
    addToCart(p.id, selectedVariant, q);
  });
  $('#buyNowBtn')?.addEventListener('click', () => {
    if (p.variantes && !selectedVariant) {
      shakeVariants();
      return;
    }
    const q = parseInt(qty.value || 1, 10);
    addToCart(p.id, selectedVariant, q);
    setTimeout(() => { window.location.href = '/carrito.html'; }, 400);
  });
}

function shakeVariants() {
  const box = $('.product-variants');
  if (!box) return;
  box.classList.remove('shake');
  void box.offsetWidth;
  box.classList.add('shake');
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setSlide(idx) {
  $$('.gallery-slide').forEach((s, i) => s.classList.toggle('active', i === idx));
  $$('.gallery-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
    t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
  });
  currentImageIndex = idx;
}

// ===== Lightbox local (galería de producto) =====
const lb = $('#lightbox');
const lbImg = $('#lightboxImage');
const lbCap = $('#lightboxCaption');
let currentImages = [];
let currentIdx = 0;

function openLightboxAt(i, imgs) {
  if (!lb) return;
  currentImages = imgs;
  currentIdx = i;
  paintLightbox();
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#lightboxClose')?.focus();
}
function paintLightbox() {
  const img = currentImages[currentIdx];
  if (!img) return;
  lbImg.src = img.src;
  lbImg.alt = img.alt || '';
  lbCap.textContent = img.alt || '';
}
function closeLightbox() {
  if (!lb) return;
  lb.hidden = true;
  document.body.style.overflow = '';
}
$('#lightboxClose')?.addEventListener('click', closeLightbox);
$('#lightboxPrev')?.addEventListener('click', () => {
  currentIdx = (currentIdx - 1 + currentImages.length) % currentImages.length;
  paintLightbox();
});
$('#lightboxNext')?.addEventListener('click', () => {
  currentIdx = (currentIdx + 1) % currentImages.length;
  paintLightbox();
});
lb?.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!lb || lb.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft')  { currentIdx = (currentIdx - 1 + currentImages.length) % currentImages.length; paintLightbox(); }
  if (e.key === 'ArrowRight') { currentIdx = (currentIdx + 1) % currentImages.length; paintLightbox(); }
});

// ===== Productos relacionados =====
function renderRelated(p) {
  const related = getRelacionados(p, 4);
  if (!related.length) return;
  const section = $('#relatedSection');
  const grid = $('#relatedGrid');
  section.hidden = false;
  grid.innerHTML = related.map(rp => {
    const img = rp.imagenes[0] || {};
    return `
      <article class="product-card">
        <a href="/producto.html?id=${encodeURIComponent(rp.id)}" class="product-card-link">
          <div class="product-card-image">
            <picture>
              ${img.webp ? `<source srcset="${img.webp}" type="image/webp">` : ''}
              <img src="${img.src}" alt="${escapeAttr(img.alt || rp.nombre)}" loading="lazy" />
            </picture>
            ${rp.badge ? `<span class="product-badge product-badge--${badgeKind(rp.badge)}">${escapeHtml(rp.badge)}</span>` : ''}
          </div>
          <div class="product-card-body">
            <h3>${escapeHtml(rp.nombre)}</h3>
            <span class="product-price">$ ${rp.precio.toFixed(2)}</span>
          </div>
        </a>
      </article>
    `;
  }).join('');
}

// Helpers
function badgeKind(label) {
  const l = label.toLowerCase();
  if (l.includes('oferta')) return 'sale';
  if (l.includes('nuevo'))  return 'new';
  if (l.includes('vendido'))return 'hot';
  if (l.includes('digital'))return 'digital';
  return 'default';
}
function formatMultiline(text) {
  return text.split(/\n\n+/).map(p => `<p>${escapeHtml(p)}</p>`).join('');
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
