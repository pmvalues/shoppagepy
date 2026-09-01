/* ==========================================================================
   Shoppage v4 — Motion & Micro-interactions
   Scroll reveal · animated stat counters · header elevation.
   All effects respect the user's `prefers-reduced-motion` setting.
   ========================================================================== */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Sticky header elevation — adds a soft shadow once the page scrolls.
  ------------------------------------------------------------------ */
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('header-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------
     Scroll reveal — fades/slides elements into view once.
  ------------------------------------------------------------------ */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('reveal-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     Animated stat counters — [data-count] elements count up on view.
     Falls back gracefully for users with reduced motion or no IO.
  ------------------------------------------------------------------ */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    if (prefersReducedMotion) {
      el.textContent = target.toLocaleString('en-US');
      return;
    }
    el.textContent = '0';
    var duration = 1100;
    var startTime = null;

    function frame(now) {
      if (!startTime) startTime = now;
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = target.toLocaleString('en-US');
      }
    }
    requestAnimationFrame(frame);
  }

  if (counters.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
    } else {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });

      counters.forEach(function (el) { counterObserver.observe(el); });
    }
  }
})();
