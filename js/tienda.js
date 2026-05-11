// ===========================================
// Tienda (catálogo) - filtros, búsqueda, sort
// ===========================================
import { PRODUCTOS, CATEGORIAS, getPorCategoria } from './productos.js';
import { addToCart } from './cart.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const state = {
  category: getInitialCategory(),
  query: '',
  sort: 'destacados'
};

function getInitialCategory() {
  const params = new URLSearchParams(location.search);
  return params.get('cat') || 'todos';
}

// ===== Render filtros =====
const categoryList = $('#categoryList');
function renderCategories() {
  const items = [
    { slug: 'todos', label: 'Todos los productos', count: PRODUCTOS.length },
    ...CATEGORIAS.map(c => ({
      ...c,
      count: PRODUCTOS.filter(p => p.categoria === c.slug).length
    }))
  ];
  categoryList.innerHTML = items.map(c => `
    <li>
      <button type="button" data-cat="${c.slug}" class="${state.category === c.slug ? 'active' : ''}">
        <span>${c.label}</span>
        <span class="filter-count">${c.count}</span>
      </button>
    </li>
  `).join('');
}

categoryList?.addEventListener('click', e => {
  const btn = e.target.closest('button[data-cat]');
  if (!btn) return;
  state.category = btn.dataset.cat;
  history.replaceState({}, '', state.category === 'todos' ? '/tienda.html' : `/tienda.html?cat=${state.category}`);
  renderCategories();
  renderProducts();
});

$('#clearFilters')?.addEventListener('click', () => {
  state.category = 'todos';
  state.query = '';
  state.sort = 'destacados';
  const search = $('#searchInput');
  if (search) search.value = '';
  const sort = $('#sortSelect');
  if (sort) sort.value = 'destacados';
  history.replaceState({}, '', '/tienda.html');
  renderCategories();
  renderProducts();
});

// ===== Búsqueda en vivo =====
const searchInput = $('#searchInput');
let searchTimer = null;
searchInput?.addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = e.target.value.trim().toLowerCase();
    renderProducts();
  }, 180);
});

// ===== Sort =====
$('#sortSelect')?.addEventListener('change', e => {
  state.sort = e.target.value;
  renderProducts();
});

// ===== Render productos =====
const grid = $('#productGrid');
const noResults = $('#noResults');
const resultsCount = $('#resultsCount');

function filteredProducts() {
  let list = getPorCategoria(state.category);
  if (state.query) {
    list = list.filter(p =>
      p.nombre.toLowerCase().includes(state.query) ||
      p.descripcionCorta.toLowerCase().includes(state.query) ||
      (p.etiquetas || []).some(t => t.toLowerCase().includes(state.query))
    );
  }
  switch (state.sort) {
    case 'precio-asc':  list = list.slice().sort((a,b) => a.precio - b.precio); break;
    case 'precio-desc': list = list.slice().sort((a,b) => b.precio - a.precio); break;
    case 'nombre':      list = list.slice().sort((a,b) => a.nombre.localeCompare(b.nombre)); break;
    // destacados: orden natural del array
  }
  return list;
}

function renderProducts() {
  const list = filteredProducts();
  if (list.length === 0) {
    grid.innerHTML = '';
    noResults.hidden = false;
    resultsCount.textContent = '0 productos';
    return;
  }
  noResults.hidden = true;
  resultsCount.textContent = `${list.length} producto${list.length === 1 ? '' : 's'}`;

  grid.innerHTML = list.map(productCardHTML).join('');
  // Animar entrada en cascada
  $$('.product-card', grid).forEach((c, i) => {
    c.style.animationDelay = `${Math.min(i * 50, 600)}ms`;
  });
  bindCardActions();
}

function productCardHTML(p) {
  const img = p.imagenes[0] || {};
  const hasDiscount = p.precioAntes && p.precioAntes > p.precio;
  const discount = hasDiscount ? Math.round((1 - p.precio / p.precioAntes) * 100) : 0;
  return `
    <article class="product-card" data-pid="${escapeAttr(p.id)}">
      <a href="/producto.html?id=${encodeURIComponent(p.id)}" class="product-card-link" aria-label="Ver detalle de ${escapeAttr(p.nombre)}">
        <div class="product-card-image">
          <picture>
            ${img.webp ? `<source srcset="${img.webp}" type="image/webp">` : ''}
            <img src="${img.src}" alt="${escapeAttr(img.alt || p.nombre)}" loading="lazy" />
          </picture>
          ${p.badge ? `<span class="product-badge product-badge--${badgeKind(p.badge)}">${escapeHtml(p.badge)}</span>` : ''}
          ${hasDiscount ? `<span class="product-badge product-badge--discount">-${discount}%</span>` : ''}
        </div>
        <div class="product-card-body">
          <p class="product-cat">${categoryLabel(p.categoria)}</p>
          <h3>${escapeHtml(p.nombre)}</h3>
          <p class="product-desc">${escapeHtml(p.descripcionCorta)}</p>
          <div class="product-price-row">
            <span class="product-price">$ ${p.precio.toFixed(2)}</span>
            ${hasDiscount ? `<span class="product-price-before">$ ${p.precioAntes.toFixed(2)}</span>` : ''}
          </div>
        </div>
      </a>
      <button type="button" class="product-add" data-add="${escapeAttr(p.id)}" ${p.variantes ? 'data-has-variants="true"' : ''} aria-label="Agregar ${escapeAttr(p.nombre)} al carrito">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        <span>${p.variantes ? 'Ver opciones' : 'Agregar'}</span>
      </button>
    </article>
  `;
}

function bindCardActions() {
  $$('.product-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const pid = btn.dataset.add;
      const product = PRODUCTOS.find(x => x.id === pid);
      if (!product) return;
      if (product.variantes) {
        // Si tiene variantes, llevamos a la página de detalle
        location.href = `/producto.html?id=${encodeURIComponent(pid)}`;
        return;
      }
      addToCart(pid);
      animateFlyToCart(btn);
    });
  });
}

// Animación: el botón "salta" hacia el carrito
function animateFlyToCart(btn) {
  const cartIcon = $('#cartButton');
  if (!cartIcon || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const b = btn.getBoundingClientRect();
  const c = cartIcon.getBoundingClientRect();
  const ghost = document.createElement('span');
  ghost.className = 'fly-ghost';
  ghost.style.left = b.left + b.width / 2 + 'px';
  ghost.style.top  = b.top  + b.height / 2 + 'px';
  document.body.appendChild(ghost);
  requestAnimationFrame(() => {
    ghost.style.left = c.left + c.width / 2 + 'px';
    ghost.style.top  = c.top  + c.height / 2 + 'px';
    ghost.style.transform = 'translate(-50%, -50%) scale(0.3)';
    ghost.style.opacity = '0';
  });
  setTimeout(() => ghost.remove(), 700);
}

function badgeKind(label) {
  const l = label.toLowerCase();
  if (l.includes('oferta'))     return 'sale';
  if (l.includes('nuevo'))      return 'new';
  if (l.includes('vendido'))    return 'hot';
  if (l.includes('digital'))    return 'digital';
  return 'default';
}
function categoryLabel(slug) {
  return CATEGORIAS.find(c => c.slug === slug)?.label || slug;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

// Sync sort/search UI con state inicial
if ($('#sortSelect'))   $('#sortSelect').value = state.sort;
if ($('#searchInput'))  $('#searchInput').value = state.query;

renderCategories();
renderProducts();
