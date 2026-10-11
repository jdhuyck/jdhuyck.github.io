/**
 * Timeslot fields: a school day (Mon–Fri), one or more periods (P1–P6) and a
 * start–end time. Stored as a small JSON string in the form's values.
 */

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
export const PERIODS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as const;
export type Day = typeof DAYS[number];
export type Period = typeof PERIODS[number];

/**
 * Your school's bell times. Fill these in and picking periods will set the
 * start and end time automatically (start of the first, end of the last).
 * Leave as null to type times by hand.
 */
export const PERIOD_TIMES: Record<Period, [start: string, end: string] | null> = {
  P1: null,
  P2: null,
  P3: null,
  P4: null,
  P5: null,
  P6: null,
};

export interface Timeslot {
  day?: Day;
  periods: Period[];
  start?: string; // HH:MM
  end?: string;   // HH:MM
}

export function parseTimeslot(value: string | undefined): Timeslot {
  if (!value) return { periods: [] };
  try {
    const v = JSON.parse(value) as Partial<Timeslot>;
    return {
      day: DAYS.includes(v.day as Day) ? v.day : undefined,
      periods: (v.periods ?? []).filter((p): p is Period => PERIODS.includes(p as Period)),
      start: v.start || undefined,
      end: v.end || undefined,
    };
  } catch {
    // Older forms stored a plain HH:MM time here.
    return /^\d{1,2}:\d{2}$/.test(value) ? { periods: [], start: value } : { periods: [] };
  }
}

export const serializeTimeslot = (t: Timeslot): string =>
  t.day || t.periods.length || t.start || t.end ? JSON.stringify(t) : '';

export const isTimeslotEmpty = (value: string | undefined) => serializeTimeslot(parseTimeslot(value)) === '';

/** "P3–P4" for consecutive periods, "P1, P3" otherwise. */
export function formatPeriods(periods: Period[]): string {
  const idx = [...new Set(periods)].map(p => PERIODS.indexOf(p)).sort((a, b) => a - b);
  const runs: string[] = [];
  for (let i = 0; i < idx.length; i++) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
    runs.push(i === j ? PERIODS[idx[i]] : `${PERIODS[idx[i]]}–${PERIODS[idx[j]]}`);
    i = j;
  }
  return runs.join(', ');
}

/** e.g. "Mon · P3–P4 · 10:50–12:30" (any part may be missing). */
export function formatTimeslot(t: Timeslot): string {
  const time = t.start && t.end ? `${t.start}–${t.end}` : t.start ?? (t.end ? `until ${t.end}` : '');
  return [t.day, formatPeriods(t.periods), time].filter(Boolean).join(' · ');
}

/** Start/end from the bell times for the selected periods, if known. */
function bellTimes(periods: Period[]): { start?: string; end?: string } {
  const sorted = [...periods].sort((a, b) => PERIODS.indexOf(a) - PERIODS.indexOf(b));
  const first = sorted.length ? PERIOD_TIMES[sorted[0]] : null;
  const last = sorted.length ? PERIOD_TIMES[sorted[sorted.length - 1]] : null;
  return { start: first?.[0], end: last?.[1] };
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Controls for a timeslot: day buttons (single choice), period toggles
 * (any number), start/end time inputs and a "now" button.
 */
export function createTimeslotEditor(
  value: string,
  onChange: (value: string) => void,
  { compact = false }: { compact?: boolean } = {},
): HTMLElement {
  const t = parseTimeslot(value);
  const el = document.createElement('div');
  el.className = `ts${compact ? ' ts--compact' : ''}`;
  el.innerHTML = `
    <div class="ts__row" role="group" aria-label="Day">
      ${DAYS.map(d => `<button type="button" class="ts__chip" data-day="${d}" aria-pressed="${t.day === d}">${d}</button>`).join('')}
    </div>
    <div class="ts__row" role="group" aria-label="Periods (choose one or more)">
      ${PERIODS.map(p => `<button type="button" class="ts__chip" data-period="${p}" aria-pressed="${t.periods.includes(p)}">${p}</button>`).join('')}
    </div>
    <div class="ts__row ts__times">
      <label><span class="sr-only">Start time</span><input type="time" data-start value="${t.start ?? ''}" /></label>
      <span aria-hidden="true">–</span>
      <label><span class="sr-only">End time</span><input type="time" data-end value="${t.end ?? ''}" /></label>
      <button type="button" class="ts__now" data-now title="Today and the current time">now</button>
      <button type="button" class="ts__clear" data-clear title="Clear">clear</button>
    </div>
  `;

  const start = el.querySelector<HTMLInputElement>('[data-start]')!;
  const end = el.querySelector<HTMLInputElement>('[data-end]')!;

  const sync = () => {
    el.querySelectorAll<HTMLButtonElement>('[data-day]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.day === t.day)));
    el.querySelectorAll<HTMLButtonElement>('[data-period]').forEach(b => b.setAttribute('aria-pressed', String(t.periods.includes(b.dataset.period as Period))));
    start.value = t.start ?? '';
    end.value = t.end ?? '';
    onChange(serializeTimeslot(t));
  };

  el.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button');
    if (!b) return;
    e.preventDefault();
    if (b.dataset.day) {
      t.day = t.day === b.dataset.day ? undefined : b.dataset.day as Day;
    } else if (b.dataset.period) {
      const p = b.dataset.period as Period;
      t.periods = t.periods.includes(p) ? t.periods.filter(x => x !== p) : [...t.periods, p];
      t.periods.sort((a, c) => PERIODS.indexOf(a) - PERIODS.indexOf(c));
      const bell = bellTimes(t.periods);
      if (bell.start) t.start = bell.start;
      if (bell.end) t.end = bell.end;
    } else if (b.hasAttribute('data-now')) {
      const now = new Date();
      const wd = now.getDay(); // 0 = Sunday
      if (wd >= 1 && wd <= 5) t.day = DAYS[wd - 1];
      t.start = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    } else if (b.hasAttribute('data-clear')) {
      t.day = undefined; t.periods = []; t.start = undefined; t.end = undefined;
    } else return;
    sync();
  });
  start.addEventListener('input', () => { t.start = start.value || undefined; onChange(serializeTimeslot(t)); });
  end.addEventListener('input', () => { t.end = end.value || undefined; onChange(serializeTimeslot(t)); });

  return el;
}
