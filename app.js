(function () {
      // Year stamp in footer
      const y = document.getElementById('year');
      if (y) y.textContent = new Date().getFullYear();

      // Mobile menu toggle logic (disclosure pattern)
      const root = document.querySelector('.pattern[data-pattern="site-shell"]');
      const toggle = root?.querySelector('.menu-toggle');
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
          const target = e.target;
          if (target && target.tagName === 'A' && window.matchMedia('(max-width: 767.98px)').matches) {
            closeMenu();
          }
        });

        // Ensure correct state on resize (progressive enhancement)
        const mq = window.matchMedia('(min-width: 768px)');
        const syncForViewport = () => {
          if (mq.matches) {
            // Show list and set expanded to true for clarity on desktop
            list.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
          } else {
            // Collapse on mobile by default
            closeMenu();
          }
        };
        (mq.addEventListener ? mq.addEventListener('change', syncForViewport) : mq.addListener(syncForViewport));
        syncForViewport();
      }
    })();