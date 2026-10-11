import { gsap, Flip, SCRAMBLE_TERM, prefersReducedMotion } from '../gsap';
import { site } from '../site';
import type { Router } from '../router';

const LINKS = [
  { href: '/', label: 'home' },
  { href: '/links', label: 'links' },
  { href: '/blog', label: 'blog' },
  { href: '/forms', label: 'forms' },
];

const pathLabel = (path: string): string => (path === '/' ? '~' : `~${path}`);

const isActive = (href: string, path: string): boolean =>
  href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);

export function createNav(router: Router): HTMLElement {
  const el = document.createElement('header');
  el.className = 'nav';
  el.innerHTML = `
    <div class="nav__inner">
      <a class="nav__brand" href="/" aria-label="${site.name}: home">
        <span class="nav__user">${site.handle}@computing</span><span class="nav__colon">:</span><span class="nav__path" data-path>~</span><span class="nav__sigil">$</span><span class="nav__caret" aria-hidden="true"></span>
      </a>
      <nav class="nav__links" aria-label="Main">
        ${LINKS.map(l => `<a class="nav__link" href="${l.href}" data-label="${l.label}">${l.label}</a>`).join('')}
        <span class="nav__indicator" aria-hidden="true"></span>
      </nav>
      <button class="nav__theme" type="button" aria-label="Toggle light or dark theme" title="Toggle theme">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M12 4 A8 8 0 0 1 12 20 Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  `;

  const pathEl = el.querySelector<HTMLElement>('[data-path]')!;
  const indicator = el.querySelector<HTMLElement>('.nav__indicator')!;
  const links = [...el.querySelectorAll<HTMLAnchorElement>('.nav__link')];
  const caret = el.querySelector<HTMLElement>('.nav__caret')!;

  if (!prefersReducedMotion()) {
    gsap.to(caret, { opacity: 0, repeat: -1, yoyo: true, duration: 0.55, ease: 'steps(1)' });
  }

  // Hover: a quick scramble of the link text.
  links.forEach(a => {
    a.addEventListener('mouseenter', () => {
      if (prefersReducedMotion()) return;
      gsap.to(a, {
        duration: 0.4,
        scrambleText: { text: a.dataset.label!, chars: SCRAMBLE_TERM, speed: 1 },
        overwrite: true,
      });
    });
  });

  // Theme toggle
  el.querySelector('.nav__theme')!.addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
  });

  const update = (path: string) => {
    const active = links.find(a => isActive(a.getAttribute('href')!, path));
    links.forEach(a => {
      if (a === active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    // Flip the underline into the active link.
    const state = Flip.getState(indicator);
    if (active) active.appendChild(indicator);
    indicator.hidden = !active;
    if (!prefersReducedMotion()) Flip.from(state, { duration: 0.5, ease: 'relay' });

    const label = pathLabel(path);
    if (prefersReducedMotion()) pathEl.textContent = label;
    else gsap.to(pathEl, { duration: 0.5, scrambleText: { text: label, chars: SCRAMBLE_TERM, speed: 0.6 }, overwrite: true });
  };

  router.onChange(update);
  return el;
}
