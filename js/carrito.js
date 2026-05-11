// ===========================================
// Carrito (página completa de revisión)
// ===========================================
import { getProductoById } from './productos.js';
import { getCart, cartSize, cartSubtotal, updateQty, removeFromCart, onCartChange } from './cart.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const itemsBox      = $('#cartPageItems');
const emptyBox      = $('#cartEmptyFull');
const summaryBox    = $('#cartPageSummary');
const itemsCountEl  = $('#summaryItemsCount');
const subtotalEl    = $('#summarySubtotal');
const totalEl       = $('#summaryTotal');
const checkoutLink  = $('#checkoutLink');

function render() {
  const cart = getCart();
  if (cart.length === 0) {
    itemsBox.innerHTML = '';
    emptyBox.hidden = false;
    summaryBox.hidden = true;
    return;
  }
  emptyBox.hidden = true;
  summaryBox.hidden = false;

  itemsBox.innerHTML = cart.map(it => {
    const p = getProductoById(it.productId);
    if (!p) return '';
    const img = p.imagenes?.[0] || {};
    const variantLabel = it.variantId
      ? `<span class="cart-page-variant">${escapeHtml(p.variantes?.opciones.find(o => o.id === it.variantId)?.label || it.variantId)}</span>`
      : '';
    return `
      <article class="cart-page-item" data-pid="${escapeAttr(p.id)}" data-vid="${escapeAttr(it.variantId || '')}">
        <a href="/producto.html?id=${encodeURIComponent(p.id)}" class="cart-page-img">
          <picture>
            ${img.webp ? `<source srcset="${img.webp}" type="image/webp">` : ''}
            <img src="${img.src || ''}" alt="${escapeAttr(p.nombre)}" loading="lazy" />
          </picture>
        </a>
        <div class="cart-page-body">
          <h3><a href="/producto.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.nombre)}</a></h3>
          ${variantLabel}
          <p class="cart-page-unit-price">$ ${p.precio.toFixed(2)} <span class="muted">c/u</span></p>
        </div>
        <div class="cart-page-controls">
          <div class="qty-stepper" role="group" aria-label="Cantidad">
            <button type="button" data-action="dec" aria-label="Disminuir">−</button>
            <span aria-live="polite">${it.qty}</span>
            <button type="button" data-action="inc" aria-label="Aumentar">+</button>
          </div>
          <p class="cart-page-line-total">$ ${(p.precio * it.qty).toFixed(2)}</p>
          <button type="button" class="cart-page-remove" data-action="remove" aria-label="Quitar producto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            Quitar
          </button>
        </div>
      </article>
    `;
  }).join('');

  itemsCountEl.textContent = cartSize();
  const sub = cartSubtotal();
  subtotalEl.textContent = `$ ${sub.toFixed(2)}`;
  totalEl.textContent    = `$ ${sub.toFixed(2)}`;
}

itemsBox?.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const card = btn.closest('[data-pid]');
  const pid = card.dataset.pid;
  const vid = card.dataset.vid || null;
  const item = getCart().find(x => x.productId === pid && (x.variantId || '') === (vid || ''));
  if (!item) return;
  if (btn.dataset.action === 'inc') updateQty(pid, vid, item.qty + 1);
  else if (btn.dataset.action === 'dec') updateQty(pid, vid, item.qty - 1);
  else if (btn.dataset.action === 'remove') {
    card.classList.add('removing');
    setTimeout(() => removeFromCart(pid, vid), 250);
  }
});

onCartChange(render);
render();

// Helpers
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
