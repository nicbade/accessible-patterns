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

/* ===== Accordion ===== */
(function () {
  const accordions = document.querySelectorAll('.accordion');
  if (!accordions.length) return;

  accordions.forEach(acc => {
    const allowMultiple = acc.hasAttribute('data-allow-multiple');
    const triggers = acc.querySelectorAll('.accordion-trigger');

    // Enhance panels for smooth transition (respecting reduced motion)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const panels = acc.querySelectorAll('.accordion-panel');
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
          // Wait for animation to end before hiding for a11y tree cleanliness
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

    triggers.forEach((btn, i) => {
      // Click toggles
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        if (!allowMultiple && !isOpen) closeAll(btn.id);
        setExpanded(btn, !isOpen);
      });

      // Keyboard navigation between triggers
      btn.addEventListener('keydown', (e) => {
        const key = e.key;
        const lastIndex = triggers.length - 1;
        let nextIndex = null;

        if (key === 'ArrowDown') nextIndex = (i + 1) > lastIndex ? 0 : i + 1;
        if (key === 'ArrowUp')   nextIndex = (i - 1) < 0 ? lastIndex : i - 1;
        if (key === 'Home')      nextIndex = 0;
        if (key === 'End')       nextIndex = lastIndex;

        if (nextIndex !== null) {
          e.preventDefault();
          triggers[nextIndex].focus();
        }

        // Space/Enter handled by button natively to "click"
        // No need to preventDefault unless customizing
      });
    });
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
