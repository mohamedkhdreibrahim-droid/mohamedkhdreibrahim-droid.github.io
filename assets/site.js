(() => {
  'use strict';
  const root = document.documentElement;
  const ar = root.lang === 'ar';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const themeButton = document.getElementById('theme');
  const text = (en, arabic) => ar ? arabic : en;

  function syncTheme() {
    const light = root.dataset.theme === 'light';
    document.querySelectorAll('[data-brand-logo]').forEach(img => {
      img.src = `/assets/mova-logo-on-${light ? 'light' : 'dark'}.svg`;
    });
    if (themeButton) {
      const use = themeButton.querySelector('use');
      if (use) use.setAttribute('href', light ? '#i-moon' : '#i-sun');
      else themeButton.textContent = light ? '☾' : '☀';
      themeButton.setAttribute('aria-pressed', String(light));
      themeButton.setAttribute('aria-label', light ? text('Use dark mode', 'تفعيل الوضع الداكن') : text('Use light mode', 'تفعيل الوضع الفاتح'));
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? '#faf7ff' : '#0c0918';
  }
  syncTheme();
  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('mova-theme', root.dataset.theme); } catch (_) {}
    syncTheme();
  });

  document.querySelectorAll('[data-nav-toggle]').forEach(button => {
    const menu = document.getElementById(button.dataset.navToggle);
    if (!menu) return;
    const header = button.closest('header');
    const close = (focus = false) => {
      menu.classList.remove('open'); button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', text('Open menu', 'فتح القائمة'));
      if (focus) button.focus();
    };
    button.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? text('Close menu', 'إغلاق القائمة') : text('Open menu', 'فتح القائمة'));
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => close()));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) close(true); });
    document.addEventListener('pointerdown', e => { if (!header.contains(e.target)) close(); });
    header.addEventListener('focusout', e => { if (e.relatedTarget && !header.contains(e.relatedTarget)) close(); });
    addEventListener('resize', () => { if (getComputedStyle(button).display === 'none') close(); });
  });

  const cards = [...document.querySelectorAll('[data-category]')];
  const search = document.getElementById('search');
  const filters = [...document.querySelectorAll('[data-filter]')].filter(b => b.closest('.work-controls'));
  if (cards.length && search) {
    let filter = 'all';
    const apply = () => {
      const query = search.value.trim().toLocaleLowerCase(root.lang);
      let count = 0;
      cards.forEach(card => {
        const show = (filter === 'all' || card.dataset.category === filter) && card.dataset.name.toLocaleLowerCase(root.lang).includes(query);
        card.hidden = !show; if (show) count++;
      });
      const status = document.getElementById('work-status');
      if (status) {
        status.hidden = !query && filter === 'all';
        status.textContent = count ? text(`${count} projects`, `${count} أعمال`) : text('No projects found. Try another search or category.', 'لا توجد أعمال مطابقة. جرّب بحثًا أو تصنيفًا آخر.');
      }
    };
    filters.forEach(button => button.addEventListener('click', () => {
      filter = button.dataset.filter;
      filters.forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
      apply();
    }));
    search.addEventListener('input', apply); apply();
  }

  const dialog = document.getElementById('projectViewer');
  if (dialog) {
    const body = document.getElementById('projectViewerBody');
    const title = document.getElementById('projectViewerTitle');
    document.querySelectorAll('[data-project-src]').forEach(card => card.addEventListener('click', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      const video = document.createElement('video');
      video.src = card.dataset.projectSrc; video.poster = card.dataset.projectPoster;
      video.controls = true; video.playsInline = true; video.preload = 'metadata';
      video.setAttribute('aria-label', card.dataset.name);
      title.textContent = card.dataset.name; body.replaceChildren(video); dialog.showModal();
      video.play().catch(() => {});
    }));
    document.getElementById('projectViewerClose').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('cancel', () => { body.querySelector('video')?.pause(); body.replaceChildren(); });
    dialog.addEventListener('close', () => { body.querySelector('video')?.pause(); body.replaceChildren(); });
  }

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('visible'));

  function syncMotion() {
    document.querySelectorAll('[data-motion-logo]').forEach(img => {
      const src = motion.matches ? '/assets/mova-logo-on-dark.svg' : '/mova-logo.svg';
      if (img.getAttribute('src') !== src) img.src = src;
    });
    document.querySelectorAll('video[data-auto-preview]').forEach(video => {
      const play = !motion.matches && !document.hidden;
      video.autoplay = play;
      if (play) video.play().catch(() => {}); else video.pause();
    });
    if (motion.matches || document.hidden) document.querySelectorAll('video[muted]').forEach(v => v.pause());
    if (motion.matches) reveals.forEach(el => el.classList.add('visible'));
  }
  syncMotion(); motion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);

  // Keep the floating shortcut clear of visible controls and open video dialogs.
  const fab = document.querySelector('.whatsapp,.wa-fab');
  if (fab) {
    let queued = false;
    const update = () => {
      queued = false;
      const box = fab.getBoundingClientRect();
      const collision = [...document.querySelectorAll('a[href],button,input,textarea,select,summary')].some(el => {
        if (el === fab || !el.getClientRects().length) return false;
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight && r.left < box.right + 10 && r.right > box.left - 10 && r.top < box.bottom + 10 && r.bottom > box.top - 10;
      });
      const hide = collision || !!document.querySelector('dialog[open]');
      fab.classList.toggle('fab-hidden', hide); fab.setAttribute('aria-hidden', String(hide)); fab.tabIndex = hide ? -1 : 0;
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.querySelectorAll('dialog').forEach(d => {
      new MutationObserver(schedule).observe(d, { attributes: true, attributeFilter: ['open'] });
      d.addEventListener('close', schedule);
    });
    document.fonts?.ready.then(schedule); update();
  }
  const year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();
})();
