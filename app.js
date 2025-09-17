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
