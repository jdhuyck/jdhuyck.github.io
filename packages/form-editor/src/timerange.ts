import type { FilledForm, RepeatableGroup, RowField, ScalarField } from './types';
import { parseTimeslot } from './timeslot';

/**
 * Time ranges (e.g. a stage of a lesson): start, end and duration.
 * Stored as JSON `{ start, end }` (HH:MM); duration is derived.
 * Older forms may hold free text (e.g. "0–5"): it's kept and shown as-is.
 */

export interface Timerange { start?: string; end?: string; legacy?: string }

export const toMinutes = (t?: string): number | undefined => {
  const m = t ? /^(\d{1,2}):(\d{2})$/.exec(t) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
};
const pad = (n: number) => String(n).padStart(2, '0');
export const fromMinutes = (n: number): string => `${pad(Math.floor(n / 60) % 24)}:${pad(n % 60)}`;

export function parseTimerange(value: string | undefined): Timerange {
  if (!value) return {};
  try {
    const v = JSON.parse(value) as Timerange;
    if (v && typeof v === 'object') return { start: v.start || undefined, end: v.end || undefined };
  } catch { /* free text from before */ }
  return { legacy: value };
}

export const serializeTimerange = (r: Timerange): string =>
  r.legacy ?? (r.start || r.end ? JSON.stringify({ start: r.start, end: r.end }) : '');

export const durationOf = (r: Timerange): number | undefined => {
  const s = toMinutes(r.start), e = toMinutes(r.end);
  return s !== undefined && e !== undefined && e >= s ? e - s : undefined;
};

/**
 * "10:50 – 11:05 (15 min)": spaced so narrow cells wrap between the times
 * rather than inside one. Just the start, or legacy text, otherwise.
 */
export function formatTimerange(r: Timerange): string {
  if (r.legacy) return r.legacy;
  if (r.start && r.end) {
    const d = durationOf(r);
    return `${r.start} – ${r.end}${d !== undefined ? ` (${d}\u00a0min)` : ''}`; // nbsp: never split "15 min"
  }
  return r.start ?? (r.end ? `– ${r.end}` : '');
}

export interface Bounds {
  /** Lesson window, HH:MM. */
  min?: string;
  max?: string;
  /** Suggested start, e.g. the previous stage's end. */
  suggest?: string;
}

/** Problems with a range, given its bounds (for validation and hints). */
export function rangeProblems(r: Timerange, b: Bounds): string[] {
  if (r.legacy) return [];
  const s = toMinutes(r.start), e = toMinutes(r.end), lo = toMinutes(b.min), hi = toMinutes(b.max);
  const out: string[] = [];
  if (s !== undefined && e !== undefined && e < s) out.push('ends before it starts');
  if (lo !== undefined && s !== undefined && s < lo) out.push(`starts before the lesson (${b.min})`);
  if (hi !== undefined && e !== undefined && e > hi) out.push(`ends after the lesson (${b.max})`);
  if (hi !== undefined && s !== undefined && s >= hi) out.push(`starts after the lesson ends (${b.max})`);
  return out;
}

/**
 * Start / end / duration controls. Filling end works out the duration and
 * vice versa; times are kept inside the lesson window from `bounds()`.
 */
export function createTimerangeEditor(
  value: string,
  onChange: (value: string) => void,
  bounds: () => Bounds,
): HTMLElement {
  const r = parseTimerange(value);
  if (r.legacy) { delete r.legacy; } // start afresh; the old text is replaced on first edit
  const el = document.createElement('div');
  el.className = 'tr';
  el.innerHTML = `
    <label class="tr__f"><span>start</span><input type="time" data-start /></label>
    <label class="tr__f"><span>end</span><input type="time" data-end /></label>
    <label class="tr__f tr__f--dur"><span>mins</span><input type="number" min="1" step="1" inputmode="numeric" data-dur /></label>
    <button type="button" class="tr__suggest" data-suggest hidden></button>
    <p class="tr__hint" data-hint aria-live="polite"></p>
  `;
  const start = el.querySelector<HTMLInputElement>('[data-start]')!;
  const end = el.querySelector<HTMLInputElement>('[data-end]')!;
  const dur = el.querySelector<HTMLInputElement>('[data-dur]')!;
  const hint = el.querySelector<HTMLElement>('[data-hint]')!;
  const suggest = el.querySelector<HTMLButtonElement>('[data-suggest]')!;
  let duration = durationOf(r);

  /** Keep values inside the lesson window and refresh inputs + hint. */
  const sync = (emit: boolean) => {
    const b = bounds();
    const lo = toMinutes(b.min), hi = toMinutes(b.max);
    let s = toMinutes(r.start), e = toMinutes(r.end);
    if (s !== undefined) {
      if (lo !== undefined && s < lo) s = lo;
      if (hi !== undefined && s > hi - 1) s = hi - 1;
      r.start = fromMinutes(s);
    }
    if (e !== undefined) {
      if (s !== undefined && e < s + 1) e = s + 1;
      if (hi !== undefined && e > hi) e = hi;
      r.end = fromMinutes(e);
    }
    duration = durationOf(r) ?? duration;

    start.value = r.start ?? '';
    end.value = r.end ?? '';
    dur.value = r.start && r.end ? String(durationOf(r)) : duration ? String(duration) : '';
    for (const i of [start, end]) { i.min = b.min ?? ''; i.max = b.max ?? ''; }
    dur.max = lo !== undefined && hi !== undefined ? String(hi - (s ?? lo)) : '';

    hint.textContent = b.min && b.max ? `lesson ${b.min}–${b.max}` : 'set the lesson time to keep stages inside it';
    suggest.hidden = !b.suggest || r.start === b.suggest;
    suggest.textContent = b.suggest ? `start at ${b.suggest}` : '';
    if (emit) onChange(serializeTimerange(r));
  };

  start.addEventListener('change', () => {
    r.start = start.value || undefined;
    const s = toMinutes(r.start);
    // Keep the duration you set; otherwise keep the end.
    if (s !== undefined && duration) r.end = fromMinutes(s + duration);
    sync(true);
  });
  end.addEventListener('change', () => {
    r.end = end.value || undefined;
    duration = durationOf(r);
    sync(true);
  });
  dur.addEventListener('change', () => {
    const d = Math.round(Number(dur.value));
    duration = d > 0 ? d : undefined;
    const s = toMinutes(r.start);
    if (s !== undefined && duration) r.end = fromMinutes(s + duration);
    else if (!duration) r.end = undefined;
    sync(true);
  });
  suggest.addEventListener('click', () => {
    const b = bounds();
    if (!b.suggest) return;
    r.start = b.suggest;
    const s = toMinutes(r.start)!;
    if (duration) r.end = fromMinutes(s + duration);
    sync(true);
  });

  // Bounds depend on other fields (lesson time, previous stage): refresh on focus.
  el.addEventListener('focusin', () => sync(false));
  sync(false);
  return el;
}

/**
 * Bounds for a timerange cell: the lesson window from its `within` timeslot,
 * and (in a table) the previous row's end as a suggested start.
 */
export function boundsFor(
  form: FilledForm,
  field: ScalarField | RowField,
  group?: RepeatableGroup,
  row?: number,
): Bounds {
  const slot = field.within ? parseTimeslot(form.values[field.within]) : { periods: [] };
  let suggest: string | undefined;
  if (group && row !== undefined) {
    const rows = form.rows[group.id] ?? [];
    for (let i = row - 1; i >= 0 && !suggest; i--) suggest = parseTimerange(rows[i]?.[field.id]).end;
    if (!suggest && row === 0) suggest = slot.start;
  }
  return { min: slot.start, max: slot.end, suggest };
}
