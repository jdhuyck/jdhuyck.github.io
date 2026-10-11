import type { ViewHandle } from '../../../src/router';
import { gsap, prefersReducedMotion } from '../../../src/gsap';
import { createViewShell, esc } from '../../../src/views/_shell';
import { templates } from './templates';
import { FormStore } from './storage';
import { FormEditor } from './components/FormEditor';
import { FormFieldsView } from './components/FormFieldsView';
import { createPlanTimeline } from './components/PlanTimeline';
import { exportForm, type ExportMode } from './pdf/export';
import { validateForm } from './validate';
import type { Template, ValidationIssue } from './types';
import './styles/form-editor.css';

const store = new FormStore();

/** Templates that were renamed: old id → new id. Saved forms follow the rename. */
const RENAMED: Record<string, string> = { 'uh-lesson-observation': 'uh-trainee-observation' };
for (const f of store.list()) {
  const to = RENAMED[f.templateId];
  if (to) { f.templateId = to; store.save(f); }
}

type Mode = 'pdf' | 'form' | 'measure';
type Editor = FormEditor | FormFieldsView;

const MODE_LABEL: Record<Mode, string> = { pdf: 'PDF', form: 'FORM', measure: 'MEASURE' };
const MEASURE_ENABLED = import.meta.env.DEV;

export function createFormEditorView(): ViewHandle {
  const body = `
    <header class="ide-bar">
      <nav class="ide-bar__crumbs" aria-label="Location" data-crumbs></nav>

      <div class="ide-bar__modes" data-modes hidden role="group" aria-label="View">
        <button class="ibtn" data-mode="pdf"  aria-pressed="true">pdf</button>
        <button class="ibtn" data-mode="form" aria-pressed="false">form</button>
        ${MEASURE_ENABLED ? '<button class="ibtn" data-mode="measure" aria-pressed="false" title="Template authoring (dev only)">measure</button>' : ''}
      </div>

      <div class="ide-bar__actions">
        <label class="fe-export-mode" data-cmd hidden>
          <span class="sr-only">Export as</span>
          <select data-export-mode>
            <option value="flatten">flattened</option>
            <option value="fillable">fillable</option>
          </select>
        </label>
        <button class="ibtn" data-cmd="save" hidden title="Save (Ctrl/⌘+S)">:w</button>
        <button class="ibtn ibtn--accent" data-cmd="export" hidden>:export</button>
      </div>
    </header>

    <aside class="ide-sidebar" data-sidebar aria-label="Templates and saved forms"></aside>
    <div class="ide-main" data-main></div>

    <footer class="ide-status">
      <span class="ide-status__mode" data-mode-indicator>NORMAL</span>
      <span data-status>ready</span>
      <span class="ide-status__right">
        <span data-meta>utf-8 · ts · pdf</span>
      </span>
    </footer>
  `;

  const view = createViewShell({ body, className: 'view--forms', layout: 'split', theme: 'ide' });

  const sidebar  = view.querySelector<HTMLElement>('[data-sidebar]')!;
  const main     = view.querySelector<HTMLElement>('[data-main]')!;
  const crumbs   = view.querySelector<HTMLElement>('[data-crumbs]')!;
  const status   = view.querySelector<HTMLElement>('[data-status]')!;
  const meta     = view.querySelector<HTMLElement>('[data-meta]')!;
  const modeInd  = view.querySelector<HTMLElement>('[data-mode-indicator]')!;
  const modesEl  = view.querySelector<HTMLElement>('[data-modes]')!;
  const actions  = view.querySelectorAll<HTMLElement>('[data-cmd]');
  const saveBtn  = view.querySelector<HTMLButtonElement>('[data-cmd="save"]')!;
  const exportBtn = view.querySelector<HTMLButtonElement>('[data-cmd="export"]')!;
  const exportModeSel = view.querySelector<HTMLSelectElement>('[data-export-mode]')!;

  const reduced = prefersReducedMotion();

  // Status changes on every autosave and template click: plain text, no animation.
  const setStatus = (t: string, tone: 'ok' | 'error' | 'info' = 'info') => {
    status.dataset.tone = tone;
    status.textContent = t;
  };
  const setIndicator = (t: string) => { modeInd.textContent = t; };
  const showActions = (on: boolean) => actions.forEach(b => { b.hidden = !on; });

  let activeTemplateId: string | null = null;
  let activeFormId: string | null = null;
  let mode: Mode = 'pdf';
  let editor: Editor | null = null;

  const shortName = (t: Template) => t.name.replace(/^FoP: /, '');
  const fmtDate = (ms: number) => new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // ── Breadcrumbs: ~/forms / <template> / <form> ─────────
  const renderCrumbs = () => {
    const t = activeTemplateId ? templates.get(activeTemplateId) : null;
    const f = activeFormId ? store.get(activeFormId) : null;
    crumbs.innerHTML = `
      ${t ? '<a href="#" data-go="root">~/forms</a>' : '<span class="here">~/forms</span>'}
      ${t ? `<span class="sep">/</span>${f ? `<a href="#" data-go="dir">${esc(shortName(t))}</a>` : `<span class="here">${esc(shortName(t))}</span>`}` : ''}
      ${f ? `<span class="sep">/</span><button type="button" class="here fe-rename" data-go="rename" title="Rename">${esc(f.name)}</button>` : ''}
    `;
  };
  crumbs.addEventListener('click', (e) => {
    const go = (e.target as Element).closest<HTMLElement>('[data-go]')?.dataset.go;
    if (!go) return;
    e.preventDefault();
    if (go === 'root') openRoot();
    else if (go === 'dir' && activeTemplateId) openDirectory(activeTemplateId);
    else if (go === 'rename' && activeFormId) {
      const f = store.get(activeFormId);
      const name = f && prompt('Rename this form:', f.name)?.trim();
      if (f && name) {
        // Save the open editor first so the rename doesn't drop unsaved edits.
        const form = editor ? editor.save() : f;
        form.name = name;
        store.save(form);
        renderCrumbs();
        renderSidebar();
      }
    }
  });

  // ── Sidebar: templates (root) or one template's forms (directory) ──
  const renderSidebar = (animate = false) => {
    if (!activeTemplateId) {
      const byCategory = new Map<string, Template[]>();
      for (const t of templates.list()) {
        const c = t.category ?? 'Templates';
        byCategory.set(c, [...(byCategory.get(c) ?? []), t]);
      }
      sidebar.innerHTML = [...byCategory].map(([category, tpls]) => `
        <div class="ide-sidebar__section">
          <div class="ide-sidebar__heading">${esc(category)}</div>
          ${tpls.map(t => {
            const n = store.listByTemplate(t.id).length;
            return `<a class="ide-sidebar__item fe-dir" data-tpl="${esc(t.id)}" href="#" title="${esc(t.name)}">
              <span class="fe-dir__name">${esc(shortName(t))}/</span>${n ? `<span class="fe-dir__count">${n}</span>` : ''}</a>`;
          }).join('')}
        </div>`).join('');
    } else {
      const t = templates.get(activeTemplateId)!;
      const forms = store.listByTemplate(t.id);
      sidebar.innerHTML = `
        <div class="ide-sidebar__section">
          <a class="ide-sidebar__item fe-up" data-up href="#">← all templates</a>
        </div>
        <div class="ide-sidebar__section">
          <div class="ide-sidebar__heading" title="${esc(t.name)}">${esc(shortName(t))}/</div>
          <a class="ide-sidebar__item fe-new" data-new href="#">+ new form</a>
          ${forms.map(f => `
            <div class="fe-saved">
              <a class="ide-sidebar__item" data-open="${esc(f.id)}" href="#" title="Last edited ${fmtDate(f.updatedAt)}"
                 ${f.id === activeFormId ? 'aria-current="true"' : ''}>${esc(f.name)}</a>
              <button class="fe-saved__del" type="button" data-del="${esc(f.id)}" aria-label="Delete ${esc(f.name)}" title="Delete">×</button>
            </div>`).join('')}
          ${forms.length ? '' : '<p class="ide-sidebar__item output--dim fe-none">no saved forms</p>'}
        </div>`;
    }
    if (animate && !reduced) {
      gsap.from(sidebar.querySelectorAll('.ide-sidebar__item'), { autoAlpha: 0, duration: 0.2, stagger: 0.015 });
    }
  };

  const defaultName = (t: Template) => {
    const base = `${shortName(t)} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    const taken = new Set(store.listByTemplate(t.id).map(f => f.name));
    let name = base;
    for (let i = 2; taken.has(name); i++) name = `${base} (${i})`;
    return name;
  };

  const createForm = (name?: string) => {
    if (!activeTemplateId) return;
    const t = templates.get(activeTemplateId)!;
    const form = store.create(t.id, name?.trim() || defaultName(t));
    void openForm(t.id, form.id);
  };

  const deleteForm = (id: string) => {
    const f = store.get(id);
    if (!f || !confirm(`Delete “${f.name}”? This can't be undone.`)) return;
    store.delete(f.id);
    setStatus(`deleted ${f.name}`);
    if (activeFormId === f.id) openDirectory(f.templateId);
    else { renderSidebar(); if (!activeFormId) openDirectory(f.templateId); }
  };

  sidebar.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const tpl = t.closest<HTMLElement>('[data-tpl]');
    const open = t.closest<HTMLElement>('[data-open]');
    const del = t.closest<HTMLElement>('[data-del]');
    const isNew = t.closest('[data-new]');
    const up = t.closest('[data-up]');
    if (!tpl && !open && !del && !isNew && !up) return;
    e.preventDefault();
    if (up) openRoot();
    else if (tpl) openDirectory(tpl.dataset.tpl!);
    else if (isNew) createForm();
    else if (open && activeTemplateId) void openForm(activeTemplateId, open.dataset.open!);
    else if (del) deleteForm(del.dataset.del!);
  });

  // ── Modes ──────────────────────────────────────────────
  const setMode = (next: Mode) => {
    mode = next;
    modesEl.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.mode === next));
    });
    setIndicator(MODE_LABEL[next]);
    if (activeTemplateId && activeFormId) {
      editor?.save();
      void openForm(activeTemplateId, activeFormId);
    }
  };
  modesEl.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => {
    b.addEventListener('click', () => setMode(b.dataset.mode as Mode));
  });

  const closeEditor = () => {
    if (editor) { editor.save(); if ('destroy' in editor) editor.destroy(); }
    editor = null;
    showActions(false);
    modesEl.hidden = true;
    setIndicator('NORMAL');
  };

  // ── Root: every template ───────────────────────────────
  const openRoot = () => {
    closeEditor();
    activeTemplateId = null;
    activeFormId = null;
    renderCrumbs();
    renderSidebar();
    const count = templates.list().length;
    main.innerHTML = `
      <div class="fe-empty">
        <p class="prompt">ls ~/forms</p>
        <p class="output--muted">${count} template${count === 1 ? '' : 's'}. Open one to start a new form or carry on with a saved one.</p>
        <p class="output--dim fe-empty__small">Forms are saved in this browser only (localStorage). Export a PDF to keep a copy.</p>
      </div>`;
    setStatus('ready');
  };

  // ── Directory: one template's forms ────────────────────
  const openDirectory = (templateId: string) => {
    closeEditor();
    activeTemplateId = templateId;
    activeFormId = null;
    const t = templates.get(templateId)!;
    renderCrumbs();
    renderSidebar();
    const forms = store.listByTemplate(t.id);
    main.innerHTML = `
      <div class="fe-dirview">
        <p class="prompt">ls ~/forms/${esc(t.id)}</p>
        <h2 class="fe-dirview__title">${esc(t.name)}</h2>
        ${t.description ? `<p class="output--muted">${esc(t.description)}</p>` : ''}
        <form class="fe-dirview__new" data-new-form>
          <label><span class="sr-only">Name for the new form</span>
            <input class="fvf-control" name="name" value="${esc(defaultName(t))}" /></label>
          <button class="ibtn ibtn--accent" type="submit">+ new form</button>
        </form>
        ${forms.length ? `
          <table class="fe-dirview__table">
            <thead><tr><th scope="col">name</th><th scope="col">last edited</th><th scope="col"><span class="sr-only">actions</span></th></tr></thead>
            <tbody>
              ${forms.map(f => `
                <tr>
                  <td><a href="#" data-open-form="${esc(f.id)}">${esc(f.name)}</a></td>
                  <td class="output--dim">${fmtDate(f.updatedAt)}</td>
                  <td><button type="button" class="fe-saved__del fe-dirview__del" data-del-form="${esc(f.id)}" aria-label="Delete ${esc(f.name)}">×</button></td>
                </tr>`).join('')}
            </tbody>
          </table>` : '<p class="output--dim">No saved forms yet.</p>'}
        <p class="output--dim fe-empty__small" data-src>checking template PDF…</p>
      </div>`;
    setStatus(`${forms.length} saved`);

    const newForm = main.querySelector<HTMLFormElement>('[data-new-form]')!;
    newForm.addEventListener('submit', (e) => {
      e.preventDefault();
      createForm(newForm.querySelector<HTMLInputElement>('input[name="name"]')!.value);
    });
    main.querySelector('.fe-dirview__table')?.addEventListener('click', (e) => {
      const el = e.target as Element;
      const open = el.closest<HTMLElement>('[data-open-form]');
      const del = el.closest<HTMLElement>('[data-del-form]');
      if (open) { e.preventDefault(); void openForm(t.id, open.dataset.openForm!); }
      if (del) deleteForm(del.dataset.delForm!);
    });

    void pdfExists(t.sourceUrl).then(ok => {
      const src = main.querySelector<HTMLElement>('[data-src]');
      if (!src) return;
      src.innerHTML = ok
        ? `${t.pageCount} page template · ${t.fields.length} fields`
        : `<span class="fe-bad">✗</span> template PDF missing. Add it at <code>public${esc(t.sourceUrl)}</code>. Form view still works.`;
    });
  };

  // ── Issues panel ───────────────────────────────────────
  const renderIssues = (issues: ValidationIssue[]) => {
    main.querySelector('.fe-issues')?.remove();
    if (!issues.length) { editor?.clearInvalid(); return; }

    const panel = document.createElement('div');
    panel.className = 'fe-issues';
    panel.setAttribute('role', 'alert');
    panel.innerHTML = `
      <p class="fe-issues__title">E${String(issues.length).padStart(3, '0')}: fix ${issues.length} problem${issues.length === 1 ? '' : 's'} before exporting</p>
      <ul>${issues.map((iss, i) => `<li><button type="button" data-issue="${i}">${esc(iss.message)}</button></li>`).join('')}</ul>
    `;
    main.prepend(panel);
    panel.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>('[data-issue]');
      if (!b) return;
      const ids = issues[Number(b.dataset.issue)].fieldIds;
      const el = editor?.markInvalid(ids)[0];
      el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      el?.querySelector<HTMLElement>('input, textarea, select')?.focus({ preventScroll: true });
    });

    const bad = editor?.markInvalid(issues.flatMap(i => i.fieldIds)) ?? [];
    if (!reduced) {
      gsap.from(panel, { autoAlpha: 0, y: -8, duration: 0.3 });
      gsap.fromTo(bad, { x: 0 }, { x: 5, duration: 0.5, ease: 'shake', clearProps: 'x' });
    }
  };

  // ── Open a form ────────────────────────────────────────
  const openForm = async (templateId: string, formId: string) => {
    const template = templates.get(templateId);
    const form = store.get(formId);
    if (!template || !form) return;
    if (template.migrate?.(form)) store.save(form);

    closeEditor();
    activeTemplateId = templateId;
    activeFormId = formId;
    renderCrumbs();
    showActions(mode !== 'measure');
    modesEl.hidden = false;
    setIndicator(MODE_LABEL[mode]);
    meta.textContent = `${template.pageSize.width}×${template.pageSize.height}pt · ${template.pageCount}p`;
    renderSidebar();

    main.innerHTML = '';
    // Lesson timeline (lesson plan only): on screen, never exported.
    const timeline = mode === 'measure' ? null : createPlanTimeline(template, id => editor?.focusField(id));
    if (timeline) { main.appendChild(timeline.el); timeline.update(form); }
    const onChange = timeline ? (f: typeof form) => timeline.update(f) : undefined;
    const host = document.createElement('div');
    host.className = 'fe-editor-host';
    main.appendChild(host);

    const pages = () => (editor instanceof FormEditor ? ` · ${editor.pageCount} page${editor.pageCount === 1 ? '' : 's'}` : '');
    const onSaved = () => setStatus(`saved · ${new Date().toLocaleTimeString('en-GB')}${pages()}`, 'ok');

    if (mode === 'measure') {
      editor = null;
      setStatus('drag to measure');
      try {
        const { mountCoordPicker } = await import('./components/CoordPicker');
        await mountCoordPicker(template, host);
      } catch {
        host.innerHTML = `<p class="fe-bad">Couldn't load <code>${esc(template.sourceUrl)}</code>.</p>`;
      }
      return;
    }

    if (mode === 'pdf') {
      setStatus('loading pdf…');
      const ed = new FormEditor({ template, form, store, onSaved, onChange });
      try {
        await ed.mount();
      } catch {
        editor = null;
        host.innerHTML = `
          <div class="fe-empty">
            <p class="fe-bad">✗ couldn't load the template PDF</p>
            <p class="output--muted">Expected it at <code>public${esc(template.sourceUrl)}</code>. You can still fill everything in using form view.</p>
            <button class="ibtn ibtn--accent" type="button" data-to-form>switch to form view</button>
          </div>`;
        host.querySelector('[data-to-form]')!.addEventListener('click', () => setMode('form'));
        setStatus('pdf missing', 'error');
        return;
      }
      if (activeFormId !== formId || mode !== 'pdf') return; // user moved on while loading
      host.appendChild(ed.element);
      editor = ed;
    } else {
      const fv = new FormFieldsView({ template, form, store, onSaved, onChange });
      host.appendChild(fv.element);
      editor = fv;
    }
    setStatus('editing');
  };

  // ── Commands ───────────────────────────────────────────
  const save = () => { editor?.save(); };

  const doExport = async () => {
    if (!editor || !activeTemplateId) return;
    const template = templates.get(activeTemplateId)!;
    const form = editor.save();

    const issues = validateForm(template, form);
    renderIssues(issues);
    if (issues.length) {
      setStatus(`E: ${issues.length} problem${issues.length === 1 ? '' : 's'}`, 'error');
      return;
    }

    setStatus('exporting…');
    exportBtn.disabled = true;
    try {
      const exportMode = exportModeSel.value as ExportMode;
      const { bytes, truncated, pageCount } = await exportForm(template, form, exportMode);
      await saveBytesToDisk(bytes, `${form.name}.pdf`);
      setStatus(truncated.length
        ? `exported · ${truncated.length} field${truncated.length === 1 ? '' : 's'} truncated: ${truncated.slice(0, 2).join(', ')}${truncated.length > 2 ? '…' : ''}`
        : `exported ${exportMode} pdf · ${pageCount} page${pageCount === 1 ? '' : 's'} ✓`, truncated.length ? 'error' : 'ok');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'export failed', 'error');
    } finally {
      exportBtn.disabled = false;
    }
  };

  saveBtn.addEventListener('click', save);
  exportBtn.addEventListener('click', () => void doExport());

  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && editor) {
      e.preventDefault();
      save();
    }
  };

  const mount = () => {
    document.addEventListener('keydown', onKey);
    openRoot();
    renderSidebar(true);
    return () => {
      document.removeEventListener('keydown', onKey);
      closeEditor();
    };
  };

  return { el: view, mount, title: 'Forms' };
}

async function pdfExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    // Dev servers and GitHub Pages' SPA fallback return HTML for missing files.
    return res.ok && !(res.headers.get('content-type') ?? '').includes('text/html');
  } catch {
    return false;
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}

async function saveBytesToDisk(bytes: Uint8Array, suggestedName: string): Promise<void> {
  const blob = new Blob([toArrayBuffer(bytes)], { type: 'application/pdf' });

  const w = window as Window & {
    showSaveFilePicker?: (o: unknown) => Promise<{
      createWritable(): Promise<{ write(b: Blob): Promise<void>; close(): Promise<void> }>;
    }>;
  };

  if (typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.dataset.router = 'off';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
