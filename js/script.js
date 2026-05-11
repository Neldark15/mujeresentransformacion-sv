// ===========================================
// Mujeres en Transformación - Interacciones
// ===========================================
(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Menú móvil =====
  const toggle = $('#menuToggle');
  const nav = $('#mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ===== Año actual en el footer =====
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Smooth scroll para anclas (offset por header sticky) =====
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2 || !id.startsWith('#')) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  // ===== Reveal animations al hacer scroll =====
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    $$('.feature, .check-list li, figure, .section-head').forEach(el => observer.observe(el));
  }

  // ===== Theme toggle (dark / light) =====
  const themeBtn = $('#themeToggle');
  const STORAGE_THEME = 'met-theme';
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
  // Init: respeta preferencia guardada o sistema
  const savedTheme = localStorage.getItem(STORAGE_THEME);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_THEME, next);
    });
  }

  // ===== Scroll progress bar + back-to-top + header scrolled =====
  const progress = $('#scrollProgress');
  const backTop = $('#backToTop');
  const header = $('.site-header');

  function onScroll() {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? (scrollY / docH) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (backTop) {
      if (scrollY > 600) {
        backTop.hidden = false;
        backTop.classList.add('visible');
      } else {
        backTop.classList.remove('visible');
        // Mantenemos hidden=false para que la transición complete
      }
    }
    if (header) {
      header.classList.toggle('scrolled', scrollY > 8);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // ===== Sticky mobile bar (aparece al hacer scroll > 400px) =====
  const mobileBar = $('#mobileBar');
  if (mobileBar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        mobileBar.classList.add('visible');
        mobileBar.setAttribute('aria-hidden', 'false');
      } else {
        mobileBar.classList.remove('visible');
        mobileBar.setAttribute('aria-hidden', 'true');
      }
    }, { passive: true });
  }

  // ===== Lightbox =====
  const lightbox      = $('#lightbox');
  const lightboxImg   = $('#lightboxImage');
  const lightboxCap   = $('#lightboxCaption');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev  = $('#lightboxPrev');
  const lightboxNext  = $('#lightboxNext');
  const triggers = $$('.zoom-trigger');
  let currentLightboxIndex = 0;

  function openLightbox(index) {
    if (!lightbox || !triggers.length) return;
    currentLightboxIndex = (index + triggers.length) % triggers.length;
    const t = triggers[currentLightboxIndex];
    lightboxImg.src = t.dataset.lightbox;
    lightboxImg.alt = t.dataset.caption || '';
    lightboxCap.textContent = t.dataset.caption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
  triggers.forEach((t, i) => t.addEventListener('click', () => openLightbox(i)));
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev)  lightboxPrev.addEventListener('click',  () => openLightbox(currentLightboxIndex - 1));
  if (lightboxNext)  lightboxNext.addEventListener('click',  () => openLightbox(currentLightboxIndex + 1));
  if (lightbox) {
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  }
  document.addEventListener('keydown', e => {
    if (lightbox && !lightbox.hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft')  openLightbox(currentLightboxIndex - 1);
      else if (e.key === 'ArrowRight') openLightbox(currentLightboxIndex + 1);
    }
  });

  // ===== Testimonials carousel =====
  const carousel = $('#testimonialsCarousel');
  if (carousel) {
    const track = carousel.querySelector('.testimonials-grid');
    const items = $$('.testimonial', track);
    const dotsBox = $('#carouselDots');
    const prevBtn = carousel.querySelector('[data-direction="prev"]');
    const nextBtn = carousel.querySelector('[data-direction="next"]');
    let autoplayTimer = null;
    let activeIndex = 0;

    // Build dots
    items.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Ir al testimonio ${i + 1}`);
      b.addEventListener('click', () => goTo(i));
      dotsBox.appendChild(b);
    });
    const dots = $$('button', dotsBox);

    function updateDots(i) {
      dots.forEach((d, idx) => d.setAttribute('aria-selected', idx === i ? 'true' : 'false'));
    }
    function goTo(i) {
      activeIndex = (i + items.length) % items.length;
      const item = items[activeIndex];
      track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      updateDots(activeIndex);
    }
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(activeIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(activeIndex + 1));

    // Update dots al hacer scroll manual / swipe
    let scrollTimer = null;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let closest = 0, minDist = Infinity;
        items.forEach((it, idx) => {
          const itemCenter = it.offsetLeft - track.offsetLeft + it.clientWidth / 2;
          const dist = Math.abs(center - itemCenter);
          if (dist < minDist) { minDist = dist; closest = idx; }
        });
        activeIndex = closest;
        updateDots(activeIndex);
      }, 80);
    }, { passive: true });

    // Autoplay 6s (se pausa con hover o focus dentro del carrusel)
    function startAutoplay() {
      if (prefersReducedMotion) return;
      stopAutoplay();
      autoplayTimer = setInterval(() => goTo(activeIndex + 1), 6000);
    }
    function stopAutoplay() { if (autoplayTimer) clearInterval(autoplayTimer); }
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('focusout', startAutoplay);

    updateDots(0);
    startAutoplay();
  }
})();
