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
