import { gsap, ScrollTrigger, SplitText, Observer, SCRAMBLE_TERM, prefersReducedMotion } from '../gsap';
import { site, blogCategories, horizon, horizonReviewed } from '../site';
import { createViewShell, esc } from './_shell';
import { createCircuit } from '../components/circuit';
import { createBlob, shuffledPalette, type Blob } from '../components/blob';
import type { ViewHandle } from '../router';
import './home.css';

const BOOT_KEY = 'booted';

/** Lines for the boot terminal. `cmd` lines are typed; others print instantly. */
const BOOT: { cmd?: string; out?: string; cls?: string }[] = [
  { out: '[ OK ] mounted /dev/classroom', cls: 'ok' },
  { cmd: 'whoami' },
  { out: `${site.name.toLowerCase()}: ${site.role.toLowerCase()}` },
  { cmd: 'ls ./notes' },
  { out: 'pedagogy/  curriculum/  qualifications/  post-16/', cls: 'dir' },
  { cmd: 'grep -r "what works" ./notes' },
];

export function createHomeView(): ViewHandle {
  const view = createViewShell({
    className: 'view--home',
    body: `
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__bg" data-circuit></div>
        <div class="container hero__grid">
          <div class="hero__copy">
            <p class="hero__kicker eyebrow gs-hidden">hello, world</p>
            <h1 class="hero__title gs-hidden" id="hero-title">${esc(site.name)}</h1>
            <p class="hero__role gs-hidden" data-role>${esc(site.role)}</p>
            <p class="hero__lede lede gs-hidden">
              Notes on teaching Computing in secondary and post-16 education: how students learn it,
              how the curriculum is changing, and where GCSE, A Level and T Level routes are heading.
            </p>
            <div class="hero__cta gs-hidden">
              <a class="btn btn--primary" href="/blog">read the blog</a>
              <a class="btn" href="#horizon">what's changing</a>
            </div>
          </div>
          <div class="hero__term panel gs-hidden" aria-hidden="true">
            <div class="panel__bar"><span class="panel__dots"><i></i><i></i><i></i></span>tty1</div>
            <pre class="term" data-term></pre>
          </div>
        </div>
      </section>

      <section class="themes" aria-labelledby="themes-title" data-themes>
        <div class="themes__pin" data-themes-pin>
          <div class="container themes__head">
            <div>
              <span class="eyebrow">ls ./notes</span>
              <h2 class="section-title" id="themes-title">What I write about</h2>
              <p class="lede">Secondary and post-16 Computing: how it's taught, what's taught, and the world it prepares students for.</p>
            </div>
            <div class="themes__meter" aria-hidden="true">
              <span class="themes__count" data-count>${String(1).padStart(2, '0')} / ${String(blogCategories.length).padStart(2, '0')}</span>
              <span class="themes__bar"><span data-bar></span></span>
              <span class="themes__hint">scroll or drag</span>
            </div>
          </div>
          <div class="themes__viewport" data-viewport>
            <div class="themes__track" data-track>
              ${blogCategories.map((c, i) => `
                <a class="theme panel" href="/blog?category=${c.id}" draggable="false">
                  <div class="theme__art" data-art></div>
                  <div class="theme__text">
                    <span class="theme__index">${String(i + 1).padStart(2, '0')}</span>
                    <h3 class="theme__title">${esc(c.label)}</h3>
                    <p class="theme__body">${esc(c.blurb)}</p>
                    <span class="theme__go">read posts →</span>
                  </div>
                </a>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <section class="section horizon" id="horizon" aria-labelledby="horizon-title">
        <div class="horizon__ghost" aria-hidden="true" data-ghost>2025 → 2028</div>
        <div class="container horizon__grid">
          <div class="horizon__head" data-horizon-head>
            <span class="eyebrow">git log --since=2025 ./qualifications</span>
            <h2 class="section-title" id="horizon-title">What's changing</h2>
            <p class="lede">
              The national curriculum, GCSE and A Level Computing, and post-16 technical routes are all in motion.
              Here's the shape of it, with links to the source documents.
            </p>
            <p class="horizon__note">Summarised from public announcements, last reviewed ${esc(horizonReviewed)}. Policy moves quickly, so check the sources for current detail.</p>
          </div>
          <div class="timeline" data-timeline>
            <span class="timeline__rail" aria-hidden="true"><span class="timeline__progress"></span></span>
            <ol class="timeline__list">
            ${horizon.map(h => `
              <li class="timeline__item">
                <span class="timeline__dot" aria-hidden="true"></span>
                <p class="timeline__when">${esc(h.when)}</p>
                <h3 class="timeline__title">${esc(h.title)}</h3>
                <p class="timeline__body">${esc(h.body)}</p>
                <p class="timeline__sources">
                  ${h.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('')}
                </p>
              </li>`).join('')}
            </ol>
          </div>
        </div>
      </section>

      <section class="section latest" aria-labelledby="latest-title">
        <div class="container">
          <div class="latest__head">
            <div>
              <span class="eyebrow">tail -n 3 blog.log</span>
              <h2 class="section-title" id="latest-title">Latest posts</h2>
            </div>
            <a class="btn" href="/blog">all posts →</a>
          </div>
          <div class="latest__list" data-latest><p class="output--dim">loading…</p></div>
          <p class="latest__lab output--muted">Looking for the classroom interactives? <a href="/lab">Visit the lab →</a></p>
        </div>
      </section>
    `,
  });

  const circuit = createCircuit();
  view.querySelector('[data-circuit]')!.appendChild(circuit.el);

  // One random blob per tile, however many categories there are. A fresh
  // palette shuffle each visit; neighbours never share a lead colour.
  const palette = shuffledPalette();
  const blobs: Blob[] = [...view.querySelectorAll<HTMLElement>('[data-art]')].map((art, i) => {
    const lead = palette[i % palette.length];
    const second = palette[(i + Math.ceil(palette.length / 2)) % palette.length];
    const blob = createBlob([lead, second]);
    art.appendChild(blob.el);
    (art.closest('.theme') as HTMLElement).style.setProperty('--theme-c', lead);
    return blob;
  });

  const mount = () => {
    const reduced = prefersReducedMotion();
    const cleanups: (() => void)[] = [];

    circuit.animate();
    runIntro(view, reduced);
    blobs.forEach(b => b.animate());

    // Scroll effects are created top-to-bottom so pins measure correctly.
    const mm = gsap.matchMedia();
    cleanups.push(() => mm.revert());
    mm.add({
      motion: '(prefers-reduced-motion: no-preference)',
      wide: '(min-width: 1000px)',
    }, (ctx) => {
      const { motion, wide } = ctx.conditions as { motion: boolean; wide: boolean };
      if (!motion) return;
      heroParallax(view);
      const stopThemes = themesScroller(view, blobs);
      revealTitles(view);
      if (wide) pinHorizonHead(view);
      horizonGhost(view);
      animateTimeline(view);
      return () => stopThemes?.();
    });

    // Latest posts arrive asynchronously: keep their animations in their own context.
    const late = gsap.context(() => {}, view);
    cleanups.push(() => late.revert());
    void import('../../packages/blog/src/posts').then(({ getPosts, levelBadges, formatDate }) => {
      const host = view.querySelector<HTMLElement>('[data-latest]');
      if (!host) return;
      const posts = getPosts().slice(0, 3);
      host.innerHTML = posts.length
        ? posts.map(p => `
            <a class="latest__item" href="/blog/${p.slug}">
              <span class="latest__date output--dim">${formatDate(p.date)}</span>
              <span class="latest__title">${esc(p.title)}</span>
              <span class="latest__levels">${levelBadges(p.levels)}</span>
            </a>`).join('')
        : '<p class="output--muted">No posts yet. Check back soon.</p>';
      late.add(() => {
        if (reduced) return;
        gsap.from(host.children, {
          autoAlpha: 0, x: -20, stagger: 0.08, duration: 0.5,
          scrollTrigger: { trigger: host, start: 'top 90%', once: true },
        });
      });
      ScrollTrigger.refresh();
    });

    return () => cleanups.forEach(fn => fn());
  };

  return { el: view, mount, title: 'Home' };
}

const navHeight = () => document.querySelector<HTMLElement>('.nav')?.offsetHeight ?? 0;

/** Hero layers drift up at different speeds as you scroll away, then fade. */
function heroParallax(view: HTMLElement) {
  const hero = view.querySelector<HTMLElement>('.hero')!;
  const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(view.querySelector('.hero__copy'), { yPercent: -14, ease: 'none', scrollTrigger: st });
  gsap.to(view.querySelector('.hero__term'), { yPercent: -38, ease: 'none', scrollTrigger: st });
  gsap.to(view.querySelector('.hero__grid'), { autoAlpha: 0.15, ease: 'power1.in', scrollTrigger: st });
}

/**
 * "What I write about": a pinned, horizontally scrolling gallery.
 *  - ScrollTrigger pins the section and scrubs the track sideways.
 *  - containerAnimation triggers give each blob's layers their own parallax and spin.
 *  - Scroll velocity skews the tiles slightly; they settle when you stop.
 *  - Observer lets you drag (mouse or touch) the gallery directly.
 * Falls back to a plain grid when everything already fits.
 */
function themesScroller(view: HTMLElement, blobs: Blob[]): (() => void) | undefined {
  const section = view.querySelector<HTMLElement>('[data-themes]')!;
  const pin = view.querySelector<HTMLElement>('[data-themes-pin]')!;
  const viewport = view.querySelector<HTMLElement>('[data-viewport]')!;
  const track = view.querySelector<HTMLElement>('[data-track]')!;
  const tiles = [...track.querySelectorAll<HTMLElement>('.theme')];
  const countEl = view.querySelector<HTMLElement>('[data-count]')!;
  const bar = view.querySelector<HTMLElement>('[data-bar]')!;
  const total = String(tiles.length).padStart(2, '0');

  section.classList.add('is-scroller');
  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
  if (distance() < 40) {
    // Few enough tiles to fit: no pin, just reveal them.
    section.classList.remove('is-scroller');
    ScrollTrigger.batch(tiles, {
      start: 'top 88%', once: true,
      onEnter: els => gsap.from(els, { autoAlpha: 0, y: 32, duration: 0.6, stagger: 0.08 }),
    });
    return;
  }

  // Skew with scroll velocity, easing back to 0 when scrolling stops.
  const skew = { v: 0 };
  const setSkew = gsap.quickSetter(tiles, 'skewX', 'deg');
  const clampSkew = gsap.utils.clamp(-6, 6);

  const scrollTween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      pin,
      start: () => `top top+=${navHeight()}`,
      end: () => `+=${distance()}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: self => {
        gsap.set(bar, { scaleX: self.progress });
        const i = Math.min(tiles.length, 1 + Math.floor(self.progress * tiles.length));
        countEl.textContent = `${String(i).padStart(2, '0')} / ${total}`;
        const v = clampSkew(self.getVelocity() / -400);
        if (Math.abs(v) > Math.abs(skew.v)) {
          skew.v = v;
          gsap.to(skew, { v: 0, duration: 0.8, ease: 'power3', overwrite: true, onUpdate: () => setSkew(skew.v) });
        }
      },
    },
  });
  const st = scrollTween.scrollTrigger!;

  // Per-tile parallax inside the moving track.
  tiles.forEach((tile, i) => {
    const blob = blobs[i];
    if (!blob) return;
    const inner = { trigger: tile, containerAnimation: scrollTween, start: 'left right', end: 'right left', scrub: true };
    gsap.fromTo(blob.layers.back, { x: 34 }, { x: -34, ease: 'none', scrollTrigger: inner });
    gsap.fromTo([blob.layers.front, blob.layers.nodes], { x: 14 }, { x: -14, ease: 'none', scrollTrigger: inner });
    gsap.fromTo(blob.el, { rotation: -10 }, { rotation: 10, transformOrigin: '50% 50%', ease: 'none', scrollTrigger: inner });
    ScrollTrigger.create({ ...inner, scrub: false, onToggle: self => blob.setActive(self.isActive) });
  });

  // Drag the gallery with a mouse or finger: horizontal movement becomes scroll.
  let dragged = 0;
  const observer = Observer.create({
    target: viewport,
    type: 'pointer,touch',
    dragMinimum: 4,
    lockAxis: true,
    onPress: () => { dragged = 0; },
    onDragStart: () => viewport.classList.add('is-dragging'),
    onDragEnd: () => viewport.classList.remove('is-dragging'),
    onChangeX: self => {
      if (!self.isDragging) return;
      dragged += Math.abs(self.deltaX);
      window.scrollBy(0, -self.deltaX);
    },
  });
  // A drag shouldn't count as a click on the tile under the pointer.
  const stopClickAfterDrag = (e: MouseEvent) => {
    if (dragged > 6) { e.preventDefault(); e.stopPropagation(); }
  };
  viewport.addEventListener('click', stopClickAfterDrag, true);

  // Keyboard: tabbing to an offscreen tile scrolls the gallery to it.
  const onFocus = (e: FocusEvent) => {
    const tile = (e.target as Element).closest<HTMLElement>('.theme');
    if (!tile) return;
    viewport.scrollLeft = 0; // focus can nudge overflow: keep GSAP in charge
    const p = gsap.utils.clamp(0, 1, (tile.offsetLeft - 24) / distance());
    gsap.to(window, { scrollTo: st.start + (st.end - st.start) * p, duration: 0.5, ease: 'power2.inOut' });
  };
  viewport.addEventListener('focusin', onFocus);

  return () => {
    observer.kill();
    viewport.removeEventListener('click', stopClickAfterDrag, true);
    viewport.removeEventListener('focusin', onFocus);
    section.classList.remove('is-scroller');
    gsap.set(tiles, { clearProps: 'skewX' });
  };
}

/** Section titles type in, character by character, as they arrive. */
function revealTitles(view: HTMLElement) {
  view.querySelectorAll<HTMLElement>('.section-title').forEach(h => {
    SplitText.create(h, {
      type: 'words,chars',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.chars, {
        autoAlpha: 0,
        duration: 0.04,
        stagger: 0.025,
        ease: 'none',
        scrollTrigger: { trigger: h, start: 'top 85%', once: true },
      }),
    });
  });
}

/** Wide screens: the "What's changing" intro stays pinned while its timeline scrolls past. */
function pinHorizonHead(view: HTMLElement) {
  const head = view.querySelector<HTMLElement>('[data-horizon-head]')!;
  const timeline = view.querySelector<HTMLElement>('[data-timeline]')!;
  ScrollTrigger.create({
    trigger: timeline,
    pin: head,
    pinSpacing: false,
    start: () => `top top+=${navHeight() + 32}`,
    end: () => `+=${Math.max(0, timeline.offsetHeight - head.offsetHeight)}`,
    invalidateOnRefresh: true,
  });
}

/** Oversized years drift across the section background at a different pace to the content. */
function horizonGhost(view: HTMLElement) {
  const section = view.querySelector<HTMLElement>('.horizon')!;
  gsap.fromTo(view.querySelector('[data-ghost]'), { xPercent: 8 }, {
    xPercent: -28,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

/** The rail fills down with scroll (scrubbed); each entry lights up as the line reaches it. */
function animateTimeline(view: HTMLElement) {
  const list = view.querySelector<HTMLElement>('[data-timeline]')!;
  gsap.fromTo(list.querySelector('.timeline__progress'), { scaleY: 0 }, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: list, start: 'top 65%', end: 'bottom 65%', scrub: 0.4 },
  });

  list.querySelectorAll<HTMLElement>('.timeline__item').forEach(item => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: item, start: 'top 65%', toggleActions: 'play none none reverse', toggleClass: 'is-reached' },
    });
    tl.fromTo(item.querySelector('.timeline__dot'), { scale: 0.6 }, { scale: 1, duration: 0.35, ease: 'relay' })
      .fromTo(item.querySelector('.timeline__when'), { autoAlpha: 0.3 }, {
        autoAlpha: 1,
        duration: 0.5,
        scrambleText: { text: item.querySelector('.timeline__when')!.textContent ?? '', chars: '0123456789', speed: 0.8 },
      }, '<')
      .fromTo(item.querySelectorAll('.timeline__title, .timeline__body, .timeline__sources'),
        { autoAlpha: 0.25, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.06 }, '<');
  });
}

function runIntro(view: HTMLElement, reduced: boolean) {
  const term = view.querySelector<HTMLElement>('[data-term]')!;
  const hidden = view.querySelectorAll<HTMLElement>('.hero .gs-hidden');

  if (reduced) {
    term.innerHTML = BOOT.map(l => l.cmd ? `<span class="prompt">${esc(l.cmd)}</span>` : `<span class="term__${l.cls ?? 'out'}">${esc(l.out!)}</span>`).join('\n');
    gsap.set(hidden, { autoAlpha: 1 });
    return;
  }

  let seen = false;
  try { seen = sessionStorage.getItem(BOOT_KEY) === '1'; sessionStorage.setItem(BOOT_KEY, '1'); } catch { /* ignore */ }

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.set(view.querySelector('.hero__term'), { autoAlpha: 1 });

  // Boot terminal: typed commands (TextPlugin) and instant output lines.
  BOOT.forEach(line => {
    const row = document.createElement('span');
    row.className = line.cmd ? 'prompt' : `term__${line.cls ?? 'out'}`;
    term.append(row, document.createTextNode('\n'));
    if (line.cmd) tl.to(row, { text: line.cmd, duration: line.cmd.length * 0.035 }, '+=0.15');
    else tl.set(row, { text: line.out! }, '+=0.12');
  });
  const caret = document.createElement('span');
  caret.className = 'cursor';
  term.appendChild(caret);
  tl.to(caret, { opacity: 0, repeat: -1, yoyo: true, duration: 0.5, ease: 'steps(1)' }, '>');

  // Heading: chars rise in, then the role line decodes.
  const title = view.querySelector<HTMLElement>('.hero__title')!;
  const split = SplitText.create(title, { type: 'chars', charsClass: 'hero__char', aria: 'auto' });
  const role = view.querySelector<HTMLElement>('[data-role]')!;
  const roleText = role.textContent ?? '';

  const heroTl = gsap.timeline({ delay: 0.2 });
  heroTl
    .set(title, { autoAlpha: 1 })
    .from(split.chars, { yPercent: 110, autoAlpha: 0, rotationX: -80, transformOrigin: '50% 100%', duration: 0.7, stagger: 0.05, ease: 'relay' })
    .set(view.querySelector('.hero__kicker'), { autoAlpha: 1 }, 0)
    .from(view.querySelector('.hero__kicker'), { autoAlpha: 0, x: -12, duration: 0.4 }, 0)
    .set(role, { autoAlpha: 1, textContent: '' }, '-=0.3')
    .to(role, { duration: 0.9, scrambleText: { text: roleText, chars: SCRAMBLE_TERM, revealDelay: 0.2, speed: 0.5 } })
    .fromTo(view.querySelectorAll('.hero__lede, .hero__cta'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 }, '-=0.4');

  // Seen it already this session? Fast-forward the boot.
  if (seen) { tl.timeScale(6); heroTl.timeScale(2); }
}
