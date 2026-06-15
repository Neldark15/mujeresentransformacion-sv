// =====================================================================
// script.js — Mejoras de CONTENIDO de página (no-chrome)
// El chrome (header/footer/overlays + tema, menú, scroll, etc.) lo maneja
// components.js. Aquí solo viven comportamientos ligados al contenido:
//   - animaciones reveal on-scroll
//   - lightbox de .zoom-trigger (galería "mira algunas páginas" del home)
//   - carrusel de testimonios
// Se carga al final del body en las páginas que tienen este contenido.
// =====================================================================
(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // ===== Lightbox (.zoom-trigger → galería del home) =====
  const lightbox      = $('#lightbox');
  const lightboxImg   = $('#lightboxImage');
  const lightboxCap   = $('#lightboxCaption');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev  = $('#lightboxPrev');
  const lightboxNext  = $('#lightboxNext');
  const triggers = $$('.zoom-trigger');
  let currentLightboxIndex = 0;

  // Solo activa el lightbox si hay triggers de .zoom-trigger en la página
  if (lightbox && triggers.length) {
    function openLightbox(index) {
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
      lightbox.hidden = true;
      document.body.style.overflow = '';
    }
    triggers.forEach((t, i) => t.addEventListener('click', () => openLightbox(i)));
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev)  lightboxPrev.addEventListener('click',  () => openLightbox(currentLightboxIndex - 1));
    if (lightboxNext)  lightboxNext.addEventListener('click',  () => openLightbox(currentLightboxIndex + 1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.hidden) {
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft')  openLightbox(currentLightboxIndex - 1);
        else if (e.key === 'ArrowRight') openLightbox(currentLightboxIndex + 1);
      }
    });
  }

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
