import type { ViewHandle } from '../../../src/router';
import { createViewShell, esc } from '../../../src/views/_shell';
import { blogCategories, keyStages } from '../../../src/site';
import { parseFrontmatter } from '../../blog/src/frontmatter';
import { renderMarkdown, enhanceCodeBlocks } from '../../blog/src/markdown';
import templateSource from '../../blog/posts/_template.md?raw';
import '../../form-editor/src/styles/form-editor.css'; // shared form controls
import '../../blog/src/styles/blog.css'; // preview matches the published post
import './admin.css';

/**
 * Local-only blog editor at /admin (registered in `npm run dev` only).
 * Writes Markdown files to packages/blog/posts via the dev-server plugin in
 * ../vite-plugin.ts. Commit and push the file to publish it.
 */

interface Draft {
  slug: string;
  title: string;
  date: string;
  summary: string;
  category: string;
  levels: string[];
  tags: string;
  spec: string;
  draft: boolean;
  body: string;
}

const API = '/__blog-admin/posts';
const today = () => new Date().toISOString().slice(0, 10);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
const yamlStr = (s: string) => (/[:#[\]{},"']|^\s|\s$/.test(s) ? JSON.stringify(s) : s);

const fromSource = (slug: string, source: string): Draft => {
  const { data, body } = parseFrontmatter(source);
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const list = (v: unknown) => (Array.isArray(v) ? v : typeof v === 'string' && v ? v.split(',').map(x => x.trim()) : []);
  return {
    slug,
    title: str(data.title),
    date: str(data.date) || today(),
    summary: str(data.summary),
    category: str(data.category),
    levels: list(data.levels),
    tags: list(data.tags).join(', '),
    spec: str(data.spec),
    draft: data.draft === true,
    body: body.replace(/^\n+/, ''),
  };
};

const toSource = (d: Draft): string => {
  const lines = [
    '---',
    `title: ${yamlStr(d.title)}`,
    `date: ${d.date}`,
    `summary: ${yamlStr(d.summary)}`,
    d.category && `category: ${d.category}`,
    d.levels.length && `levels: [${d.levels.join(', ')}]`,
    d.tags.trim() && `tags: [${d.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).join(', ')}]`,
    d.spec.trim() && `spec: ${yamlStr(d.spec.trim())}`,
    d.draft && 'draft: true',
    '---',
  ].filter(Boolean);
  return `${lines.join('\n')}\n\n${d.body.trim()}\n`;
};

const blank = (): Draft => ({ ...fromSource('', templateSource), slug: '', title: '', summary: '', tags: '', spec: '', date: today(), draft: true });

export function createBlogAdminView(): ViewHandle {
  const view = createViewShell({
    className: 'view--admin',
    layout: 'split',
    theme: 'ide',
    body: `
      <header class="ide-bar">
        <nav class="ide-bar__crumbs" aria-label="Location">
          <span>~/blog/posts</span><span class="sep">/</span><span class="here" data-crumb>new post</span>
        </nav>
        <div class="ide-bar__actions">
          <button class="ibtn" type="button" data-cmd="new">:new</button>
          <button class="ibtn ibtn--accent" type="button" data-cmd="save" title="Save (Ctrl/⌘+S)">:w</button>
        </div>
      </header>
      <aside class="ide-sidebar" aria-label="Posts">
        <div class="ide-sidebar__section">
          <div class="ide-sidebar__heading">posts</div>
          <div data-list><p class="ide-sidebar__item output--dim">loading…</p></div>
        </div>
      </aside>
      <div class="ide-main admin">
        <form class="admin__form" data-form autocomplete="off">
          <div class="admin__meta">
            <label class="fvf-field fvf-field--wide"><span class="fvf-field__label">Title</span>
              <input class="fvf-control" name="title" required /></label>
            <label class="fvf-field"><span class="fvf-field__label">Slug (URL)</span>
              <input class="fvf-control" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="from the title" /></label>
            <label class="fvf-field"><span class="fvf-field__label">Date</span>
              <input class="fvf-control" name="date" type="date" required /></label>
            <label class="fvf-field fvf-field--wide"><span class="fvf-field__label">Summary</span>
              <input class="fvf-control" name="summary" maxlength="220" /></label>
            <label class="fvf-field"><span class="fvf-field__label">Category</span>
              <select class="fvf-control" name="category">
                <option value="">(none)</option>
                ${blogCategories.map(c => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}
              </select></label>
            <label class="fvf-field"><span class="fvf-field__label">Spec reference</span>
              <input class="fvf-control" name="spec" placeholder="e.g. OCR J277 2.1" /></label>
            <label class="fvf-field fvf-field--wide"><span class="fvf-field__label">Tags (comma separated)</span>
              <input class="fvf-control" name="tags" /></label>
            <fieldset class="admin__levels fvf-field--wide">
              <legend class="fvf-field__label">Audience</legend>
              ${keyStages.map(k => `<label><input type="checkbox" name="levels" value="${esc(k.label)}" /> ${esc(k.label)}</label>`).join('')}
              <label class="admin__draft"><input type="checkbox" name="draft" /> draft (dev only)</label>
            </fieldset>
          </div>
          <div class="admin__panes">
            <label class="admin__pane"><span class="sr-only">Markdown</span>
              <textarea class="admin__md" name="body" spellcheck="true"></textarea></label>
            <div class="admin__pane admin__preview prose" data-preview aria-label="Preview"></div>
          </div>
        </form>
      </div>
      <footer class="ide-status">
        <span class="ide-status__mode">EDIT</span>
        <span data-status>local only · files save to packages/blog/posts</span>
        <span class="ide-status__right" data-count></span>
      </footer>
    `,
  });

  const form = view.querySelector<HTMLFormElement>('[data-form]')!;
  const list = view.querySelector<HTMLElement>('[data-list]')!;
  const preview = view.querySelector<HTMLElement>('[data-preview]')!;
  const status = view.querySelector<HTMLElement>('[data-status]')!;
  const crumb = view.querySelector<HTMLElement>('[data-crumb]')!;
  const count = view.querySelector<HTMLElement>('[data-count]')!;
  const field = <T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(n: string) => form.elements.namedItem(n) as T;

  let current: Draft = blank();
  let editingSlug: string | null = null; // slug of the file being edited, if any
  let dirty = false;

  const setStatus = (t: string, tone: 'ok' | 'error' | 'info' = 'info') => {
    status.dataset.tone = tone;
    status.textContent = t;
  };

  const read = (): Draft => ({
    slug: field<HTMLInputElement>('slug').value.trim() || slugify(field<HTMLInputElement>('title').value),
    title: field<HTMLInputElement>('title').value.trim(),
    date: field<HTMLInputElement>('date').value,
    summary: field<HTMLInputElement>('summary').value.trim(),
    category: field<HTMLSelectElement>('category').value,
    levels: [...form.querySelectorAll<HTMLInputElement>('input[name="levels"]:checked')].map(i => i.value),
    tags: field<HTMLInputElement>('tags').value,
    spec: field<HTMLInputElement>('spec').value,
    draft: field<HTMLInputElement>('draft').checked,
    body: field<HTMLTextAreaElement>('body').value,
  });

  const fill = (d: Draft) => {
    current = d;
    field<HTMLInputElement>('title').value = d.title;
    field<HTMLInputElement>('slug').value = d.slug;
    field<HTMLInputElement>('date').value = d.date;
    field<HTMLInputElement>('summary').value = d.summary;
    field<HTMLSelectElement>('category').value = d.category;
    field<HTMLInputElement>('tags').value = d.tags;
    field<HTMLInputElement>('spec').value = d.spec;
    field<HTMLInputElement>('draft').checked = d.draft;
    form.querySelectorAll<HTMLInputElement>('input[name="levels"]').forEach(i => {
      i.checked = d.levels.some(l => l.toLowerCase() === i.value.toLowerCase());
    });
    field<HTMLTextAreaElement>('body').value = d.body;
    crumb.textContent = d.slug ? `${d.slug}.md` : 'new post';
    dirty = false;
    renderPreview();
  };

  const renderPreview = () => {
    const d = read();
    const { html } = renderMarkdown(d.body);
    preview.innerHTML = `<h1 class="admin__preview-title">${esc(d.title || 'Untitled')}</h1>${d.summary ? `<p class="lede">${esc(d.summary)}</p>` : ''}${html}`;
    enhanceCodeBlocks(preview);
    const words = d.body.split(/\s+/).filter(Boolean).length;
    count.textContent = `${words} words · ~${Math.max(1, Math.round(words / 200))} min`;
  };

  let previewTimer = 0;
  form.addEventListener('input', () => {
    dirty = true;
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(renderPreview, 150);
  });
  form.addEventListener('submit', e => e.preventDefault());

  const loadList = async (select?: string) => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const posts = (await res.json()) as { slug: string; source: string }[];
      posts.sort((a, b) => b.slug.localeCompare(a.slug));
      list.innerHTML = `<a class="ide-sidebar__item fe-new" href="#" data-new>+ new post</a>` + posts.map(p => {
        const d = fromSource(p.slug, p.source);
        return `<a class="ide-sidebar__item" href="#" data-slug="${esc(p.slug)}" title="${esc(d.title)}" ${p.slug === select ? 'aria-current="true"' : ''}>${d.draft ? '○ ' : '● '}${esc(d.title || p.slug)}</a>`;
      }).join('');
      list.querySelectorAll<HTMLAnchorElement>('[data-slug]').forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        if (dirty && !confirm('Discard unsaved changes?')) return;
        const p = posts.find(x => x.slug === a.dataset.slug)!;
        editingSlug = p.slug;
        fill(fromSource(p.slug, p.source));
        list.querySelectorAll('[aria-current]').forEach(x => x.removeAttribute('aria-current'));
        a.setAttribute('aria-current', 'true');
      }));
      list.querySelector('[data-new]')!.addEventListener('click', (e) => { e.preventDefault(); newPost(); });
    } catch {
      list.innerHTML = '<p class="ide-sidebar__item fe-bad">editor API unavailable: run <code>npm run dev</code></p>';
    }
  };

  const newPost = () => {
    if (dirty && !confirm('Discard unsaved changes?')) return;
    editingSlug = null;
    fill(blank());
    list.querySelectorAll('[aria-current]').forEach(x => x.removeAttribute('aria-current'));
    field<HTMLInputElement>('title').focus();
  };

  const save = async () => {
    const d = read();
    if (!d.title) { setStatus('E: a title is required', 'error'); field<HTMLInputElement>('title').focus(); return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) { setStatus('E: slug must be lower-case words joined by hyphens', 'error'); return; }
    const overwrite = editingSlug === d.slug;
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: d.slug, source: toSource(d), overwrite }),
      });
      const out = await res.json() as { ok?: boolean; path?: string; error?: string };
      if (!res.ok) throw new Error(out.error ?? `HTTP ${res.status}`);
      editingSlug = d.slug;
      current = d;
      dirty = false;
      crumb.textContent = `${d.slug}.md`;
      setStatus(`saved ${out.path}${d.draft ? ' (draft)' : ''}. Commit and push to publish`, 'ok');
      void loadList(d.slug);
    } catch (err) {
      setStatus(`E: ${err instanceof Error ? err.message : 'save failed'}`, 'error');
    }
  };

  view.querySelector('[data-cmd="new"]')!.addEventListener('click', newPost);
  view.querySelector('[data-cmd="save"]')!.addEventListener('click', () => void save());

  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void save(); }
  };
  const onBeforeUnload = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };

  const mount = () => {
    fill(current);
    void loadList();
    document.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.clearTimeout(previewTimer);
    };
  };

  return { el: view, mount, title: 'Write a post' };
}
