// --- Sticky header offset for skip/anchors (compute first so it's ready) ---
const headerEl = document.querySelector('.site-header');
function setSkipOffset() {
  const h = headerEl ? headerEl.offsetHeight : 0;
  document.documentElement.style.setProperty('--skip-offset', `${h}px`);
}
setSkipOffset();
window.addEventListener('resize', setSkipOffset);

(function () {
  // Year stamp in footer
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Mobile menu toggle logic (disclosure pattern)
  const root = document.querySelector('.pattern[data-pattern="site-shell"]');
  const toggle = root?.querySelector('.menu-toggle'); // ← fixed optional chaining
  const list = document.getElementById('primary-nav');

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    list.hidden = false;
  }
  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    list.hidden = true;
  }
  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  if (toggle && list) {
    toggle.addEventListener('click', () => {
      isOpen() ? closeMenu() : openMenu();
    });

    // Close with Escape when focus is within header/nav on small screens
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        closeMenu();
        toggle.focus();
      }
    });

    // Close after activating a link (mobile)
    list.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.tagName === 'A' && window.matchMedia('(max-width: 767.98px)').matches) {
        closeMenu();
      }
    });

    // Ensure correct state on resize (and keep offset current)
    const mq = window.matchMedia('(min-width: 768px)');
    const syncForViewport = () => {
      if (mq.matches) {
        list.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        closeMenu();
      }
      setSkipOffset(); // header height can change across breakpoints
    };
    (mq.addEventListener ? mq.addEventListener('change', syncForViewport) : mq.addListener(syncForViewport));
    syncForViewport();
  }

  // --- Skip link: focus first heading in <main> ONLY on skip activation ---
  const skip = document.querySelector('.skip-link'); // href="#main"
  const main = document.getElementById('main');

  function focusFirstMainHeading() {
    if (!main) return;
    const target =
      main.querySelector('h1, h2, h3, h4, h5, h6') ||
      main.querySelector('[role="heading"]');
    if (!target) return;

    let added = false;
    if (!(target.tabIndex >= 0)) {
      target.setAttribute('tabindex', '-1');
      added = true;
    }

    // Ensure offset is fresh, then bring the heading into view and focus it
    setSkipOffset();
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });

    // Optional micro-nudge for older engines that ignore scroll-margin-top
    const headerH = headerEl ? headerEl.offsetHeight : 0;
    if (headerH) window.scrollBy(0, -8);

    if (added) {
      const remove = () => {
        target.removeEventListener('blur', remove);
        if (target.getAttribute('tabindex') === '-1') {
          target.removeAttribute('tabindex');
        }
      };
      target.addEventListener('blur', remove);
    }
  }

  if (skip) {
    skip.addEventListener('click', (e) => {
      e.preventDefault(); // only move focus on explicit skip action
      focusFirstMainHeading();
    });
  }

  // NOTE: intentionally no hashchange/load focus handlers,
  // so focus never jumps on initial page load.
})();

/* ===== Accordion (with Open/Close All) ===== */
(function () {
  const accordions = document.querySelectorAll('.accordion');
  if (!accordions.length) return;

  accordions.forEach(acc => {
    const allowMultiple = acc.hasAttribute('data-allow-multiple');
    const triggers = acc.querySelectorAll('.accordion-trigger');
    const panels = acc.querySelectorAll('.accordion-panel');
    const toggleAllBtn = acc.querySelector('.accordion-toggle-all');

    // Respect reduced motion for the height animation
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) panels.forEach(p => p.classList.add('__anim'));

    function setExpanded(trigger, expanded) {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
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

    // --- Individual item handlers ---
    triggers.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        if (!allowMultiple && !isOpen) closeAll(btn.id);
        setExpanded(btn, !isOpen);
        syncToggleLabel(); // keep the Open/Close all label in sync
      });

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

    // --- Open/Close all support ---
    function allOpen() {
      return Array.from(triggers).length &&
             Array.from(triggers).every(t => t.getAttribute('aria-expanded') === 'true');
    }

    function syncToggleLabel() {
      if (!toggleAllBtn) return;
      const openLbl  = toggleAllBtn.dataset.openLabel  || 'Open all';
      const closeLbl = toggleAllBtn.dataset.closeLabel || 'Close all';
      const pressed = allOpen();
      toggleAllBtn.setAttribute('aria-pressed', String(pressed));
      toggleAllBtn.textContent = pressed ? closeLbl : openLbl;
    }

    if (toggleAllBtn) {
      // Initialize label on load
      syncToggleLabel();

      toggleAllBtn.addEventListener('click', () => {
        const targetOpen = !allOpen();
        // If your accordion was single-open, ignore that and open/close all explicitly:
        triggers.forEach(t => setExpanded(t, targetOpen));
        syncToggleLabel();
        // Keep focus on the control
        toggleAllBtn.focus();
      });
    }
  });
})();


// Mobile Responsive
/* ===== Mobile nav toggle (accessible) ===== */
(function () {
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('.menu-toggle');
  const navList = header?.querySelector('.site-nav .nav-list');

  if (!header || !toggle || !navList) return;

  // Ensure initial state is collapsed on small screens
  function collapse() {
    toggle.setAttribute('aria-expanded', 'false');
    header.setAttribute('data-nav-open', 'false');
    navList.setAttribute('hidden', '');
  }
  function expand() {
    toggle.setAttribute('aria-expanded', 'true');
    header.setAttribute('data-nav-open', 'true');
    navList.removeAttribute('hidden');
  }

  // Start collapsed on load (mobile)
  collapse();

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? collapse() : expand();
  });

  // If viewport switches to desktop, ensure menu is visible & attributes sane
  const mq = window.matchMedia('(min-width: 768px)');
  function syncForViewport(e) {
    if (e.matches) {
      // desktop
      toggle.setAttribute('aria-expanded', 'true');
      header.setAttribute('data-nav-open', 'true');
      navList.removeAttribute('hidden');
    } else {
      // mobile
      collapse();
    }
  }
  mq.addEventListener ? mq.addEventListener('change', syncForViewport)
                      : mq.addListener(syncForViewport);
  syncForViewport(mq);
})();

/* ===== Mobile flyout menu (robust + accessible) ===== */
(function () {
  const body = document.body;
  const toggle = document.querySelector('.menu-toggle');
  const drawer = document.getElementById('mobile-nav');
  const panel  = drawer?.querySelector('.mobile-nav__panel');
  const backdrop = drawer?.querySelector('.mobile-nav__backdrop');
  const closeButtons = drawer?.querySelectorAll('[data-close]');

  if (!toggle || !drawer || !panel) return;

  // If someone changed markup to <a> or <div>, make it act like a button:
  if (toggle.tagName !== 'BUTTON') {
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
  }

  let lastFocused = null;
  const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

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

  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); }
  }

  // Mouse/touch click
  toggle.addEventListener('click', (e) => {
    // If toggle is an <a href="#">…</a>, prevent jump
    if (toggle.tagName === 'A') e.preventDefault();
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeDrawer() : openDrawer();
  });

  // Enter/Space support for non-button toggles (buttons already fire click on Enter/Space)
  toggle.addEventListener('keydown', (e) => {
    if (toggle.tagName === 'BUTTON') return; // native handled
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeDrawer() : openDrawer();
    }
  });

  // Backdrop and explicit close buttons
  backdrop?.addEventListener('click', closeDrawer);
  closeButtons?.forEach(btn => btn.addEventListener('click', closeDrawer));

  // Close when resizing to desktop
  const mq = window.matchMedia('(min-width: 768px)');
  const sync = e => { if (e.matches) closeDrawer(); };
  mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync);
})();


