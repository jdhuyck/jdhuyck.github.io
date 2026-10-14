import type { Template, FilledForm, ScalarField, RepeatableGroup, Matrix } from '../types';
import { FormStore } from '../storage';
import { canAddRow, nowValue } from '../layout';
import { createTimeslotEditor } from '../timeslot';
import { createTimerangeEditor, boundsFor, type Bounds } from '../timerange';

export interface FormFieldsViewOptions {
  template: Template;
  form: FilledForm;
  store: FormStore;
  onSaved?: (form: FilledForm) => void;
  /** Called after every edit (e.g. to refresh the lesson timeline). */
  onChange?: (form: FilledForm) => void;
}

export class FormFieldsView {
  private template: Template;
  private form: FilledForm;
  private store: FormStore;
  private onSaved?: (form: FilledForm) => void;
  private onChange?: (form: FilledForm) => void;
  private root: HTMLElement;
  private autosaveTimer: number | null = null;

  constructor(opts: FormFieldsViewOptions) {
    this.template = opts.template;
    this.form = opts.form;
    this.store = opts.store;
    this.onSaved = opts.onSaved;
    this.onChange = opts.onChange;

    this.root = document.createElement('form');
    this.root.className = 'fvf';
    this.root.setAttribute('novalidate', '');
    this.root.addEventListener('submit', (e) => e.preventDefault());
    this.render();
  }

  get element(): HTMLElement { return this.root; }
  getForm(): FilledForm { return this.form; }

  /** Scroll to a field and focus it. */
  focusField(id: string): void {
    const el = this.root.querySelector<HTMLElement>(`.fvf-field[data-field-id="${CSS.escape(id)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.querySelector<HTMLElement>('input, textarea, select, button')?.focus({ preventScroll: true });
  }

  save(): FilledForm {
    if (this.autosaveTimer !== null) { window.clearTimeout(this.autosaveTimer); this.autosaveTimer = null; }
    this.store.save(this.form);
    this.onSaved?.(this.form);
    return this.form;
  }

  /** Recompute values from the DOM, e.g. before switching views. */
  flush(): void {
    /* autosave already covers this; kept for symmetry with FormEditor */
    this.save();
  }

  /** Highlight fields that failed validation. Returns their elements. */
  markInvalid(ids: string[]): HTMLElement[] {
    this.clearInvalid();
    return ids
      .map(id => this.root.querySelector<HTMLElement>(`.fvf-field[data-field-id="${CSS.escape(id)}"]`))
      .filter((el): el is HTMLElement => !!el)
      .map(el => { el.classList.add('is-invalid'); return el; });
  }

  clearInvalid(): void {
    this.root.querySelectorAll('.fvf-field.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  }

  private caption(text: string, required?: boolean): HTMLElement {
    const caption = document.createElement('span');
    caption.className = 'fvf-field__label';
    caption.textContent = text;
    if (required) {
      const star = document.createElement('span');
      star.className = 'fvf-field__req';
      star.textContent = ' *';
      star.setAttribute('aria-hidden', 'true');
      caption.appendChild(star);
    }
    return caption;
  }

  private help(text: string): HTMLElement {
    const p = document.createElement('span');
    p.className = 'fvf-field__help';
    p.textContent = text;
    return p;
  }

  /**
   * One section per template section (e.g. planning / reflection), or a
   * single continuous form. Printed page breaks don't split the form.
   */
  private render(): void {
    this.root.innerHTML = '';
    const sections = this.template.sections?.length ? this.template.sections : [{ page: 0, title: '' }];
    const matrixOf = new Map<string, Matrix>();
    for (const mx of this.template.matrices ?? []) {
      for (const r of mx.rows) for (const c of mx.columns) matrixOf.set(`${mx.id}.${r.id}.${c.id}`, mx);
    }
    const drawn = new Set<Matrix>();

    sections.forEach((sec, i) => {
      const end = sections[i + 1]?.page ?? this.template.pageCount;
      const inSection = (page: number) => page >= sec.page && page < end;
      const section = document.createElement('section');
      section.className = 'fvf-section';

      if (sec.title) {
        const heading = document.createElement('h2');
        heading.className = 'fvf-section__title';
        heading.textContent = sec.title;
        section.appendChild(heading);
      }

      // Fields in order; a matrix is drawn whole where its first cell is.
      let grid: HTMLElement | null = null;
      for (const f of this.template.fields.filter(f => inSection(f.page))) {
        const mx = matrixOf.get(f.id);
        if (mx) {
          if (!drawn.has(mx)) { drawn.add(mx); section.appendChild(this.renderMatrix(mx)); grid = null; }
          continue;
        }
        if (!grid) {
          grid = document.createElement('div');
          grid.className = 'fvf-fields';
          section.appendChild(grid);
        }
        grid.appendChild(this.renderScalar(f));
      }

      for (const g of (this.template.groups ?? []).filter(g => inSection(g.page))) section.appendChild(this.renderGroup(g));

      if (section.childElementCount > (sec.title ? 1 : 0)) this.root.appendChild(section);
    });
  }

  /** A labelled-rows × labelled-columns table: each row lists its columns side by side. */
  private renderMatrix(mx: Matrix): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'fvf-group fvf-matrix';
    wrap.style.setProperty('--fvf-cols', String(mx.columns.length));

    const heading = document.createElement('h3');
    heading.className = 'fvf-group__title';
    heading.textContent = mx.label;
    wrap.appendChild(heading);

    const fields = new Map(this.template.fields.map(f => [f.id, f]));
    for (const r of mx.rows) {
      const row = document.createElement('div');
      row.className = 'fvf-matrix__row';
      const title = document.createElement('h4');
      title.className = 'fvf-matrix__label';
      title.textContent = r.label;
      row.appendChild(title);
      if (r.help) row.appendChild(this.help(r.help));

      const cells = document.createElement('div');
      cells.className = 'fvf-matrix__cells';
      for (const c of mx.columns) {
        const f = fields.get(`${mx.id}.${r.id}.${c.id}`);
        if (!f) continue;
        const cell = this.renderScalar({ ...f, label: c.label, help: undefined });
        cell.classList.remove('fvf-field--wide');
        cells.appendChild(cell);
      }
      row.appendChild(cells);
      wrap.appendChild(row);
    }
    return wrap;
  }

  private renderScalar(f: ScalarField): HTMLElement {
    const label = document.createElement('label');
    label.className = 'fvf-field';
    label.dataset.fieldId = f.id;
    if (f.type === 'multiline') label.classList.add('fvf-field--wide');
    if (f.type === 'checkbox') label.classList.add('fvf-field--check');

    label.appendChild(this.caption(f.label, f.required));

    const control = this.buildControl(f.type, this.form.values[f.id] ?? '', {
      options: f.options,
      placeholder: f.placeholder,
      required: f.required,
      bounds: () => boundsFor(this.form, f),
      onInput: (v) => { this.form.values[f.id] = v; label.classList.remove('is-invalid'); this.scheduleAutosave(); },
    });
    if (f.now && (f.type === 'date' || f.type === 'time') && control instanceof HTMLInputElement) {
      const type = f.type;
      const row = document.createElement('span');
      row.className = 'fvf-now';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ibtn';
      btn.textContent = type === 'date' ? 'today' : 'now';
      btn.title = type === 'date' ? "Use today's date" : 'Use the current time';
      btn.addEventListener('click', (e) => {
        e.preventDefault(); // don't let the <label> refocus the input first
        control.value = nowValue(type);
        control.dispatchEvent(new Event('input', { bubbles: true }));
      });
      row.append(control, btn);
      label.appendChild(row);
    } else {
      label.appendChild(control);
    }
    if (f.help) label.appendChild(this.help(f.help));
    return label;
  }

  private renderGroup(g: RepeatableGroup): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'fvf-group';

    const heading = document.createElement('h3');
    heading.className = 'fvf-group__title';
    heading.textContent = g.label;
    wrap.appendChild(heading);

    const rows = (this.form.rows[g.id] ??= Array.from(
      { length: g.initialRows ?? 1 }, () => ({}),
    ));

    const rowsEl = document.createElement('div');
    rowsEl.className = 'fvf-rows';

    const paint = () => {
      rowsEl.innerHTML = '';
      rows.forEach((row, i) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'fvf-row';
        rowEl.dataset.row = String(i + 1);

        for (const rf of g.fields) {
          const cell = document.createElement('label');
          cell.className = 'fvf-field';
          cell.dataset.fieldId = `${g.id}.${i}.${rf.id}`;
          if (rf.type === 'multiline') cell.classList.add('fvf-field--wide');

          cell.appendChild(this.caption(rf.label, rf.required));

          const control = this.buildControl(rf.type, row[rf.id] ?? '', {
            options: rf.options,
            required: rf.required,
            bounds: () => boundsFor(this.form, rf, g, i),
            onInput: (v) => { row[rf.id] = v; cell.classList.remove('is-invalid'); this.scheduleAutosave(); },
          });
          cell.appendChild(control);
          rowEl.appendChild(cell);
        }

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'ibtn fvf-row__remove';
        remove.title = 'remove row';
        remove.textContent = '×';
        remove.disabled = rows.length <= 1;
        remove.addEventListener('click', () => {
          rows.splice(i, 1);
          this.scheduleAutosave();
          paint();
          syncAdd();
        });
        rowEl.appendChild(remove);

        rowsEl.appendChild(rowEl);
      });
    };
    paint();

    wrap.appendChild(rowsEl);

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'ibtn fvf-group__add';
    add.textContent = `+ ${g.addLabel ?? 'add row'}`;
    const syncAdd = () => { add.disabled = !canAddRow(g, rows.length); };
    syncAdd();
    add.addEventListener('click', () => {
      if (!canAddRow(g, rows.length)) return;
      rows.push({});
      this.scheduleAutosave();
      paint();
      syncAdd();
    });
    wrap.appendChild(add);

    return wrap;
  }

  private buildControl(
    type: string,
    initial: string,
    opts: { options?: string[]; placeholder?: string; required?: boolean; bounds?: () => Bounds; onInput: (v: string) => void },
  ): HTMLElement {
    const el = this.buildBareControl(type, initial, opts);
    if (opts.required) el.setAttribute('aria-required', 'true');
    return el;
  }

  private buildBareControl(
    type: string,
    initial: string,
    opts: { options?: string[]; placeholder?: string; bounds?: () => Bounds; onInput: (v: string) => void },
  ): HTMLElement {
    if (type === 'timeslot') return createTimeslotEditor(initial, opts.onInput);
    if (type === 'timerange') return createTimerangeEditor(initial, opts.onInput, opts.bounds ?? (() => ({})));

    if (type === 'multiline') {
      const ta = document.createElement('textarea');
      ta.className = 'fvf-control';
      ta.rows = 3;
      ta.value = initial;
      ta.addEventListener('input', () => opts.onInput(ta.value));
      return ta;
    }

    if (type === 'checkbox') {
      const cb = document.createElement('input');
      cb.className = 'fvf-control fvf-control--check';
      cb.type = 'checkbox';
      cb.checked = initial === 'true';
      cb.addEventListener('change', () => opts.onInput(cb.checked ? 'true' : 'false'));
      return cb;
    }

    if (type === 'select') {
      const sel = document.createElement('select');
      sel.className = 'fvf-control';
      sel.appendChild(new Option('', ''));
      for (const opt of opts.options ?? []) {
        const o = document.createElement('option');
        o.value = opt; o.textContent = opt;
        if (opt === initial) o.selected = true;
        sel.appendChild(o);
      }
      sel.addEventListener('change', () => opts.onInput(sel.value));
      return sel;
    }

    const input = document.createElement('input');
    input.className = 'fvf-control';
    input.type = type === 'date' ? 'date' : type === 'time' ? 'time' : 'text';
    input.value = initial;
    if (opts.placeholder) input.placeholder = opts.placeholder;
    input.addEventListener('input', () => opts.onInput(input.value));
    return input;
  }

  private scheduleAutosave(): void {
    this.onChange?.(this.form);
    if (this.autosaveTimer !== null) window.clearTimeout(this.autosaveTimer);
    this.autosaveTimer = window.setTimeout(() => {
      this.save();
      this.autosaveTimer = null;
    }, 600);
  }
}
