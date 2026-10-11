import { gsap, Flip, ScrollTrigger, SplitText, prefersReducedMotion } from '../../../src/gsap';
import { createViewShell, esc } from '../../../src/views/_shell';
import { blogCategories, categoryById, levelById, type CategoryId, type LevelId } from '../../../src/site';
import type { RouteContext, ViewHandle } from '../../../src/router';
import { getPosts, getPost, allTags, formatDate, levelBadges, categoryBadge, type Post } from './posts';
import { renderMarkdown, enhanceCodeBlocks } from './markdown';
import './styles/blog.css';

type Sort = 'new' | 'old' | 'title';

const card = (p: Post) => `
  <article class="post-card panel" data-slug="${p.slug}">
    <a class="post-card__link" href="/blog/${p.slug}">
      <div class="post-card__meta">
        <time datetime="${p.date}">${formatDate(p.date)}</time>
        <span>${p.readingMinutes} min</span>
        ${p.draft ? '<span class="post-card__draft">draft</span>' : ''}
      </div>
      <h2 class="post-card__title">${esc(p.title)}</h2>
      ${p.summary ? `<p class="post-card__summary">${esc(p.summary)}</p>` : ''}
      <div class="post-card__chips">
        ${categoryBadge(p.category)}
        ${levelBadges(p.levels)}
        ${p.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join('')}
      </div>
    </a>
  </article>`;

// ── List ────────────────────────────────────────────────
export function createBlogListView(ctx: RouteContext): ViewHandle {
  const posts = getPosts();
  const tags = allTags(posts);

  const state = {
    q: ctx.query.get('q') ?? '',
    category: (categoryById(ctx.query.get('category') ?? '')?.id ?? '') as CategoryId | '',
    // Older links (e.g. from the old teaching page) filter by key stage.
    level: (levelById(ctx.query.get('level') ?? '')?.id ?? '') as LevelId | '',
    tag: ctx.query.get('tag') ?? '',
    sort: (['new', 'old', 'title'].includes(ctx.query.get('sort') ?? '') ? ctx.query.get('sort') : 'new') as Sort,
  };

  const view = createViewShell({
    className: 'view--blog',
    body: `
      <header class="page-head">
        <div class="container">
          <span class="eyebrow">cd ~/blog</span>
          <h1 class="page-head__title" data-split>Blog</h1>
          <p class="lede">Writing on teaching Computing: pedagogy, adaptive teaching, curriculum, the modern CS landscape and computing history.</p>
        </div>
      </header>

      <div class="container blog">
        <form class="blog__tools" role="search" data-tools>
          <label class="blog__search">
            <span class="blog__search-prefix" aria-hidden="true">grep -i</span>
            <span class="sr-only">Search posts</span>
            <input type="search" name="q" value="${esc(state.q)}" placeholder="search posts…" autocomplete="off" />
          </label>
          <div class="blog__filters">
            <div class="blog__chips" role="group" aria-label="Category">
              <button class="chip" type="button" data-category="" aria-pressed="${state.category === ''}">all</button>
              ${blogCategories.map(c => `<button class="chip cat--${c.id}" type="button" data-category="${c.id}" aria-pressed="${state.category === c.id}" title="${esc(c.blurb)}">${esc(c.label)}</button>`).join('')}
            </div>
            <label class="blog__sort">
              <span class="output--dim">sort</span>
              <select name="sort">
                <option value="new" ${state.sort === 'new' ? 'selected' : ''}>newest</option>
                <option value="old" ${state.sort === 'old' ? 'selected' : ''}>oldest</option>
                <option value="title" ${state.sort === 'title' ? 'selected' : ''}>a–z</option>
              </select>
            </label>
          </div>
          ${tags.length ? `
            <div class="blog__chips blog__tags" role="group" aria-label="Tags">
              ${tags.map(t => `<button class="chip" type="button" data-tag="${esc(t)}" aria-pressed="${state.tag === t}">#${esc(t)}</button>`).join('')}
            </div>` : ''}
        </form>

        <p class="blog__count output--muted" aria-live="polite" data-count></p>
        <div class="blog__grid" data-grid>${posts.map(card).join('')}</div>
        <div class="blog__empty" data-empty hidden>
          <p class="prompt">grep -ri "<span data-empty-q></span>" ./posts</p>
          <p class="output--muted">${posts.length ? 'No posts match those filters.' : 'No posts published yet. Check back soon!'}</p>
        </div>
      </div>
    `,
  });

  const mount = () => {
    const reduced = prefersReducedMotion();
    const tools = view.querySelector<HTMLFormElement>('[data-tools]')!;
    const grid = view.querySelector<HTMLElement>('[data-grid]')!;
    const countEl = view.querySelector<HTMLElement>('[data-count]')!;
    const empty = view.querySelector<HTMLElement>('[data-empty]')!;
    const cards = new Map([...grid.querySelectorAll<HTMLElement>('.post-card')].map(c => [c.dataset.slug!, c]));
    let first = true;

    const matches = (p: Post) => {
      if (state.category && p.category !== state.category) return false;
      if (state.level && !p.levels.includes(state.level)) return false;
      if (state.tag && !p.tags.includes(state.tag)) return false;
      if (state.q) {
        const hay = `${p.title} ${p.summary} ${p.tags.join(' ')} ${p.spec ?? ''} ${p.body}`.toLowerCase();
        return state.q.toLowerCase().split(/\s+/).every(w => hay.includes(w));
      }
      return true;
    };

    const sorted = () => [...posts].sort((a, b) =>
      state.sort === 'title' ? a.title.localeCompare(b.title)
        : state.sort === 'old' ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date));

    const apply = () => {
      const flipState = Flip.getState([...cards.values()]);
      const order = sorted();
      let shown = 0;
      order.forEach(p => {
        const c = cards.get(p.slug)!;
        const on = matches(p);
        c.hidden = !on;
        if (on) shown++;
        grid.appendChild(c); // re-order
      });

      empty.hidden = shown > 0;
      view.querySelector('[data-empty-q]')!.textContent = state.q || state.tag || state.category || state.level || '*';
      const text = `${shown} ${shown === 1 ? 'post' : 'posts'}${state.category ? ` in ${categoryById(state.category)!.label}` : ''}${state.level ? ` for ${levelById(state.level)!.label}` : ''}${state.tag ? ` tagged #${state.tag}` : ''}`;
      countEl.textContent = text;

      view.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.category === state.category)));
      view.querySelectorAll<HTMLButtonElement>('[data-tag]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tag === state.tag)));

      const qs = new URLSearchParams();
      if (state.q) qs.set('q', state.q);
      if (state.category) qs.set('category', state.category);
      if (state.level) qs.set('level', state.level);
      if (state.tag) qs.set('tag', state.tag);
      if (state.sort !== 'new') qs.set('sort', state.sort);
      ctx.router.replaceQuery(qs);

      if (!reduced && !first) {
        Flip.from(flipState, {
          duration: 0.3,
          overwrite: true,
          ease: 'power2.inOut',
          absolute: true,
          scale: true,
          onEnter: els => gsap.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, overwrite: true }),
          onLeave: els => gsap.to(els, { autoAlpha: 0, duration: 0.15, overwrite: true }),
          onComplete: () => ScrollTrigger.refresh(),
        });
      }
      first = false;
    };

    let debounce = 0;
    tools.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement | HTMLSelectElement;
      if (t.name === 'q') {
        window.clearTimeout(debounce);
        debounce = window.setTimeout(() => { state.q = t.value.trim(); apply(); }, 180);
      } else if (t.name === 'sort') {
        state.sort = t.value as Sort;
        apply();
      }
    });
    tools.addEventListener('submit', e => e.preventDefault());
    tools.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>('button');
      if (!b) return;
      if (b.dataset.category !== undefined) { state.category = b.dataset.category as CategoryId | ''; state.level = ''; }
      else if (b.dataset.tag !== undefined) state.tag = state.tag === b.dataset.tag ? '' : b.dataset.tag;
      else return;
      apply();
    });

    apply();

    if (!reduced) {
      SplitText.create(view.querySelector('[data-split]')!, {
        type: 'chars',
        onSplit: self => gsap.from(self.chars, { autoAlpha: 0, yPercent: 80, stagger: 0.05, duration: 0.5, ease: 'relay' }),
      });
      gsap.from(grid.querySelectorAll('.post-card:not([hidden])'), { autoAlpha: 0, y: 24, stagger: 0.06, duration: 0.5, delay: 0.15 });
    }

    return () => window.clearTimeout(debounce);
  };

  return { el: view, mount, title: 'Blog' };
}

// ── Post ────────────────────────────────────────────────
export function createBlogPostView(ctx: RouteContext): ViewHandle {
  const post = getPost(ctx.params.slug);
  if (!post) {
    return {
      title: 'Post not found',
      el: createViewShell({
        className: 'view--blog',
        body: `
          <div class="container section">
            <span class="eyebrow">cat ./posts/${esc(ctx.params.slug)}.md</span>
            <h1 class="page-head__title">No such post</h1>
            <p class="lede" style="margin-bottom: var(--sp-5)">It may have been renamed or not published yet.</p>
            <a class="btn btn--primary" href="/blog">← all posts</a>
          </div>`,
      }),
    };
  }

  const { html, toc } = renderMarkdown(post.body);
  const all = getPosts();
  const i = all.findIndex(p => p.slug === post.slug);
  const newer = all[i - 1];
  const older = all[i + 1];

  const view = createViewShell({
    className: 'view--blog view--post',
    body: `
      <div class="read-progress" aria-hidden="true"><span></span></div>
      <article class="post container">
        <header class="post__head">
          <a class="post__back" href="/blog">← cd ..</a>
          <div class="post__chips">${post.category ? `<a href="/blog?category=${post.category}">${categoryBadge(post.category)}</a>` : ''}${levelBadges(post.levels)}</div>
          <h1 class="post__title">${esc(post.title)}</h1>
          ${post.summary ? `<p class="post__summary lede">${esc(post.summary)}</p>` : ''}
          <p class="post__meta">
            <time datetime="${post.date}">${formatDate(post.date)}</time>
            <span>${post.readingMinutes} min read</span>
            ${post.spec ? `<span title="Specification reference">spec: ${esc(post.spec)}</span>` : ''}
            ${post.draft ? '<span class="post-card__draft">draft (only visible in dev)</span>' : ''}
          </p>
        </header>

        <div class="post__layout ${toc.length >= 3 ? 'has-toc' : ''}">
          ${toc.length >= 3 ? `
            <nav class="post__toc" aria-label="On this page">
              <p class="post__toc-title">contents</p>
              <ol>${toc.map(t => `<li class="d${t.depth}"><a href="#${t.id}" data-toc="${t.id}">${esc(t.text)}</a></li>`).join('')}</ol>
            </nav>` : ''}
          <div class="prose" data-prose>${html}</div>
        </div>

        <footer class="post__foot">
          ${post.tags.length ? `<p class="post__tags">${post.tags.map(t => `<a class="chip" href="/blog?tag=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}</p>` : ''}
          <nav class="post__pager" aria-label="More posts">
            ${older ? `<a class="post__pager-link" href="/blog/${older.slug}"><span class="output--dim">← older</span>${esc(older.title)}</a>` : '<span></span>'}
            ${newer ? `<a class="post__pager-link post__pager-link--next" href="/blog/${newer.slug}"><span class="output--dim">newer →</span>${esc(newer.title)}</a>` : ''}
          </nav>
        </footer>
      </article>
    `,
  });

  const mount = () => {
    const reduced = prefersReducedMotion();
    const prose = view.querySelector<HTMLElement>('[data-prose]')!;
    enhanceCodeBlocks(prose);

    // Reading progress bar
    gsap.fromTo(view.querySelector('.read-progress span'), { scaleX: 0 }, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: prose, start: 'top 60%', end: 'bottom bottom', scrub: 0.3 },
    });

    // Highlight the current section in the table of contents
    const tocLinks = [...view.querySelectorAll<HTMLAnchorElement>('[data-toc]')];
    const tocTriggers: { link: HTMLAnchorElement; st: ScrollTrigger }[] = [];
    const syncToc = () => {
      const current = tocTriggers.filter(t => t.st.isActive).pop()?.link;
      tocLinks.forEach(l => l.classList.toggle('is-active', l === current));
    };
    tocLinks.forEach(link => {
      const heading = view.querySelector(`#${CSS.escape(link.dataset.toc!)}`);
      if (!heading) return;
      const st = ScrollTrigger.create({
        trigger: heading,
        start: 'top 40%',
        endTrigger: prose,
        end: 'bottom top',
        onToggle: syncToc,
      });
      tocTriggers.push({ link, st });
    });

    if (reduced) return;

    const title = view.querySelector<HTMLElement>('.post__title')!;
    SplitText.create(title, {
      type: 'words',
      autoSplit: true,
      onSplit: self => gsap.from(self.words, { autoAlpha: 0, y: 18, stagger: 0.04, duration: 0.5 }),
    });
    gsap.from(view.querySelectorAll('.post__chips, .post__summary, .post__meta'), { autoAlpha: 0, y: 10, stagger: 0.08, duration: 0.4, delay: 0.2 });

    ScrollTrigger.batch(prose.querySelectorAll('.code, .callout, img, table'), {
      start: 'top 90%',
      once: true,
      onEnter: els => gsap.from(els, { autoAlpha: 0, y: 20, stagger: 0.1, duration: 0.5 }),
    });
  };

  return { el: view, mount, title: post.title };
}
