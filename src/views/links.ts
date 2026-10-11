import { gsap, ScrollTrigger, SplitText, Flip, prefersReducedMotion } from '../gsap';
import { linkGroups, resources, keyStages, categoryById, type TeachingResource } from '../site';
import { createViewShell, esc } from './_shell';
import type { ViewHandle } from '../router';
import './links.css';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const KIND_LABEL: Record<TeachingResource['kind'], string> = {
  lesson: 'lesson', worksheet: 'worksheet', quiz: 'quiz', interactive: 'interactive', slides: 'slides', guide: 'guide',
};

const resourceCard = (r: TeachingResource) => {
  const levels = r.levels.map(id => {
    const k = keyStages.find(s => s.id === id)!;
    return `<span class="chip level level--${id}">${esc(k.label)}</span>`;
  }).join('');
  const body = `
    <span class="resource__kind">${KIND_LABEL[r.kind]}</span>
    <h3 class="resource__title">${esc(r.title)}</h3>
    <p class="resource__summary">${esc(r.summary)}</p>
    <p class="resource__meta">
      ${levels}
      <span class="chip">${esc(categoryById(r.category)?.label ?? r.category)}</span>
      ${r.spec ? `<span class="resource__spec">${esc(r.spec)}</span>` : ''}
    </p>
    ${r.files?.length ? `<p class="resource__files">${r.files.map(f => `<a href="/${esc(f.path)}" download>${esc(f.label)} ↓</a>`).join('')}</p>` : ''}`;
  return r.href
    ? `<a class="resource panel" href="${esc(r.href)}">${body}</a>`
    : `<article class="resource panel">${body}</article>`;
};

export function createLinksView(): ViewHandle {
  const view = createViewShell({
    className: 'view--links',
    body: `
      <header class="page-head">
        <div class="container">
          <span class="eyebrow">cat ~/bookmarks</span>
          <h1 class="page-head__title" data-split>Links &amp; resources</h1>
          <p class="lede">Places I return to for curriculum, qualifications, research and CPD, and a growing set of my own teaching resources.</p>
        </div>
      </header>

      <nav class="links-nav" aria-label="On this page">
        <div class="container links-nav__inner">
          <a class="links-nav__link" href="#resources">resources</a>
          ${linkGroups.map(g => `<a class="links-nav__link" href="#${slug(g.title)}">${esc(g.title.toLowerCase())}</a>`).join('')}
          <span class="links-nav__marker" aria-hidden="true"></span>
        </div>
      </nav>

      <div class="container links">
        <section class="links__section" id="resources" aria-labelledby="resources-title">
          <h2 class="links__title" id="resources-title">Teaching resources</h2>
          <p class="links__intro output--muted">
            Interactives so far; lessons, worksheets and quizzes will follow here as they're written.
          </p>
          <div class="resources">${resources.map(resourceCard).join('')}</div>
        </section>

        ${linkGroups.map(g => `
          <section class="links__section" id="${slug(g.title)}" aria-labelledby="${slug(g.title)}-title">
            <h2 class="links__title" id="${slug(g.title)}-title">${esc(g.title)}</h2>
            <ul class="links__list">
              ${g.links.map(l => `
                <li class="link">
                  <a class="link__a" href="${esc(l.url)}" target="_blank" rel="noopener">
                    <span class="link__label">${esc(l.label)}</span>
                    <span class="link__host">${esc(new URL(l.url).hostname.replace(/^www\./, ''))} ↗</span>
                  </a>
                  <p class="link__note">${esc(l.note)}</p>
                </li>`).join('')}
            </ul>
          </section>`).join('')}
      </div>
    `,
  });

  const mount = () => {
    const reduced = prefersReducedMotion();
    const navLinks = [...view.querySelectorAll<HTMLAnchorElement>('.links-nav__link')];
    const marker = view.querySelector<HTMLElement>('.links-nav__marker')!;

    const setActive = (id: string) => {
      const link = navLinks.find(l => l.getAttribute('href') === `#${id}`);
      if (!link || link.getAttribute('aria-current') === 'true') return;
      navLinks.forEach(l => l.setAttribute('aria-current', String(l === link)));
      const state = Flip.getState(marker);
      link.appendChild(marker);
      if (!reduced) Flip.from(state, { duration: 0.4, ease: 'relay' });
      link.parentElement?.scrollTo({ left: link.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' });
    };
    setActive('resources');

    view.querySelectorAll<HTMLElement>('.links__section').forEach(sec => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 40%',
        end: 'bottom 40%',
        onToggle: self => { if (self.isActive) setActive(sec.id); },
      });
    });

    if (reduced) return;
    SplitText.create(view.querySelector('[data-split]')!, {
      type: 'words,chars',
      onSplit: self => gsap.from(self.chars, { autoAlpha: 0, yPercent: 60, stagger: 0.025, duration: 0.45, ease: 'relay' }),
    });
    ScrollTrigger.batch(view.querySelectorAll('.resource, .link'), {
      start: 'top 92%',
      once: true,
      onEnter: els => gsap.from(els, { autoAlpha: 0, y: 16, stagger: 0.05, duration: 0.4 }),
    });
  };

  return { el: view, mount, title: 'Links & resources' };
}
