// Checkout - integración con /api/n1co/checkout (Vercel Serverless)
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

  // ===== Pinta el resumen =====
  const subtotal = PRODUCT.price;
  const shipping = SHIPPING_FLAT;
  const total = subtotal + shipping;
  document.getElementById('subtotal').textContent = `$ ${subtotal.toFixed(2)}`;
  document.getElementById('shipping').textContent = `$ ${shipping.toFixed(2)}`;
  document.getElementById('total').textContent = `$ ${total.toFixed(2)}`;

  // ===== Año footer =====
  const yEl = document.getElementById('year');
  if (yEl) yEl.textContent = new Date().getFullYear();

  // ===== Submit del formulario =====
  const form = document.getElementById('checkoutForm');
  const errorBox = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    if (!form.checkValidity()) {
      form.reportValidity();
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

      // Guardamos referencia en sessionStorage para mostrarla luego
      sessionStorage.setItem('lastOrderCode', result.orderCode || '');

      // Redirige al checkout de n1co
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
