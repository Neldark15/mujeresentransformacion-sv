/* =====================================================================
   components.js  —  Chrome compartido del sitio (header / footer / overlays)
   ---------------------------------------------------------------------
   Se carga como <script src="js/components.js"> CLÁSICO y BLOQUEANTE en <head>.
   Por qué bloqueante en head:
     1) Aplica el tema (claro/oscuro) ANTES del primer paint → sin flash y
        consistente en TODAS las páginas (antes solo se aplicaba donde corría
        script.js, así que el modo oscuro no persistía en producto/checkout…).
     2) Registra los custom elements <met-header>/<met-footer>/<met-chrome>
        ANTES de que el parser llegue al <body>, de modo que se "upgradean"
        sincrónicamente durante el parseo. Resultado: cuando script.js (defer)
        y cart.js (module) corren, los nodos (#cartButton, #menuToggle,
        #cartDrawer, …) YA existen → sin problemas de orden.

   Los custom elements usan LIGHT DOM (no shadow) para que el CSS global y los
   document.querySelector existentes sigan funcionando sin cambios. El wrapper
   se neutraliza con `display: contents` (ver style.css) para no afectar el
   layout ni el sticky del header.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- 1) Tema inmediato (antes del paint) ---------- */
  try {
    var saved = localStorage.getItem('met-theme');
    if (saved === 'dark' ||
        (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) { /* localStorage bloqueado: ignorar */ }

  /* ---------- 2) Fragmentos de markup reutilizables ---------- */
  var WA_DEFAULT = 'https://wa.me/50363096466?text=%C2%A1Hola!%20Me%20interesa%20el%20Cuaderno%20de%20mis%20Sue%C3%B1os';

  var SVG = {
    sun:  '<svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    moon: '<svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    cart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h2l2.7 13.4A2 2 0 0 0 9.7 18h8.6a2 2 0 0 0 2-1.6L22 7H6"/><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/></svg>',
    burger: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16"></path><path d="M4 12h16"></path><path d="M4 19h16"></path></svg>',
    chevL: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    ig:   '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947C23.728 2.69 21.31.272 16.948.072 15.668.014 15.259 0 12 0zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    tiktok: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>',
    waMini: '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
    waFloat: '<svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.7 11.7 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.55 4.15 1.6 5.95L0 24l6.2-1.6A11.95 11.95 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.25-6.2-3.5-8.5ZM12 22a9.95 9.95 0 0 1-5.1-1.4l-.36-.22-3.7.97.98-3.6-.24-.37A9.94 9.94 0 0 1 2 12c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10Z"/><path d="M17.4 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-1.78-.9-2.95-1.6-4.13-3.6-.31-.54.31-.5.9-1.67.1-.2.05-.37-.03-.52-.07-.15-.66-1.6-.9-2.2-.25-.57-.5-.5-.67-.5-.18 0-.38-.02-.58-.02-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.5.71.3 1.26.48 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.12-.27-.2-.57-.35Z"/></svg>',
    buyBag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h2"/></svg>',
    upArrow: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
  };

  function themeToggleHTML() {
    return '<button class="theme-toggle" id="themeToggle" aria-label="Cambiar tema claro/oscuro" type="button">' + SVG.sun + SVG.moon + '</button>';
  }
  function cartButtonHTML() {
    return '<button class="cart-button" id="cartButton" aria-label="Abrir carrito" type="button">' + SVG.cart +
           '<span class="cart-badge" id="cartBadge" hidden>0</span></button>';
  }
  function logoHTML(href) {
    return '<a href="' + href + '" class="logo-link" aria-label="Inicio - Mujeres en Transformación">' +
           '<img src="images/logo-morado.png" alt="Mujeres en Transformación" width="180" height="60" /></a>';
  }

  /* ---------- 3) <met-header> ---------- */
  var NAV_HOME = [
    ['/tienda.html', 'Tienda'],
    ['#que-incluye', 'Qué incluye'],
    ['#sobre-met', 'Sobre MET'],
    ['#faq', 'FAQ']
  ];
  var NAV_SHOP = [
    ['/', 'Inicio'],
    ['/tienda.html', 'Tienda'],
    ['/#sobre-met', 'Sobre MET'],
    ['/#faq', 'FAQ']
  ];

  function navLinks(set, active) {
    return set.map(function (l) {
      var isActive = active && (l[0] === active || l[1].toLowerCase() === active);
      return '<a href="' + l[0] + '"' + (isActive ? ' class="active"' : '') + '>' + l[1] + '</a>';
    }).join('');
  }

  class MetHeader extends HTMLElement {
    connectedCallback() {
      var nav = this.getAttribute('data-nav') || 'home';
      var active = this.getAttribute('data-active') || '';
      var html = '<a href="#main" class="skip-link">Saltar al contenido</a>';

      if (nav === 'back') {
        var backHref = this.getAttribute('data-back-href') || '/';
        var backLabel = this.getAttribute('data-back-label') || 'Volver';
        html +=
          '<header class="site-header">' +
            '<div class="container header-inner">' +
              logoHTML('/') +
              '<a href="' + backHref + '" class="back-link">' + SVG.chevL + ' ' + backLabel + '</a>' +
            '</div>' +
          '</header>';
        this.innerHTML = html;
        return;
      }

      var isHome = nav === 'home';
      var logoHref = isHome ? '#top' : '/';
      var linksHTML = navLinks(isHome ? NAV_HOME : NAV_SHOP, active);
      // Tail = lo que va DENTRO del nav colapsable.
      // En tiendas, el carrito va FUERA del nav para seguir visible/tappable en móvil.
      var tail = isHome
        ? themeToggleHTML() + '<a href="/tienda.html" class="nav-cta">Comprar</a>'
        : themeToggleHTML();
      var outsideControls = isHome ? '' : cartButtonHTML();

      html +=
        '<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>' +
        '<header class="site-header" id="top">' +
          '<div class="container header-inner">' +
            logoHTML(logoHref) +
            '<nav class="main-nav" id="mainNav" aria-label="Navegación principal">' +
              linksHTML + tail +
            '</nav>' +
            outsideControls +
            '<button class="menu-toggle" id="menuToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="mainNav">' + SVG.burger + '</button>' +
          '</div>' +
        '</header>';
      this.innerHTML = html;
    }
  }

  /* ---------- 4) <met-footer> ---------- */
  class MetFooter extends HTMLElement {
    connectedCallback() {
      var variant = this.getAttribute('data-variant') || 'full';
      if (variant === 'compact') {
        this.innerHTML =
          '<footer class="site-footer compact"><div class="container">' +
          '<p class="copy">Hecho con amor por MET | <span id="year">2026</span></p>' +
          '</div></footer>';
        return;
      }
      this.innerHTML =
        '<footer class="site-footer"><div class="container footer-inner">' +
          '<img src="images/logo-blanco.png" alt="Mujeres en Transformación" width="200" height="80" class="footer-logo" />' +
          '<p class="footer-tag">Creamos herramientas desde la fe para mujeres que están listas para transformar su vida y vivir su propósito.</p>' +
          '<div class="social">' +
            '<a href="https://www.instagram.com/mujeresentransformacion.sv/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">' + SVG.ig + '</a>' +
            '<a href="https://www.tiktok.com/@mujeresentransformacion_" target="_blank" rel="noopener noreferrer" aria-label="TikTok">' + SVG.tiktok + '</a>' +
            '<a href="' + WA_DEFAULT + '" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">' + SVG.waMini + '</a>' +
          '</div>' +
          '<p class="copy">Hecho con amor por MET | <span id="year">2026</span></p>' +
        '</div></footer>';
    }
  }

  /* ---------- 5) <met-chrome> (overlays / flotantes) ---------- */
  function cartDrawerHTML() {
    return (
      '<div class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Carrito de compras" hidden>' +
        '<div class="cart-drawer-overlay" id="cartOverlay"></div>' +
        '<aside class="cart-drawer-panel">' +
          '<header class="cart-drawer-head"><h2>Tu carrito</h2>' +
            '<button type="button" class="cart-close" id="cartClose" aria-label="Cerrar carrito"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
          '</header>' +
          '<div class="cart-items" id="cartItems"></div>' +
          '<div class="cart-empty" id="cartEmpty">' +
            '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h2l2.7 13.4A2 2 0 0 0 9.7 18h8.6a2 2 0 0 0 2-1.6L22 7H6"/><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/></svg>' +
            '<p>Tu carrito está vacío</p><a href="/tienda.html" class="btn btn-primary">Ver productos</a>' +
          '</div>' +
          '<footer class="cart-drawer-foot" id="cartFoot" hidden>' +
            '<div class="cart-subtotal"><span>Subtotal</span><strong id="cartSubtotal">$ 0.00</strong></div>' +
            '<p class="micro">El envío se calcula en el siguiente paso</p>' +
            '<a href="/carrito.html" class="btn btn-primary btn-large">Continuar al checkout</a>' +
            '<button type="button" class="btn btn-ghost btn-small" id="continueShopping">Seguir comprando</button>' +
          '</footer>' +
        '</aside>' +
      '</div>'
    );
  }
  function lightboxHTML() {
    return (
      '<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Vista ampliada" hidden>' +
        '<button type="button" class="lightbox-close" id="lightboxClose" aria-label="Cerrar"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        '<button type="button" class="lightbox-nav lightbox-prev" id="lightboxPrev" aria-label="Imagen anterior"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>' +
        '<button type="button" class="lightbox-nav lightbox-next" id="lightboxNext" aria-label="Siguiente imagen"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>' +
        '<figure class="lightbox-figure"><img id="lightboxImage" src="" alt="" /><figcaption id="lightboxCaption"></figcaption></figure>' +
      '</div>'
    );
  }
  function mobileBarHTML() {
    return (
      '<div class="mobile-bar" id="mobileBar" aria-hidden="true">' +
        '<a href="' + WA_DEFAULT + '" target="_blank" rel="noopener noreferrer" class="mobile-bar-btn mobile-bar-btn--wa" aria-label="Contactar por WhatsApp">' + SVG.waFloat.replace('width="28" height="28"','width="20" height="20"') + 'WhatsApp</a>' +
        '<a href="checkout.html" class="mobile-bar-btn mobile-bar-btn--buy">' + SVG.buyBag + 'Comprar</a>' +
      '</div>'
    );
  }
  function backToTopHTML() {
    return '<button type="button" class="back-to-top" id="backToTop" aria-label="Volver al inicio" hidden>' + SVG.upArrow + '</button>';
  }
  function waFloatHTML() {
    return '<a href="' + WA_DEFAULT + '" class="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp">' + SVG.waFloat + '</a>';
  }
  function toastHTML() {
    return '<div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>';
  }

  class MetChrome extends HTMLElement {
    connectedCallback() {
      var html = '';
      if (this.hasAttribute('data-cart'))      html += cartDrawerHTML();
      if (this.hasAttribute('data-toast'))     html += toastHTML();
      if (this.hasAttribute('data-mobilebar')) html += mobileBarHTML();
      if (this.hasAttribute('data-backtop'))   html += backToTopHTML();
      if (this.hasAttribute('data-lightbox'))  html += lightboxHTML();
      if (this.hasAttribute('data-wa'))        html += waFloatHTML();
      this.innerHTML = html;
    }
  }

  customElements.define('met-header', MetHeader);
  customElements.define('met-footer', MetFooter);
  customElements.define('met-chrome', MetChrome);

  /* ---------- 6) Comportamiento del chrome (tras inyección) ---------- */
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function initChrome() {
    // Año
    document.querySelectorAll('#year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    // Menú móvil
    var toggle = $('#menuToggle'), nav = $('#mainNav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      });
      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Theme toggle
    var themeBtn = $('#themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var next = isDark ? 'light' : 'dark';
        if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
        try { localStorage.setItem('met-theme', next); } catch (e) {}
      });
    }

    // Smooth scroll para anclas internas
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2 || !id.startsWith('#')) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    });

    // Scroll: progress bar + back-to-top + sombra header + mobile bar
    var progress = $('#scrollProgress');
    var backTop  = $('#backToTop');
    var header   = $('.site-header');
    var mobileBar = $('#mobileBar');

    function onScroll() {
      var y = window.scrollY;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + '%';
      if (backTop) {
        if (y > 600) { backTop.hidden = false; backTop.classList.add('visible'); }
        else { backTop.classList.remove('visible'); }
      }
      if (header) header.classList.toggle('scrolled', y > 8);
      if (mobileBar) {
        if (y > 400) { mobileBar.classList.add('visible'); mobileBar.setAttribute('aria-hidden', 'false'); }
        else { mobileBar.classList.remove('visible'); mobileBar.setAttribute('aria-hidden', 'true'); }
      }
    }
    if (progress || backTop || header || mobileBar) {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    if (backTop) {
      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChrome);
  } else {
    initChrome();
  }
})();
