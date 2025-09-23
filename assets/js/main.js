/* =========================================================
   Accessible Web – main.js
   Components: Accordion, Carousel, Mobile Flyout Menu, Modal
   ========================================================= */

/* ===== Utility: matchMedia listener fallback ===== */
function addMQListener(mq, handler) {
  if (mq.addEventListener) mq.addEventListener('change', handler);
  else mq.addListener(handler);
}

/* ===== Utility: set current year if #year exists ===== */
(function () {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

/* =========================================================
   ACCORDION (with “Open/Close all”)
   - .accordion (container)
   - .accordion-trigger buttons w/ aria-controls
   - .accordion-panel (id referenced by trigger)
   - Optional: .accordion-toggle-all (single button)
   - data-allow-multiple on container to allow many open
   ========================================================= */
(function initAccordions() {
  const accordions = document.querySelectorAll('.accordion');
  if (!accordions.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  accordions.forEach(acc => {
    const allowMany = acc.hasAttribute('data-allow-multiple');
    const triggers = acc.querySelectorAll('.accordion-trigger');
    const panels   = acc.querySelectorAll('.accordion-panel');
    const toggleAllBtn = acc.querySelector('.accordion-toggle-all');

    if (!prefersReduced) panels.forEach(p => p.classList.add('__anim'));

    function setExpanded(trigger, expanded) {
      const panelId = trigger.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      trigger.setAttribute('aria-expanded', String(expanded));

      if (expanded) {
        panel.hidden = false;
        if (!prefersReduced) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
          panel.style.paddingTop = '';
          panel.style.paddingBottom = '';
        }
      } else {
        if (!prefersReduced) {
          panel.style.maxHeight = '0px';
          panel.style.paddingTop = '0px';
          panel.style.paddingBottom = '0px';
          panel.addEventListener('transitionend', () => { panel.hidden = true; }, { once: true });
        } else {
          panel.hidden = true;
        }
      }
    }

    function closeAll(exceptId) {
      triggers.forEach(t => {
        if (t.id !== exceptId && t.getAttribute('aria-expanded') === 'true') {
          setExpanded(t, false);
        }
      });
    }

    function allOpen() {
      return triggers.length && Array.from(triggers).every(t => t.getAttribute('aria-expanded') === 'true');
    }

    function syncToggleAll() {
      if (!toggleAllBtn) return;
      const openLbl  = toggleAllBtn.dataset.openLabel  || 'Open all';
      const closeLbl = toggleAllBtn.dataset.closeLabel || 'Close all';
      const pressed  = allOpen();
      toggleAllBtn.setAttribute('aria-pressed', String(pressed));
      toggleAllBtn.textContent = pressed ? closeLbl : openLbl;
    }

    // Wire individual triggers
    triggers.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        if (!allowMany && !isOpen) closeAll(btn.id);
        setExpanded(btn, !isOpen);
        syncToggleAll();
      });

      // Arrow navigation between triggers
      btn.addEventListener('keydown', (e) => {
        const key = e.key;
        const lastIndex = triggers.length - 1;
        let nextIndex = null;
        if (key === 'ArrowDown') nextIndex = (i + 1) > lastIndex ? 0 : i + 1;
        if (key === 'ArrowUp')   nextIndex = (i - 1) < 0 ? lastIndex : i - 1;
        if (key === 'Home')      nextIndex = 0;
        if (key === 'End')       nextIndex = lastIndex;
        if (nextIndex !== null) { e.preventDefault(); triggers[nextIndex].focus(); }
      });
    });

    // Open/Close all
    if (toggleAllBtn) {
      syncToggleAll();
      toggleAllBtn.addEventListener('click', () => {
        const targetOpen = !allOpen();
        triggers.forEach(t => setExpanded(t, targetOpen));
        syncToggleAll();
        toggleAllBtn.focus(); // keep focus on control
      });
    }

    // Re-measure open panels when images inside finish loading or on resize
    function refreshOpenPanels() {
      acc.querySelectorAll('.accordion-panel:not([hidden])').forEach(p => {
        if (prefersReduced) return;
        p.style.maxHeight = 'none';
        const h = p.scrollHeight;
        p.style.maxHeight = h + 'px';
      });
    }
    acc.querySelectorAll('.accordion-panel img').forEach(img => {
      if (!img.complete) img.addEventListener('load', refreshOpenPanels);
    });
    window.addEventListener('resize', refreshOpenPanels);
  });
})();

/* =========================================================
   CAROUSEL (WAI-ARIA APG Prev/Next)
   - .carousel (wrapper) [data-autoplay="true|false"]
   - Buttons: .carousel-prev / .carousel-next / .carousel-toggle
   - Slides:  .carousel-slide (use [hidden] on non-current)
   - Live region: .carousel-status (aria-live="polite")
   ========================================================= */
(function initCarousels() {
  const carousels = document.querySelectorAll('.carousel');
  if (!carousels.length) return;

  carousels.forEach(carousel => {
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    if (!slides.length) return;

    const prevBtn   = carousel.querySelector('.carousel-prev');
    const nextBtn   = carousel.querySelector('.carousel-next');
    const toggleBtn = carousel.querySelector('.carousel-toggle');
    const status    = carousel.querySelector('.carousel-status');
    const autoplayDefault = carousel.getAttribute('data-autoplay') === 'true';

    let index = 0;
    let playing = false;
    let timer = null;

    function setSlide(newIndex, announce = true) {
      index = (newIndex + slides.length) % slides.length;
      slides.forEach((s, i) => {
        const isCurrent = i === index;
        s.toggleAttribute('hidden', !isCurrent);
        s.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
      });
      if (announce && status) status.textContent = `Slide ${index + 1} of ${slides.length}`;
    }

    function play() {
      if (playing) return;
      playing = true;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', 'true');
        toggleBtn.textContent = 'Pause';
        toggleBtn.setAttribute('aria-label', 'Pause automatic slide rotation');
      }
      timer = window.setInterval(() => setSlide(index + 1), 5000);
    }

    function pause() {
      playing = false;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.textContent = 'Play';
        toggleBtn.setAttribute('aria-label', 'Start automatic slide rotation');
      }
      window.clearInterval(timer);
      timer = null;
    }

    prevBtn && prevBtn.addEventListener('click', () => { setSlide(index - 1); prevBtn.focus(); });
    nextBtn && nextBtn.addEventListener('click', () => { setSlide(index + 1); nextBtn.focus(); });

    [prevBtn, nextBtn].forEach(btn => btn && btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prevBtn && prevBtn.click(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn && nextBtn.click(); }
    }));

    toggleBtn && toggleBtn.addEventListener('click', () => {
      playing ? pause() : play();
      toggleBtn.focus();
    });

    // Pause on hover/focus; optionally resume when leaving if autoplay defaulted on
    carousel.addEventListener('mouseenter', () => playing && pause());
    carousel.addEventListener('focusin', () => playing && pause());
    carousel.addEventListener('mouseleave', () => { if (autoplayDefault) play(); });
    carousel.addEventListener('focusout', (e) => {
      if (!carousel.contains(e.relatedTarget) && autoplayDefault) play();
    });

    // Init
    setSlide(0, false);
    if (autoplayDefault) play();

    // Images load handling hook (kept for future container sizing if needed)
    function refreshVisible() {
      // Using object-fit + max-height CSS; nothing to recompute here
    }
    carousel.querySelectorAll('img').forEach(img => {
      if (!img.complete) img.addEventListener('load', refreshVisible);
    });
    window.addEventListener('resize', refreshVisible);
  });
})();

/* =========================================================
   MOBILE FLYOUT MENU (off-canvas)
   - Trigger: .menu-toggle  (button or link)
   - Drawer:  #mobile-nav
     - .mobile-nav__panel (role=dialog, aria-modal=true)
     - .mobile-nav__backdrop
     - [data-close] elements
   ========================================================= */
(function initMobileFlyout() {
  const body = document.body;
  const toggle   = document.querySelector('.menu-toggle');
  const drawer   = document.getElementById('mobile-nav');
  const panel    = drawer?.querySelector('.mobile-nav__panel');
  const backdrop = drawer?.querySelector('.mobile-nav__backdrop');
  const closers  = drawer?.querySelectorAll('[data-close]');

  if (!toggle || !drawer || !panel) return;

  // Ensure non-button toggles still work via keyboard
  if (toggle.tagName !== 'BUTTON') {
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
  }

  const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let lastFocused = null;

  function trapTab(e) {
    if (e.key !== 'Tab') return;
    const focusables = panel.querySelectorAll(FOCUSABLE);
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); }
  }

  function openDrawer() {
    lastFocused = document.activeElement;
    toggle.setAttribute('aria-expanded', 'true');
    body.classList.add('nav-open');
    drawer.hidden = false;
    drawer.classList.add('is-open');
    const firstFocusable = panel.querySelector(FOCUSABLE);
    (firstFocusable || panel).focus();
    document.addEventListener('keydown', onKeydown);
    panel.addEventListener('keydown', trapTab);
  }

  function closeDrawer() {
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('nav-open');
    drawer.classList.remove('is-open');
    requestAnimationFrame(() => { drawer.hidden = true; });
    document.removeEventListener('keydown', onKeydown);
    panel.removeEventListener('keydown', trapTab);
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }

  toggle.addEventListener('click', (e) => {
    if (toggle.tagName === 'A') e.preventDefault();
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeDrawer() : openDrawer();
  });

 // Backdrop and explicit close buttons (fixed)
backdrop && backdrop.addEventListener('click', closeDrawer);
closers && closers.forEach(btn => btn.addEventListener('click', closeDrawer));


  // Close when resizing to desktop
  const mq = window.matchMedia('(min-width: 768px)');
  addMQListener(mq, e => { if (e.matches) closeDrawer(); });
})();

/* =========================================================
   MODAL DIALOG (APG-style)
   - Open button: #open-demo-modal
   - Root: #demo-modal
     - .modal-backdrop [data-close]
     - .modal-dialog (role=dialog, aria-modal=true)
     - Close buttons: [data-close]
   ========================================================= */
(function initModal() {
  const openBtn = document.getElementById('open-demo-modal');
  const root    = document.getElementById('demo-modal');
  if (!openBtn || !root) return;

  const dialog   = root.querySelector('.modal-dialog');
  const backdrop = root.querySelector('.modal-backdrop');
  const closeEls = root.querySelectorAll('[data-close]');

  const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let lastFocused = null;

  function trapTab(e) {
    if (e.key !== 'Tab') return;
    const f = dialog.querySelectorAll(FOCUSABLE);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  }

  function open() {
    lastFocused = document.activeElement;
    document.body.classList.add('modal-open');
    root.hidden = false;
    // Force reflow for transition
    root.getBoundingClientRect();
    root.classList.add('is-open');

    // Move focus inside dialog
    dialog.focus();
    const firstFocusable = dialog.querySelector(FOCUSABLE);
    (firstFocusable || dialog).focus();

    document.addEventListener('keydown', onKeydown);
    dialog.addEventListener('keydown', trapTab);
  }

  function close() {
    document.body.classList.remove('modal-open');
    root.classList.remove('is-open');
    requestAnimationFrame(() => { root.hidden = true; });
    document.removeEventListener('keydown', onKeydown);
    dialog.removeEventListener('keydown', trapTab);
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }

  openBtn.addEventListener('click', open);
  closeEls.forEach(el => el.addEventListener('click', close));
  backdrop && backdrop.addEventListener('click', close);
})();

// Modal end 

/* ===== Sortable Table (APG style) ===== */
(function initSortableTables() {
  function parseCell(value, type) {
    if (type === 'numeric') {
      const n = parseFloat(String(value).replace(/[^\d.-]/g, ''));
      return isNaN(n) ? Number.NEGATIVE_INFINITY : n;
    }
    if (type === 'date') {
      const t = Date.parse(value);
      return isNaN(t) ? -8640000000000000 : t; // min time for invalid
    }
    // text (default): case-insensitive
    return String(value).toLowerCase();
  }

  function sortTable(table, colIndex, type, direction) {
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows).map((row, i) => ({ row, i })); // stable

    rows.sort((a, b) => {
      const aVal = parseCell(a.row.cells[colIndex].textContent.trim(), type);
      const bVal = parseCell(b.row.cells[colIndex].textContent.trim(), type);
      if (aVal < bVal) return direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return direction === 'ascending' ? 1 : -1;
      return a.i - b.i; // stable fallback
    });

    // Re-append in new order
    rows.forEach(({ row }) => tbody.appendChild(row));
  }

  function clearAriaSort(ths) {
    ths.forEach(th => th.setAttribute('aria-sort', 'none'));
  }

  const tables = document.querySelectorAll('.sortable-table');
  if (!tables.length) return;

  tables.forEach(table => {
    const theadThs = table.tHead ? Array.from(table.tHead.rows[0].cells) : [];
    const status = table.closest('section')?.querySelector('.table-status');

    theadThs.forEach((th, index) => {
      const btn = th.querySelector('button');
      if (!btn) return;

      const type = btn.getAttribute('data-type') || 'text';

      btn.addEventListener('click', () => {
        // Toggle sort direction for this column
        const current = th.getAttribute('aria-sort') || 'none';
        const next = current === 'ascending' ? 'descending' : 'ascending';

        clearAriaSort(theadThs);
        th.setAttribute('aria-sort', next);

        sortTable(table, index, type, next);

        // Keep focus on the button and announce
        btn.focus();
        if (status) status.textContent = `Sorted by ${btn.textContent.trim()}, ${next}.`;
      });
    });
  });

  // Reset sort buttons (optional)
  document.querySelectorAll('.table-reset').forEach(resetBtn => {
    resetBtn.addEventListener('click', () => {
      const targetSel = resetBtn.getAttribute('data-target');
      const table = targetSel ? document.querySelector(targetSel) : null;
      if (!table || !table.tBodies[0]) return;

      const tbody = table.tBodies[0];
      // Restore original order by data-index (set once) or by DOM snapshot
      if (!tbody.__originalOrder) {
        tbody.__originalOrder = Array.from(tbody.rows);
      }
      // Clear aria-sort
      const ths = table.tHead ? Array.from(table.tHead.rows[0].cells) : [];
      ths.forEach(th => th.setAttribute('aria-sort', 'none'));

      tbody.__originalOrder.forEach(row => tbody.appendChild(row));

      const status = table.closest('section')?.querySelector('.table-status');
      if (status) status.textContent = 'Sort reset to original order.';
      resetBtn.focus();
    });
  });

  // Capture original order once on DOM ready
  document.querySelectorAll('.sortable-table tbody').forEach(tbody => {
    if (!tbody.__originalOrder) tbody.__originalOrder = Array.from(tbody.rows);
  });
})();

// Table end 

// Alert fix 
/* ===== Button demo: primary triggers alert ===== */
(function () {
  const demoBtn = document.getElementById('btn-primary-demo');
  if (!demoBtn) return;
  demoBtn.addEventListener('click', () => {
    alert('Button triggered an action!');
    demoBtn.focus(); // return focus to the trigger after alert closes
  });
})();
// Alert fix end 