// assets/js/includes.js
// Load HTML fragments into [data-include="..."], then load main.js AFTER injection.

(() => {
  async function inject(el) {
    const url = el.getAttribute('data-include');
    if (!url) return;

    // Force relative paths to work on GitHub Pages project sites and subpages
    const base = document.baseURI; // respects <base> if you add one later
    const href = new URL(url, base).href;

    try {
      const res = await fetch(href, { cache: 'no-cache' });
      if (!res.ok) {
        console.error(`[includes] Failed to fetch ${href} (${res.status})`);
        el.innerHTML = `<!-- include failed: ${href} -->`;
        return;
      }
      el.innerHTML = await res.text();
    } catch (err) {
      console.error(`[includes] Error fetching ${href}:`, err);
      el.innerHTML = `<!-- include error: ${href} -->`;
    }
  }

  async function loadIncludesThenMain() {
    const targets = document.querySelectorAll('[data-include]');
    await Promise.all(Array.from(targets).map(inject));

    // Now that header/footer exist, load main.js so it can bind event handlers
    const s = document.createElement('script');
    s.src = '/assets/js/main.js';     // keep this relative (no leading slash)
    s.defer = true;
    document.body.appendChild(s);
  }

  if (location.protocol === 'file:') {
    console.warn(
      '[includes] You are viewing via file:// — fetch() will be blocked. Use a local server.'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadIncludesThenMain);
  } else {
    loadIncludesThenMain();
  }
})();

// assets/js/includes.js (loads fragments, then main.js)
(() => {
  async function inject(el) {
    const url = el.getAttribute('data-include');
    if (!url) return;
    const res = await fetch(new URL(url, document.baseURI), { cache: 'no-cache' });
    if (res.ok) el.innerHTML = await res.text();
  }
  async function load() {
    const targets = document.querySelectorAll('[data-include]');
    await Promise.all([...targets].map(inject));
    const s = document.createElement('script');
    s.src = '/assets/js/main.js';
    s.defer = true;
    document.body.appendChild(s);
  }
  (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', load) : load();
})();


/* ===== Mark current page link in <nav class="site-nav"> ===== */
(function setAriaCurrent() {
  // Treat "/" as "/index.html" and ignore "www." so comparisons are reliable
  function canonical(urlLike) {
    const u = new URL(urlLike, document.baseURI);
    const host = u.hostname.replace(/^www\./, '');
    let p = u.pathname.replace(/\/{2,}/g, '/');
    if (p.endsWith('/')) p += 'index.html';
    return host + p; // host + path only (no query/hash)
  }

  function apply() {
    const here = canonical(location.href);
    document.querySelectorAll('.site-nav a[href]').forEach(a => {
      const href = a.getAttribute('href');
      // skip fragments and non-document links
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        a.removeAttribute('aria-current');
        return;
      }
      const there = canonical(href);
      if (there === here) {
        a.setAttribute('aria-current', 'page');  // ✅ add
      } else {
        a.removeAttribute('aria-current');       // ❌ remove
      }
    });
  }

  // Run now (if nav is already in the DOM)
  apply();

  // If you inject header/footer via includes, watch for them and re-apply
  const mo = new MutationObserver(() => {
    if (document.querySelector('.site-nav a[href]')) apply();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Re-run on client-side nav or hash changes (optional)
  window.addEventListener('popstate', apply);
  window.addEventListener('hashchange', apply);
})();


// // Manually add/remove/toggle aria-current on a specific link
// window.setCurrentLink = (selector) => {
//   document.querySelectorAll('.site-nav a[aria-current="page"]').forEach(a => a.removeAttribute('aria-current'));
//   const link = document.querySelector(selector);
//   if (link) link.setAttribute('aria-current', 'page');
// };
// window.clearCurrentLink = () => {
//   document.querySelectorAll('.site-nav a[aria-current="page"]').forEach(a => a.removeAttribute('aria-current'));
// };
