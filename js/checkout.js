// =====================================================
// Checkout (módulo ES)
//
// - Lee los items del carrito (cart.js) y los renderiza
// - Recalcula subtotal en tiempo real
// - Validación en vivo, auto-formato teléfono, draft en localStorage
// - Envía items[] al endpoint serverless /api/n1co/checkout
//   (los precios se recomputan server-side, no se confía en el cliente)
// =====================================================
import { getCart, cartSize, cartSubtotal, onCartChange } from './cart.js';
import { getProductoById } from './productos.js';

'use strict';

const SHIPPING_FLAT = 4.00;          // ← ajustar cuando el cliente confirme
const STORAGE_KEY   = 'met-checkout-draft';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// ===== Refs =====
const form         = $('#checkoutForm');
const errorBox     = $('#formError');
const submitBtn    = $('#submitBtn');
const btnText      = submitBtn?.querySelector('.btn-text');
const btnSpinner   = submitBtn?.querySelector('.btn-spinner');
const orderList    = $('#orderItems');           // contenedor de items (lo creamos en HTML)
const subtotalEl   = $('#subtotal');
const shippingEl   = $('#shipping');
const totalEl      = $('#total');
const emptyState   = $('#orderEmptyState');      // bloque "carrito vacío"

// ===== Año footer =====
const yEl = $('#year');
if (yEl) yEl.textContent = new Date().getFullYear();

// ====================================================
// Render del resumen del pedido (items + totales)
// ====================================================
function renderOrderSummary() {
  const cart = getCart();

  // Estado vacío → bloquear submit y mostrar mensaje
  if (cart.length === 0) {
    if (orderList) orderList.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    if (subtotalEl) subtotalEl.textContent = '$ 0.00';
    if (shippingEl) shippingEl.textContent = '$ 0.00';
    if (totalEl)    totalEl.textContent    = '$ 0.00';
    if (submitBtn) {
      submitBtn.disabled = true;
      if (btnText) btnText.textContent = 'Tu carrito está vacío';
    }
    return;
  }

  if (emptyState) emptyState.hidden = true;
  if (submitBtn) {
    submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'Continuar al pago';
  }

  // Render de items
  if (orderList) {
    orderList.innerHTML = cart.map(it => {
      const p = getProductoById(it.productId);
      if (!p) return '';
      const img = p.imagenes?.[0] || {};
      const variantLabel = it.variantId
        ? `<span class="muted variant-tag">${escapeHtml(
            p.variantes?.opciones.find(o => o.id === it.variantId)?.label || it.variantId
          )}</span>`
        : '';
      const lineTotal = (p.precio * it.qty).toFixed(2);
      return `
        <div class="order-item">
          <picture>
            ${img.webp ? `<source srcset="${img.webp}" type="image/webp">` : ''}
            <img src="${img.src || ''}" alt="${escapeAttr(p.nombre)}" loading="lazy" />
          </picture>
          <div class="order-item-body">
            <h3>${escapeHtml(p.nombre)}</h3>
            ${variantLabel}
            <p class="qty">Cantidad: ${it.qty} · $ ${p.precio.toFixed(2)} c/u</p>
          </div>
          <div class="order-item-total">$ ${lineTotal}</div>
        </div>
      `;
    }).join('');
  }

  // Totales
  const subtotal = cartSubtotal();
  const shipping = SHIPPING_FLAT;
  const total = subtotal + shipping;
  if (subtotalEl) subtotalEl.textContent = `$ ${subtotal.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = `$ ${shipping.toFixed(2)}`;
  if (totalEl)    totalEl.textContent    = `$ ${total.toFixed(2)}`;
}

// Re-render si el carrito cambia en otra pestaña
onCartChange(renderOrderSummary);
renderOrderSummary();

// ====================================================
// Form (validación + draft + submit)
// ====================================================
if (form) {
  // ----- Auto-formato de teléfono -----
  const phoneInput = form.querySelector('input[name="phone"]');
  function formatPhone(value) {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('503')) digits = digits.slice(0, 11);
    else digits = digits.slice(0, 8);
    if (!digits) return '';
    if (digits.startsWith('503')) {
      const local = digits.slice(3);
      if (local.length <= 4) return `+503 ${local}`;
      return `+503 ${local.slice(0, 4)}-${local.slice(4)}`;
    }
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  if (phoneInput) {
    phoneInput.addEventListener('input', e => {
      const cursor = e.target.selectionStart;
      const beforeLen = e.target.value.length;
      e.target.value = formatPhone(e.target.value);
      const afterLen = e.target.value.length;
      try { e.target.setSelectionRange(cursor + (afterLen - beforeLen), cursor + (afterLen - beforeLen)); } catch {}
      liveValidate(phoneInput);
    });
    phoneInput.addEventListener('blur', () => {
      if (phoneInput.value && !phoneInput.value.startsWith('+')) {
        phoneInput.value = formatPhone('503' + phoneInput.value.replace(/\D/g, ''));
      }
      liveValidate(phoneInput);
    });
  }

  // ----- Validadores -----
  const validators = {
    fullName:   v => v.trim().length >= 3 || 'Escribe tu nombre completo (mínimo 3 letras)',
    email:      v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email inválido',
    phone:      v => v.replace(/\D/g, '').length >= 8 || 'Teléfono incompleto',
    department: v => v.trim() !== '' || 'Selecciona un departamento',
    city:       v => v.trim().length >= 2 || 'Escribe tu ciudad',
    address:    v => v.trim().length >= 8 || 'Escribe una dirección completa'
  };
  function liveValidate(field) {
    const name = field.name;
    if (!validators[name]) return true;
    const result = validators[name](field.value);
    const valid = result === true;
    const wrapper = field.closest('label') || field.parentElement;
    field.classList.toggle('is-valid',   valid && field.value !== '');
    field.classList.toggle('is-invalid', !valid && field.value !== '');
    let msg = wrapper.querySelector('.field-msg');
    if (!valid && field.value !== '') {
      if (!msg) {
        msg = document.createElement('span');
        msg.className = 'field-msg';
        wrapper.appendChild(msg);
      }
      msg.textContent = result;
    } else if (msg) {
      msg.remove();
    }
    return valid;
  }
  $$('input, select, textarea', form).forEach(f => {
    if (validators[f.name]) {
      f.addEventListener('input', () => liveValidate(f));
      f.addEventListener('blur',  () => liveValidate(f));
    }
  });

  // ----- Draft en localStorage -----
  function saveDraft() {
    const data = Object.fromEntries(new FormData(form).entries());
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      Object.entries(data).forEach(([k, v]) => {
        const field = form.elements.namedItem(k);
        if (field && typeof v === 'string') field.value = v;
      });
    } catch {}
  }
  function clearDraft() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }
  loadDraft();
  let saveTimer = null;
  form.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 400);
  });

  // ----- Aviso al salir si tiene datos sin enviar -----
  let isDirty = false;
  form.addEventListener('input', () => { isDirty = true; });
  window.addEventListener('beforeunload', e => {
    if (isDirty && !submitBtn.disabled) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ----- ETA por departamento -----
  const deptField = form.elements.namedItem('department');
  if (deptField) {
    const eta = {
      'San Salvador': '1 a 2 días hábiles',
      'La Libertad':  '1 a 2 días hábiles',
      'Santa Ana':    '2 a 3 días hábiles',
      'Sonsonate':    '2 a 3 días hábiles',
      'San Miguel':   '2 a 4 días hábiles',
      'La Paz':       '2 a 3 días hábiles',
      'Usulután':     '3 a 4 días hábiles',
      'Ahuachapán':   '2 a 3 días hábiles'
    };
    const etaBox = document.createElement('p');
    etaBox.className = 'eta-hint';
    etaBox.hidden = true;
    deptField.closest('label').appendChild(etaBox);
    deptField.addEventListener('change', () => {
      const d = deptField.value;
      const t = eta[d] || '3 a 5 días hábiles';
      if (d) {
        etaBox.innerHTML = `📦 Tiempo estimado de entrega: <strong>${t}</strong>`;
        etaBox.hidden = false;
      } else {
        etaBox.hidden = true;
      }
    });
  }

  // ----- UI helpers -----
  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (btnText) btnText.hidden = loading;
    if (btnSpinner) btnSpinner.hidden = !loading;
  }
  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function hideError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  // ----- Submit -----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    // Verifica carrito
    const cart = getCart();
    if (cart.length === 0) {
      showError('Tu carrito está vacío. Agrega productos antes de continuar.');
      return;
    }

    // Validación completa (engancha live + lo nuestro)
    let allValid = true;
    $$('input, select, textarea', form).forEach(f => {
      if (validators[f.name]) {
        const ok = liveValidate(f);
        if (!ok || !f.value) allValid = false;
      }
    });
    if (!allValid) {
      showError('Revisa los campos marcados en rojo.');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    setLoading(true);

    try {
      const res = await fetch('/api/n1co/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone
          },
          shipping: {
            department: data.department,
            city: data.city,
            address: data.address,
            notes: data.notes || ''
          },
          // Solo enviamos IDs y cantidades — el server recomputa precios
          items: cart.map(it => ({
            productId: it.productId,
            variantId: it.variantId || null,
            quantity:  it.qty
          }))
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let msg = `Error ${res.status}`;
        try { msg = JSON.parse(errText).error || msg; } catch {}
        throw new Error(msg);
      }

      const result = await res.json();
      if (!result.paymentLinkUrl) {
        throw new Error('No se obtuvo el link de pago. Intenta de nuevo.');
      }

      sessionStorage.setItem('lastOrderCode', result.orderCode || result.orderReference || '');
      clearDraft();
      isDirty = false;

      window.location.href = result.paymentLinkUrl;
    } catch (err) {
      setLoading(false);
      showError(
        'No pudimos procesar tu pedido en este momento. ' +
        'Por favor escríbenos por WhatsApp y con gusto te ayudamos. ' +
        '(Detalle: ' + (err.message || 'desconocido') + ')'
      );
    }
  });
}

// ===== Helpers =====
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
