// =====================================================
// Checkout - integración con /api/n1co/checkout (Vercel)
// + validación en vivo, auto-formato teléfono, localStorage
// =====================================================
(function () {
  'use strict';

  // Precio del producto. Idealmente se obtiene de un config server-side;
  // aquí va como fallback para mostrar el resumen. El backend valida el monto real.
  const PRODUCT = {
    name: 'Cuaderno de mis Sueños',
    sku: 'CMS-MET-001',
    price: 25.00,    // ← CAMBIAR cuando el cliente confirme precio
    image: 'images/cuaderno-portada.png'
  };
  const SHIPPING_FLAT = 4.00; // ← CAMBIAR según política de envío
  const STORAGE_KEY = 'met-checkout-draft';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ===== Pinta el resumen =====
  const subtotal = PRODUCT.price;
  const shipping = SHIPPING_FLAT;
  const total = subtotal + shipping;
  $('#subtotal').textContent = `$ ${subtotal.toFixed(2)}`;
  $('#shipping').textContent = `$ ${shipping.toFixed(2)}`;
  $('#total').textContent    = `$ ${total.toFixed(2)}`;

  // ===== Año footer =====
  const yEl = $('#year');
  if (yEl) yEl.textContent = new Date().getFullYear();

  // ===== Form refs =====
  const form       = $('#checkoutForm');
  const errorBox   = $('#formError');
  const submitBtn  = $('#submitBtn');
  const btnText    = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  // ===== Auto-formato de teléfono =====
  const phoneInput = form.querySelector('input[name="phone"]');
  function formatPhone(value) {
    // Solo dígitos, máximo 11 (+503 + 8 dígitos)
    let digits = value.replace(/\D/g, '');
    // Si no empieza con 503 y el largo es <=8, asumimos local SV → prepend 503
    if (!digits.startsWith('503') && digits.length <= 8) {
      // permitir que escriba sin el 503 inicialmente, lo agregamos al validar
    }
    if (digits.startsWith('503')) digits = digits.slice(0, 11);
    else digits = digits.slice(0, 8);

    if (!digits) return '';
    if (digits.startsWith('503')) {
      const local = digits.slice(3);
      if (local.length <= 4) return `+503 ${local}`;
      return `+503 ${local.slice(0, 4)}-${local.slice(4)}`;
    }
    // local sin código país
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  if (phoneInput) {
    phoneInput.addEventListener('input', e => {
      const cursor = e.target.selectionStart;
      const beforeLen = e.target.value.length;
      e.target.value = formatPhone(e.target.value);
      const afterLen = e.target.value.length;
      // ajuste sencillo del cursor
      try { e.target.setSelectionRange(cursor + (afterLen - beforeLen), cursor + (afterLen - beforeLen)); } catch {}
      liveValidate(phoneInput);
    });
    phoneInput.addEventListener('blur', () => {
      // Si quedó sin código país, lo agregamos
      if (phoneInput.value && !phoneInput.value.startsWith('+')) {
        phoneInput.value = formatPhone('503' + phoneInput.value.replace(/\D/g, ''));
      }
      liveValidate(phoneInput);
    });
  }

  // ===== Validadores =====
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
    field.classList.toggle('is-valid', valid && field.value !== '');
    field.classList.toggle('is-invalid', !valid && field.value !== '');
    // mensaje
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

  // Engancha live validation en todos los campos
  $$('input, select, textarea', form).forEach(f => {
    if (validators[f.name]) {
      f.addEventListener('input', () => liveValidate(f));
      f.addEventListener('blur',  () => liveValidate(f));
    }
  });

  // ===== localStorage: persistir borrador =====
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
  function clearDraft() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
  loadDraft();
  let saveTimer = null;
  form.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 400);
  });

  // Aviso al salir si tiene datos sin enviar
  let isDirty = false;
  form.addEventListener('input', () => { isDirty = true; });
  window.addEventListener('beforeunload', e => {
    if (isDirty && !submitBtn.disabled) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ===== Estimador de tiempo de entrega =====
  const deptField = form.elements.namedItem('department');
  if (deptField) {
    // Estimaciones aproximadas (placeholder hasta que el cliente confirme)
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

  // ===== UI helpers =====
  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.hidden = loading;
    btnSpinner.hidden = !loading;
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

  // ===== Submit =====
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    // Validación completa
    let allValid = true;
    $$('input, select, textarea', form).forEach(f => {
      if (validators[f.name]) {
        if (!liveValidate(f)) allValid = false;
        if (f.value === '' && f.required) {
          f.classList.add('is-invalid');
          allValid = false;
        }
      }
    });
    if (!allValid) {
      showError('Por favor revisa los campos marcados en rojo antes de continuar.');
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
          item: {
            sku: PRODUCT.sku,
            name: PRODUCT.name,
            quantity: 1
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Error ${res.status}`);
      }

      const result = await res.json();
      if (!result.paymentLinkUrl) {
        throw new Error('No se obtuvo el link de pago. Intenta de nuevo.');
      }

      // Limpiar borrador y desactivar advertencia de salida
      clearDraft();
      isDirty = false;
      sessionStorage.setItem('lastOrderCode', result.orderCode || '');

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
})();
