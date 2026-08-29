/**
 * Shoppage Admin Portal — interactions
 *
 * Dark mode toggle (persisted), sidebar section collapse,
 * user-dropdown keyboard support, command palette, Chart.js theme-aware.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * Theme toggle — persists in localStorage, respects system preference
   * ------------------------------------------------------------------ */
  var THEME_KEY = 'sp-admin-theme';
  var body = document.body;
  var stored = null;
  try { stored = localStorage.getItem(THEME_KEY); } catch (e) {}

  function applyTheme(theme) {
    body.classList.remove('sp-theme-light', 'sp-theme-dark');
    body.classList.add(theme === 'dark' ? 'sp-theme-dark' : 'sp-theme-light');
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    /* Redraw charts so grid/label colors pick up the new theme */
    if (window.Chart && window.__spCharts) {
      window.__spCharts.forEach(function (c) { if (c) c.destroy(); });
      window.__spCharts = [];
      /* Let the page's own bootstrap re-init after theme swap */
      setTimeout(function () { if (window.__spInitCharts) window.__spInitCharts(); }, 50);
    }
  }

  if (stored === 'dark' || stored === 'light') {
    applyTheme(stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  var toggleBtn = document.querySelector('.sp-theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var current = body.classList.contains('sp-theme-dark') ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ------------------------------------------------------------------
   * Sidebar section collapse
   * ------------------------------------------------------------------ */
  var sectionToggles = document.querySelectorAll('.sp-nav-section-toggle');
  sectionToggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var section = btn.closest('.sp-nav-section');
      if (section) section.classList.toggle('is-collapsed');
    });
  });

  /* ------------------------------------------------------------------
   * User dropdown — click-to-toggle for touch devices
   * ------------------------------------------------------------------ */
  var userBtn = document.querySelector('.sp-user-btn');
  var userDropdown = document.querySelector('.sp-user-dropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      userDropdown.classList.toggle('is-open');
    });
    document.addEventListener('click', function (e) {
      if (!userDropdown.contains(e.target)) userDropdown.classList.remove('is-open');
    });
  }

  /* ------------------------------------------------------------------
   * Auto-dismiss messages after 4 seconds
   * ------------------------------------------------------------------ */
  var messages = document.querySelectorAll('.sp-message');
  messages.forEach(function (msg) {
    msg.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    setTimeout(function () {
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(-4px)';
      setTimeout(function () { msg.remove(); }, 250);
    }, 4000);
  });

  /* ------------------------------------------------------------------
   * Command palette — Cmd/Ctrl+K opens quick-nav overlay
   * ------------------------------------------------------------------ */
  var paletteItems = window.__spPaletteItems || [];
  var palette = document.getElementById('sp-command-palette');
  var paletteInput = document.getElementById('sp-palette-input');
  var paletteResults = document.getElementById('sp-palette-results');
  var cmdTrigger = document.getElementById('sp-cmd-trigger');
  var activeIndex = -1;

  function openPalette() {
    if (!palette) return;
    palette.classList.add('is-open');
    if (paletteInput) { paletteInput.value = ''; paletteInput.focus(); }
    activeIndex = -1;
    renderPalette('');
  }

  function closePalette() {
    if (palette) palette.classList.remove('is-open');
    activeIndex = -1;
  }

  function renderPalette(query) {
    if (!paletteResults) return;
    var q = (query || '').toLowerCase().trim();
    var filtered = q
      ? paletteItems.filter(function (it) { return (it.label + ' ' + (it.hint || '')).toLowerCase().indexOf(q) !== -1; })
      : paletteItems;

    if (!filtered.length) {
      paletteResults.innerHTML = '<div class="sp-palette-empty">No results for "' + escapeHtml(q) + '"</div>';
      activeIndex = -1;
      return;
    }

    var groups = {};
    var order = [];
    filtered.forEach(function (it) {
      if (!groups[it.group]) { groups[it.group] = []; order.push(it.group); }
      groups[it.group].push(it);
    });

    var html = '';
    order.forEach(function (g, gi) {
      html += '<div class="sp-palette-group-label">' + escapeHtml(g) + '</div>';
      groups[g].forEach(function (it) {
        var cls = 'sp-palette-item' + (activeIndex >= 0 && getFlatIndex(groups, order, gi, it) === activeIndex ? ' is-active' : '');
        html += '<a class="' + cls + '" href="' + escapeHtml(it.url) + '">';
        html += '<svg class="sp-palette-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
        html += '<span class="sp-palette-item-label">' + escapeHtml(it.label) + '</span>';
        if (it.hint) html += '<span class="sp-palette-item-hint">' + escapeHtml(it.hint) + '</span>';
        html += '</a>';
      });
    });
    paletteResults.innerHTML = html;
  }

  function getFlatIndex(groups, order, groupIdx, item) {
    var idx = 0;
    for (var i = 0; i < groupIdx; i++) idx += groups[order[i]].length;
    return idx + groups[order[groupIdx]].indexOf(item);
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function navigatePalette(delta) {
    var items = paletteResults ? paletteResults.querySelectorAll('.sp-palette-item') : [];
    if (!items.length) return;
    activeIndex = (activeIndex + delta + items.length) % items.length;
    items.forEach(function (el, i) {
      el.classList.toggle('is-active', i === activeIndex);
      if (i === activeIndex) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function activatePalette() {
    var active = paletteResults ? paletteResults.querySelector('.sp-palette-item.is-active') : null;
    if (active) active.click();
  }

  if (cmdTrigger) cmdTrigger.addEventListener('click', openPalette);
  if (palette) {
    palette.addEventListener('click', function (e) { if (e.target === palette) closePalette(); });
  }
  if (paletteInput) {
    paletteInput.addEventListener('input', function () { activeIndex = -1; renderPalette(paletteInput.value); });
    paletteInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); navigatePalette(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); navigatePalette(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); activatePalette(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    if (e.key === 'Escape' && palette && palette.classList.contains('is-open')) { closePalette(); }
  });
})();
