import { test, expect } from '@playwright/test';

// Captura errores de consola/página y falla si hay errores severos.
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return errors;
}
// Ignora ruidos no relacionados (favicon, fuentes, etc.)
const ignore = t => /favicon|net::ERR|Failed to load resource/i.test(t);

// En móvil el nav (theme toggle + cart) está dentro del menú hamburguesa:
// hay que abrirlo antes de interactuar con sus controles.
async function ensureNavOpen(page) {
  const toggle = page.locator('#menuToggle');
  if (await toggle.isVisible() && !(await page.locator('#mainNav').evaluate(n => n.classList.contains('open')))) {
    await toggle.click();
  }
}

test.describe('Componentización del chrome', () => {
  test('home: header/footer/overlays inyectados, sin errores', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/index.html');
    // met-header inyecta nav con link a Tienda
    await expect(page.locator('header.site-header')).toBeVisible();
    await expect(page.locator('#mainNav a', { hasText: 'Tienda' })).toHaveCount(1);
    // theme toggle presente
    await expect(page.locator('#themeToggle')).toBeVisible();
    // footer + social inyectados por met-footer
    await expect(page.locator('footer.site-footer .social a')).toHaveCount(3);
    // wa-float inyectado por met-chrome
    await expect(page.locator('.wa-float')).toHaveCount(1);
    expect(errors.filter(e => !ignore(e))).toEqual([]);
  });

  test('theme toggle aplica y persiste entre páginas', async ({ page }) => {
    await page.goto('/index.html');
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    await ensureNavOpen(page);
    await page.locator('#themeToggle').click();
    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before);
    // navega a tienda → el tema persiste (lo aplica components.js en <head>)
    await page.goto('/tienda.html');
    expect(await page.locator('html').getAttribute('data-theme')).toBe(after);
  });

  test('producto: theme toggle funciona (antes estaba muerto)', async ({ page }) => {
    await page.goto('/producto.html?id=cuaderno-suenos');
    const before = await page.locator('html').getAttribute('data-theme');
    await ensureNavOpen(page);
    await page.locator('#themeToggle').click();
    expect(await page.locator('html').getAttribute('data-theme')).not.toBe(before);
  });

  test('páginas minimal cargan con componente y sin errores', async ({ page }) => {
    for (const p of ['/gracias.html', '/pago-cancelado.html', '/404.html']) {
      const errors = trackErrors(page);
      await page.goto(p);
      await expect(page.locator('.thanks-card').first()).toBeVisible();
      expect(errors.filter(e => !ignore(e))).toEqual([]);
    }
  });
});

test.describe('Tienda + carrito', () => {
  test('catálogo renderiza tarjetas y busca', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/tienda.html');
    await expect(page.locator('.product-card').first()).toBeVisible();
    const total = await page.locator('.product-card').count();
    expect(total).toBeGreaterThanOrEqual(6);
    await page.fill('#searchInput', 'cuaderno');
    await page.waitForTimeout(300);
    const filtered = await page.locator('.product-card').count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThanOrEqual(total);
    expect(errors.filter(e => !ignore(e))).toEqual([]);
  });

  test('cart drawer abre desde el header', async ({ page }) => {
    await page.goto('/tienda.html');
    await expect(page.locator('#cartDrawer')).toBeHidden();
    await ensureNavOpen(page);
    await page.locator('#cartButton').click();
    await expect(page.locator('#cartDrawer')).toBeVisible();
    await page.locator('#cartClose').click();
    await expect(page.locator('#cartDrawer')).toBeHidden();
  });

  test('agregar producto simple incrementa el badge', async ({ page }) => {
    await page.goto('/tienda.html');
    // un producto sin variantes muestra "Agregar"; con variantes "Ver opciones"
    const addBtn = page.locator('.product-add', { hasText: 'Agregar' }).first();
    await addBtn.click();
    await expect(page.locator('#cartBadge')).toHaveText(/[1-9]/);
  });

  test('flujo producto → agregar → carrito → checkout', async ({ page }) => {
    await page.goto('/producto.html?id=cuaderno-suenos');
    await expect(page.locator('#productContent h1')).toContainText('Cuaderno de mis Sueños');
    await page.locator('#addToCartBtn').click();
    await expect(page.locator('#cartBadge')).toHaveText(/[1-9]/);
    // ir al carrito
    await page.goto('/carrito.html');
    await expect(page.locator('.cart-page-item').first()).toBeVisible();
    const subtotal = await page.locator('#summarySubtotal').textContent();
    expect(subtotal).toMatch(/\$\s*[1-9]/);
    // ir al checkout (lee del carrito)
    await page.goto('/checkout.html');
    await expect(page.locator('#orderItems .order-item').first()).toBeVisible();
    await expect(page.locator('#submitBtn')).toBeEnabled();
  });

  test('checkout con carrito vacío bloquea el submit', async ({ page }) => {
    await page.goto('/checkout.html');
    // sin agregar nada, el carrito está vacío
    await expect(page.locator('#orderEmptyState')).toBeVisible();
    await expect(page.locator('#submitBtn')).toBeDisabled();
  });

  test('validación en vivo del formulario de checkout', async ({ page }) => {
    // primero agregamos algo para habilitar el form
    await page.goto('/producto.html?id=cuaderno-suenos');
    await page.locator('#addToCartBtn').click();
    await page.goto('/checkout.html');
    const email = page.locator('input[name="email"]');
    await email.fill('no-es-email');
    await email.blur();
    await expect(page.locator('input[name="email"].is-invalid')).toHaveCount(1);
    await email.fill('valida@correo.com');
    await email.blur();
    await expect(page.locator('input[name="email"].is-valid')).toHaveCount(1);
  });
});

test.describe('Menú móvil', () => {
  test.use({ viewport: { width: 390, height: 800 } });
  test('el botón hamburguesa abre/cierra el nav', async ({ page }) => {
    await page.goto('/tienda.html');
    const nav = page.locator('#mainNav');
    await expect(page.locator('#menuToggle')).toBeVisible();
    await expect(nav).not.toHaveClass(/open/);
    await page.locator('#menuToggle').click();
    await expect(nav).toHaveClass(/open/);
  });
});
