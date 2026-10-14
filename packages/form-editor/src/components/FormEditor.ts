import type { Template, FilledForm, RepeatableGroup, Rect } from '../types';
import { loadPdf, renderPage, pdfRectToPercent, ptToCss, createPageShell } from '../pdf/render';
import { layoutForm, type Cell, type Layout } from '../pdf/flow';
import { helveticaMetrics, PAD_X, PAD_Y } from '../pdf/fit';
import { nowValue } from '../layout';
import { createTimeslotEditor, formatTimeslot, parseTimeslot } from '../timeslot';
import { createTimerangeEditor, formatTimerange, parseTimerange, boundsFor } from '../timerange';
import { FormStore } from '../storage';

export interface FormEditorOptions {
  template: Template;
  form: FilledForm;
  store: FormStore;
  onSaved?: (form: FilledForm) => void;
  /** Called after every edit (e.g. to refresh the lesson timeline). */
  onChange?: (form: FilledForm) => void;
}

interface Control {
  wrap: HTMLElement;
  input?: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  /** Display element for timeslots and continuation previews. */
  display?: HTMLElement;
  number?: HTMLElement;
}

const RELAYOUT_MS = 120;

/**
 * Fill a form on its printed pages, as they will be exported. Pages are
 * composed from bands of the template (via the shared flow layout), so
 * boxes grow as you type, tables show exactly your rows, and content moves
 * onto new pages when it runs out of room.
 */
export class FormEditor {
  private template: Template;
  private form: FilledForm;
  private store: FormStore;
  private onSaved?: (form: FilledForm) => void;
  private onChange?: (form: FilledForm) => void;
  private root: HTMLElement;
  private sources: HTMLCanvasElement[] = [];
  private pages: Array<{ shell: HTMLElement; canvas: HTMLCanvasElement; overlay: HTMLElement; ctrls: HTMLElement }> = [];
  private controls = new Map<string, Control>();
  private layout: Layout | null = null;
  private bandKey = '';
  private autosaveTimer: number | null = null;
  private relayoutTimer: number | null = null;
  private popover: HTMLElement | null = null;
  private metrics = helveticaMetrics();

  constructor(opts: FormEditorOptions) {
    this.template = opts.template;
    this.form = opts.form;
    this.store = opts.store;
    this.onSaved = opts.onSaved;
    this.onChange = opts.onChange;
    this.root = document.createElement('div');
    this.root.className = 'fe-editor';
    for (const g of this.template.groups ?? []) {
      if (!this.form.rows[g.id]?.length) this.form.rows[g.id] = Array.from({ length: g.initialRows ?? 1 }, () => ({}));
    }
  }

  get element(): HTMLElement { return this.root; }

  /** Throws if the template PDF cannot be loaded. */
  async mount(): Promise<HTMLElement> {
    const doc = await loadPdf(this.template.sourceUrl);
    for (let p = 0; p < this.template.pageCount; p++) this.sources.push(await renderPage(doc, p + 1));
    this.relayout();
    return this.root;
  }

  // ── Layout & painting ───────────────────────────────────

  private scheduleRelayout() {
    if (this.relayoutTimer !== null) window.clearTimeout(this.relayoutTimer);
    this.relayoutTimer = window.setTimeout(() => { this.relayoutTimer = null; this.relayout(); }, RELAYOUT_MS);
  }

  private relayout() {
    const layout = layoutForm(this.template, this.form, this.metrics, { mode: 'edit' });
    this.layout = layout;
    const key = JSON.stringify(layout.pages.map(p => [
      p.bands.map(b => [b.page, b.top, b.bottom, Math.round(b.y * 10), Math.round(b.h * 10), b.x?.from, b.x?.to]),
      p.labels.map(l => [l.text, Math.round(l.y * 10)]),
    ]));
    if (key !== this.bandKey) { this.bandKey = key; this.paintPages(layout); }
    this.placeControls(layout);
  }

  private paintPages(layout: Layout) {
    const { width: W, height: H } = layout.pageSize;
    while (this.pages.length < layout.pages.length) {
      const shell = createPageShell(layout.pageSize, this.pages.length);
      const canvas = document.createElement('canvas');
      const overlay = document.createElement('div');
      overlay.className = 'fe-overlay';
      const ctrls = document.createElement('div');
      ctrls.className = 'fe-overlay fe-overlay--ctrls';
      shell.append(canvas, overlay, ctrls);
      this.root.appendChild(shell);
      this.pages.push({ shell, canvas, overlay, ctrls });
    }
    while (this.pages.length > layout.pages.length) this.pages.pop()!.shell.remove();

    const src0 = this.sources[0];
    const k = src0.width / W; // source canvas px per pt
    layout.pages.forEach((out, i) => {
      const { canvas } = this.pages[i];
      canvas.width = Math.round(W * k);
      canvas.height = Math.round(H * k);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const b of out.bands) {
        const src = this.sources[b.page];
        const natural = b.top - b.bottom;
        const stretched = Math.abs(b.h - natural) > 0.01;
        // Stretched slices are thin: sample whole pixels inside the slice,
        // without smoothing, so neighbouring border lines don't bleed in.
        const sy = stretched ? Math.ceil((H - b.top) * k) : (H - b.top) * k;
        const sh = stretched ? Math.max(1, Math.floor((H - b.bottom) * k) - sy) : natural * k;
        const [x0, x1] = b.x?.from ?? [0, W];
        const [ox0, ox1] = b.x?.to ?? [0, W];
        ctx.imageSmoothingEnabled = !stretched;
        ctx.drawImage(src, x0 * k, sy, (x1 - x0) * k, sh, ox0 * k, b.y * k, (ox1 - ox0) * k, b.h * k);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      for (const l of out.labels) {
        ctx.font = `${l.bold ? 'bold ' : ''}${l.size * k}px Helvetica, Arial, sans-serif`;
        ctx.fillText(l.text, (l.x + l.w / 2) * k, (H - l.y) * k);
      }
    });
  }

  private placeControls(layout: Layout) {
    const seen = new Set<string>();
    const W = layout.pageSize.width;
    layout.pages.forEach((out, i) => {
      const page = this.pages[i];
      for (const cell of out.cells) {
        seen.add(cell.id);
        const ctl = this.controls.get(cell.id) ?? this.createControl(cell);
        this.controls.set(cell.id, ctl);
        if (ctl.wrap.parentElement !== page.overlay) page.overlay.appendChild(ctl.wrap);
        Object.assign(ctl.wrap.style, pdfRectToPercent(cell.rect, layout.pageSize));
        const size = cell.fit?.size ?? cell.field.fontSize ?? 10;
        ctl.wrap.style.setProperty('--fe-fs', ptToCss(size, W));
        ctl.wrap.style.setProperty('--fe-pad-x', ptToCss(PAD_X, W));
        ctl.wrap.style.setProperty('--fe-pad-y', ptToCss(PAD_Y, W));
        ctl.wrap.classList.toggle('fe-field--grows', cell.grows);
        if (cell.continued && ctl.display) ctl.display.textContent = cell.fit?.lines.join('\n') ?? '';
        if ((cell.type === 'timeslot' || cell.type === 'timerange') && ctl.display) {
          const text = cell.type === 'timeslot' ? formatTimeslot(parseTimeslot(cell.value)) : formatTimerange(parseTimerange(cell.value));
          ctl.display.textContent = text || (cell.type === 'timeslot' ? 'day · period · time' : 'set time');
          ctl.display.classList.toggle('is-empty', !text);
        }
        if (cell.number) {
          ctl.number ??= this.numberLabel(ctl.wrap);
          ctl.number.textContent = cell.number.text;
          ctl.number.style.left = ptToCss(cell.number.x - cell.rect.x, W);
        }
      }
      this.placeRowButtons(i, out.cells, layout);
    });
    for (const [id, ctl] of this.controls) {
      if (!seen.has(id)) { ctl.wrap.remove(); this.controls.delete(id); }
    }
  }

  private numberLabel(wrap: HTMLElement) {
    const n = document.createElement('span');
    n.className = 'fe-num';
    n.setAttribute('aria-hidden', 'true');
    wrap.appendChild(n);
    return n;
  }

  // ── Controls ────────────────────────────────────────────

  private write(cell: Cell, value: string) {
    if (cell.group && cell.row !== undefined) {
      const rows = this.form.rows[cell.group.id] ??= [];
      (rows[cell.row] ??= {})[cell.field.id] = value;
    } else {
      this.form.values[cell.field.id] = value;
    }
    this.scheduleAutosave();
    this.scheduleRelayout();
  }

  private createControl(cell: Cell): Control {
    const wrap = document.createElement('div');
    wrap.className = 'fe-field';
    wrap.dataset.fieldId = cell.id;
    wrap.title = cell.label + (cell.field.required ? ' (required)' : '');
    if (cell.field.required) wrap.classList.add('fe-field--required');

    if (cell.continued) {
      wrap.classList.add('fe-field--continued');
      const display = document.createElement('div');
      display.className = 'fe-continued';
      display.setAttribute('aria-label', cell.label);
      wrap.appendChild(display);
      return { wrap, display };
    }

    if (cell.type === 'timeslot' || cell.type === 'timerange') {
      const display = document.createElement('button');
      display.type = 'button';
      display.className = 'fe-control fe-timeslot';
      display.setAttribute('aria-label', `${cell.label}: choose`);
      display.addEventListener('click', () => this.openPicker(cell.id, display));
      wrap.appendChild(display);
      return { wrap, display };
    }

    let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const current = () => this.currentCell(cell.id) ?? cell;
    if (cell.type === 'checkbox') {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = cell.value === 'true';
      cb.addEventListener('change', () => this.write(current(), cb.checked ? 'true' : 'false'));
      input = cb;
    } else if (cell.type === 'select') {
      const sel = document.createElement('select');
      sel.appendChild(new Option('', ''));
      for (const opt of cell.field.options ?? []) sel.appendChild(new Option(opt, opt, false, opt === cell.value));
      sel.addEventListener('change', () => this.write(current(), sel.value));
      input = sel;
    } else if (cell.type === 'date' || cell.type === 'time') {
      const inp = document.createElement('input');
      inp.type = cell.type;
      inp.value = cell.value;
      inp.addEventListener('input', () => this.write(current(), inp.value));
      input = inp;
      if (cell.field.now) {
        const type = cell.type;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fe-now';
        btn.textContent = type === 'date' ? 'today' : 'now';
        btn.title = type === 'date' ? "Use today's date" : 'Use the current time';
        btn.addEventListener('click', () => { inp.value = nowValue(type); this.write(current(), inp.value); });
        wrap.appendChild(btn);
      }
    } else {
      // Text and multiline both wrap here: boxes grow instead of scrolling.
      const ta = document.createElement('textarea');
      ta.value = cell.value;
      ta.rows = 1;
      ta.spellcheck = true;
      if (cell.type === 'text') {
        ta.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
      }
      ta.addEventListener('input', () => this.write(current(), ta.value));
      input = ta;
    }
    input.classList.add('fe-control');
    input.setAttribute('aria-label', cell.label);
    if (cell.field.required) input.setAttribute('aria-required', 'true');
    if (cell.field.align) (input as HTMLElement).style.textAlign = cell.field.align;
    wrap.prepend(input);
    return { wrap, input };
  }

  private currentCell(id: string): Cell | undefined {
    for (const p of this.layout?.pages ?? []) for (const c of p.cells) if (c.id === id) return c;
    return undefined;
  }

  /** Popover editor for timeslot and timerange cells. */
  private openPicker(id: string, anchor: HTMLElement) {
    this.closePopover();
    const cell = this.currentCell(id);
    if (!cell) return;
    const write = (v: string) => this.write(this.currentCell(id) ?? cell, v);
    const editor = cell.type === 'timerange'
      ? createTimerangeEditor(cell.value, write, () => boundsFor(this.form, cell.field, cell.group, cell.row))
      : createTimeslotEditor(cell.value, write);
    const pop = document.createElement('div');
    pop.className = 'fe-popover';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', cell.label);
    const title = document.createElement('p');
    title.className = 'fe-popover__title';
    title.textContent = cell.label;
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'ibtn ibtn--accent fe-popover__done';
    done.textContent = 'done';
    done.addEventListener('click', () => { this.closePopover(); anchor.focus(); });
    pop.append(title, editor, done);
    this.root.appendChild(pop);

    const r = anchor.getBoundingClientRect();
    const host = this.root.getBoundingClientRect();
    pop.style.left = `${Math.max(0, Math.min(r.left - host.left, host.width - 300))}px`;
    pop.style.top = `${r.bottom - host.top + 6}px`;
    pop.querySelector<HTMLElement>('input, button')?.focus();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { this.closePopover(); anchor.focus(); } };
    const onDown = (e: PointerEvent) => { if (!pop.contains(e.target as Node) && e.target !== anchor) this.closePopover(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    this.popover = pop;
    (pop as HTMLElement & { cleanup?: () => void }).cleanup = () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }

  private closePopover() {
    if (!this.popover) return;
    (this.popover as HTMLElement & { cleanup?: () => void }).cleanup?.();
    this.popover.remove();
    this.popover = null;
  }

  // ── Row / list buttons ──────────────────────────────────

  private placeRowButtons(pageIndex: number, cells: Cell[], layout: Layout) {
    const { ctrls } = this.pages[pageIndex];
    ctrls.innerHTML = '';
    const W = layout.pageSize.width;
    const byGroup = new Map<RepeatableGroup, Map<number, Rect & { numberX?: number }>>();
    for (const c of cells) {
      if (!c.group || c.row === undefined || c.continued) continue;
      const rows = byGroup.get(c.group) ?? new Map();
      byGroup.set(c.group, rows);
      const r = rows.get(c.row);
      const top = c.rect.y + c.rect.h;
      if (!r) rows.set(c.row, { ...c.rect, numberX: c.number?.x });
      else {
        const x0 = Math.min(r.x, c.rect.x), y0 = Math.min(r.y, c.rect.y);
        rows.set(c.row, { ...r, x: x0, y: y0, w: Math.max(r.x + r.w, c.rect.x + c.rect.w) - x0, h: Math.max(r.y + r.h, top) - y0 });
      }
    }

    for (const [g, rows] of byGroup) {
      const all = this.form.rows[g.id] ?? [];
      const lastIndex = all.length - 1;
      const numbers = this.template.flow?.bands.find(b => 'group' in b && b.group === g.id && b.numbers);
      const numberX = numbers && 'numbers' in numbers ? numbers.numbers?.left : undefined;
      for (const [row, r] of rows) {
        const left = (numberX ?? r.numberX ?? r.x) - 13;
        const del = this.rowButton('×', `Remove ${g.label.toLowerCase()} ${row + 1}`, 'fe-row-btn--del', W);
        del.disabled = all.length <= 1;
        Object.assign(del.style, pdfRectToPercent({ x: Math.max(1, left), y: r.y + r.h - 11, w: 10, h: 10 }, layout.pageSize));
        del.addEventListener('click', () => this.removeRow(g, row));
        ctrls.appendChild(del);

        if (row === lastIndex) {
          // "+" sits in the gutter beside the last row's "×", so it never covers content below.
          const add = this.rowButton('+', `${g.addLabel ?? 'Add row'} (${g.label})`, 'fe-row-btn--add', W);
          add.disabled = all.length >= (g.maxRows ?? 40);
          Object.assign(add.style, pdfRectToPercent({ x: Math.max(1, left - 12), y: r.y + r.h - 11, w: 10, h: 10 }, layout.pageSize));
          add.addEventListener('click', () => this.addRow(g));
          ctrls.appendChild(add);
        }
      }
    }
  }

  private rowButton(text: string, label: string, cls: string, W: number) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `fe-row-btn ${cls}`;
    b.textContent = text;
    b.title = label;
    b.setAttribute('aria-label', label);
    b.style.fontSize = ptToCss(7, W);
    return b;
  }

  /** Drop a group's controls so they're rebuilt with the right row indices. */
  private resetGroup(g: RepeatableGroup) {
    for (const [id, ctl] of this.controls) {
      if (id.startsWith(`${g.id}.`)) { ctl.wrap.remove(); this.controls.delete(id); }
    }
  }

  private addRow(g: RepeatableGroup) {
    const rows = this.form.rows[g.id] ??= [];
    if (rows.length >= (g.maxRows ?? 40)) return;
    rows.push({});
    this.scheduleAutosave();
    this.relayout();
    const first = g.fields[0];
    this.controls.get(`${g.id}.${rows.length - 1}.${first.id}`)?.input?.focus();
  }

  private removeRow(g: RepeatableGroup, index: number) {
    const rows = this.form.rows[g.id] ?? [];
    if (rows.length <= 1) return;
    rows.splice(index, 1);
    this.resetGroup(g);
    this.scheduleAutosave();
    this.relayout();
  }

  // ── Validation highlighting & saving ────────────────────

  /** Highlight fields that failed validation. Returns their elements. */
  markInvalid(ids: string[]): HTMLElement[] {
    this.clearInvalid();
    return ids
      .map(id => this.controls.get(id)?.wrap)
      .filter((el): el is HTMLElement => !!el)
      .map(el => { el.classList.add('is-invalid'); return el; });
  }

  clearInvalid(): void {
    this.root.querySelectorAll('.fe-field.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  }

  private scheduleAutosave(): void {
    this.onChange?.(this.form);
    if (this.autosaveTimer !== null) window.clearTimeout(this.autosaveTimer);
    this.autosaveTimer = window.setTimeout(() => { this.autosaveTimer = null; this.save(); }, 600);
  }

  save(): FilledForm {
    if (this.autosaveTimer !== null) { window.clearTimeout(this.autosaveTimer); this.autosaveTimer = null; }
    this.store.save(this.form);
    this.onSaved?.(this.form);
    return this.form;
  }

  destroy(): void {
    this.closePopover();
    if (this.relayoutTimer !== null) window.clearTimeout(this.relayoutTimer);
  }

  /** Scroll to a field and focus (or open) it. */
  focusField(id: string): void {
    const ctl = this.controls.get(id);
    if (!ctl) return;
    ctl.wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const target = ctl.input ?? ctl.display;
    target?.focus({ preventScroll: true });
    if (ctl.display && !ctl.input && target instanceof HTMLButtonElement) target.click();
  }

  getForm(): FilledForm { return this.form; }
  getTemplate(): Template { return this.template; }
  /** Number of output pages in the current layout. */
  get pageCount(): number { return this.layout?.pages.length ?? 0; }
}
