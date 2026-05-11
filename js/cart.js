// ============================================
// Cart module - estado compartido + UI (drawer)
// ============================================
import { PRODUCTOS, getProductoById } from './productos.js';

const STORAGE_KEY = 'met-cart-v1';
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// ===== State =====
let cart = loadCart();

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}
function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  notify();
}

const listeners = new Set();
function notify() {
  listeners.forEach(fn => fn(cart));
  // notifica a otras pestañas
  window.dispatchEvent(new CustomEvent('cart:change', { detail: cart }));
}
export function onCartChange(fn) {
  listeners.add(fn);
  fn(cart);
  return () => listeners.delete(fn);
}

// ===== Public API =====
export function getCart() { return cart.slice(); }

export function cartSize() {
  return cart.reduce((sum, it) => sum + it.qty, 0);
}

export function cartSubtotal() {
  return cart.reduce((sum, it) => {
    const p = getProductoById(it.productId);
    if (!p) return sum;
    return sum + p.precio * it.qty;
  }, 0);
}

export function addToCart(productId, variantId = null, qty = 1) {
  const p = getProductoById(productId);
  if (!p) return false;
  const key = variantKey(productId, variantId);
  const existing = cart.find(it => variantKey(it.productId, it.variantId) === key);
  if (existing) {
    existing.qty = Math.min(99, existing.qty + qty);
  } else {
    cart.push({ productId, variantId, qty });
  }
  saveCart();
  toast(`${p.nombre} agregado al carrito`, 'success');
  bumpBadge();
  return true;
}

export function updateQty(productId, variantId, qty) {
  const key = variantKey(productId, variantId);
  const it = cart.find(it => variantKey(it.productId, it.variantId) === key);
  if (!it) return;
  if (qty <= 0) {
    removeFromCart(productId, variantId);
    return;
  }
  it.qty = Math.min(99, qty);
  saveCart();
}

export function removeFromCart(productId, variantId) {
  const key = variantKey(productId, variantId);
  cart = cart.filter(it => variantKey(it.productId, it.variantId) !== key);
  saveCart();
}

export function clearCart() {
  cart = [];
  saveCart();
}

function variantKey(productId, variantId) {
  return `${productId}::${variantId || ''}`;
}

// ===== Drawer UI =====
const drawer = $('#cartDrawer');
const overlay = $('#cartOverlay');
const closeBtn = $('#cartClose');
const openBtn = $('#cartButton');
const continueBtn = $('#continueShopping');
let prevFocus = null;

function openDrawer() {
  if (!drawer) return;
  prevFocus = document.activeElement;
  drawer.hidden = false;
  // pequeño delay para activar la transición
  requestAnimationFrame(() => drawer.classList.add('open'));
  document.body.style.overflow = 'hidden';
  closeBtn?.focus();
}
function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove('open');
  setTimeout(() => { drawer.hidden = true; }, 300);
  document.body.style.overflow = '';
  if (prevFocus) prevFocus.focus();
}
openBtn?.addEventListener('click', openDrawer);
closeBtn?.addEventListener('click', closeDrawer);
overlay?.addEventListener('click', closeDrawer);
continueBtn?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && drawer && !drawer.hidden) closeDrawer();
});

// ===== Badge =====
const badge = $('#cartBadge');
function bumpBadge() {
  if (!badge) return;
  badge.classList.remove('bump');
  void badge.offsetWidth; // reflow
  badge.classList.add('bump');
}

function renderBadge() {
  if (!badge) return;
  const n = cartSize();
  badge.textContent = String(n);
  badge.hidden = n === 0;
}

// ===== Drawer items render =====
const itemsBox = $('#cartItems');
const emptyBox = $('#cartEmpty');
const footBox  = $('#cartFoot');
const subtotalEl = $('#cartSubtotal');

function renderDrawer() {
  if (!itemsBox) return;
  if (cart.length === 0) {
    itemsBox.innerHTML = '';
    if (emptyBox) emptyBox.hidden = false;
    if (footBox) footBox.hidden = true;
    return;
  }
  if (emptyBox) emptyBox.hidden = true;
  if (footBox) footBox.hidden = false;

  itemsBox.innerHTML = cart.map(it => {
    const p = getProductoById(it.productId);
    if (!p) return '';
    const img = p.imagenes?.[0] || {};
    const variantLabel = it.variantId
      ? `<span class="cart-item-variant">${escapeHtml(p.variantes?.opciones.find(o => o.id === it.variantId)?.label || it.variantId)}</span>`
      : '';
    return `
      <article class="cart-item" data-pid="${escapeAttr(p.id)}" data-vid="${escapeAttr(it.variantId || '')}">
        <picture>
          ${img.webp ? `<source srcset="${img.webp}" type="image/webp">` : ''}
          <img src="${img.src || ''}" alt="${escapeAttr(p.nombre)}" loading="lazy" />
        </picture>
        <div class="cart-item-info">
          <h3><a href="/producto.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.nombre)}</a></h3>
          ${variantLabel}
          <div class="cart-item-controls">
            <div class="qty-stepper" role="group" aria-label="Cantidad">
              <button type="button" data-action="dec" aria-label="Disminuir">−</button>
              <span aria-live="polite">${it.qty}</span>
              <button type="button" data-action="inc" aria-label="Aumentar">+</button>
            </div>
            <button type="button" class="cart-item-remove" data-action="remove" aria-label="Quitar producto">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
        <div class="cart-item-price">$ ${(p.precio * it.qty).toFixed(2)}</div>
      </article>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.textContent = `$ ${cartSubtotal().toFixed(2)}`;
}

// Click delegation en items del drawer
itemsBox?.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const card = btn.closest('[data-pid]');
  const pid = card.dataset.pid;
  const vid = card.dataset.vid || null;
  const it = cart.find(x => x.productId === pid && (x.variantId || '') === (vid || ''));
  if (!it) return;
  const action = btn.dataset.action;
  if (action === 'inc') updateQty(pid, vid, it.qty + 1);
  else if (action === 'dec') updateQty(pid, vid, it.qty - 1);
  else if (action === 'remove') removeFromCart(pid, vid);
});

// Sync entre pestañas
window.addEventListener('storage', e => {
  if (e.key === STORAGE_KEY) {
    cart = loadCart();
    notify();
  }
});

onCartChange(() => {
  renderBadge();
  renderDrawer();
});

// ===== Toast =====
export function toast(message, type = 'info') {
  const container = $('#toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${type === 'success' ? '✓' : 'ℹ'}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
    <a href="/carrito.html" class="toast-link">Ver carrito</a>
  `;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

// Helpers
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

// Init year footer si existe
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
