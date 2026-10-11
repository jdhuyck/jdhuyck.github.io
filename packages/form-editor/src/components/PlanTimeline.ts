import type { FilledForm, Template } from '../types';
import { parseTimerange, toMinutes, fromMinutes } from '../timerange';
import { formatTimeslot, parseTimeslot } from '../timeslot';

/**
 * On-screen lesson timeline for a template's `timeline` config (the lesson
 * plan's "plan for learning"). Each stage is a block across the lesson
 * window, coloured by its related learning outcome. Gaps and overlaps are
 * flagged, and clicking a stage jumps to its timing. Not part of the PDF.
 */

interface Stage {
  row: number;
  start: number;
  end: number;
  label: string;
  outcome: string;
}

const COLLAPSE_KEY = 'form-editor:timeline-collapsed';
const escape = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const mins = (n: number) => `${n} min`;

export interface PlanTimeline {
  el: HTMLElement;
  update: (form: FilledForm) => void;
}

export function createPlanTimeline(template: Template, onSelect: (fieldId: string) => void): PlanTimeline | null {
  const cfg = template.timeline;
  if (!cfg) return null;

  const el = document.createElement('section');
  el.className = 'ptl';
  el.setAttribute('aria-label', 'Lesson timeline');
  let collapsed = false;
  try { collapsed = localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { /* ignore */ }
  el.classList.toggle('is-collapsed', collapsed);

  let pending = false;
  let latest: FilledForm | null = null;

  el.addEventListener('click', (e) => {
    const t = e.target as Element;
    const stage = t.closest<HTMLElement>('[data-row]');
    if (stage) { onSelect(`${cfg.group}.${stage.dataset.row}.${cfg.timing}`); return; }
    if (t.closest('[data-toggle]')) {
      collapsed = !collapsed;
      el.classList.toggle('is-collapsed', collapsed);
      try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
      if (latest) render(latest);
    }
  });

  const render = (form: FilledForm) => {
    const slot = cfg.window ? parseTimeslot(form.values[cfg.window]) : { periods: [] };
    const rows = form.rows[cfg.group] ?? [];
    const stages: Stage[] = [];
    const untimed: number[] = [];
    rows.forEach((row, i) => {
      const r = parseTimerange(row[cfg.timing]);
      const s = toMinutes(r.start), e = toMinutes(r.end);
      const label = (row[cfg.label] ?? '').trim();
      if (s === undefined || e === undefined || e <= s) {
        if (label || r.start || r.end || r.legacy) untimed.push(i);
        return;
      }
      stages.push({ row: i, start: s, end: e, label, outcome: (cfg.outcome ? row[cfg.outcome] ?? '' : '').trim() });
    });
    stages.sort((a, b) => a.start - b.start || a.end - b.end);

    let lo = toMinutes(slot.start), hi = toMinutes(slot.end);
    const hasWindow = lo !== undefined && hi !== undefined && hi > lo;
    if (!hasWindow) {
      lo = stages.length ? Math.min(...stages.map(s => s.start)) : undefined;
      hi = stages.length ? Math.max(...stages.map(s => s.end)) : undefined;
    }

    const windowText = [formatTimeslot(slot), hasWindow ? mins(hi! - lo!) : ''].filter(Boolean).join(' · ');
    // Minutes covered by at least one stage (overlaps count once).
    let planned = 0;
    let reach = -Infinity;
    for (const st of stages) {
      const a = Math.max(st.start, reach, lo ?? st.start), b = Math.min(st.end, hi ?? st.end);
      if (b > a) planned += b - a;
      reach = Math.max(reach, st.end);
    }

    const head = `
      <header class="ptl__head">
        <span class="ptl__title">lesson timeline</span>
        <span class="ptl__window">${escape(windowText || 'set the lesson time (day, periods, start–end)')}</span>
        ${hasWindow ? `<span class="ptl__sum">${planned} / ${hi! - lo!} min planned</span>` : ''}
        <button type="button" class="ptl__toggle" data-toggle aria-expanded="${!collapsed}">${collapsed ? 'show' : 'hide'}</button>
      </header>`;

    if (collapsed) { el.innerHTML = head; return; }
    if (lo === undefined || hi === undefined || hi <= lo) {
      el.innerHTML = `${head}<p class="ptl__empty">Give each stage a start and an end (or a duration) to see the lesson laid out here.</p>`;
      return;
    }

    const span = hi - lo;
    const pct = (m: number) => `${((Math.min(Math.max(m, lo!), hi!) - lo!) / span) * 100}%`;
    const width = (a: number, b: number) => `${((Math.min(b, hi!) - Math.max(a, lo!)) / span) * 100}%`;

    // Ticks every 5/10/15/30 minutes depending on length.
    const step = span <= 40 ? 5 : span <= 120 ? 10 : span <= 240 ? 15 : 30;
    const ticks: string[] = [];
    for (let m = Math.ceil(lo / step) * step; m <= hi; m += step) {
      const major = m % (step * 2) === 0 || m === lo || m === hi;
      ticks.push(`<span class="ptl__tick${major ? ' is-major' : ''}" style="left:${pct(m)}">${major ? fromMinutes(m) : ''}</span>`);
    }

    // Gaps (unplanned time) and overlaps
    const gaps: Array<[number, number]> = [];
    let cursor = lo;
    const overlapping = new Set<number>();
    stages.forEach((s, i) => {
      if (s.start > cursor) gaps.push([cursor, s.start]);
      if (i > 0 && s.start < stages[i - 1].end) { overlapping.add(s.row); overlapping.add(stages[i - 1].row); }
      cursor = Math.max(cursor, s.end);
    });
    if (hasWindow && cursor < hi) gaps.push([cursor, hi]);

    // Overlapping stages stack onto extra lanes so both stay visible.
    const laneEnds: number[] = [];
    const lane = new Map<number, number>();
    for (const s of stages) {
      let l = laneEnds.findIndex(end => end <= s.start);
      if (l === -1) { l = laneEnds.length; laneEnds.push(s.end); } else laneEnds[l] = s.end;
      lane.set(s.row, l);
    }
    const lanes = Math.max(1, laneEnds.length);

    const colourOf = (s: Stage, i: number) => {
      const n = parseInt(s.outcome, 10);
      return `var(--ptl-${((Number.isFinite(n) && n > 0 ? n - 1 : i) % 7) + 1})`;
    };

    el.innerHTML = `
      ${head}
      <div class="ptl__track" style="--lanes:${lanes}">
        <div class="ptl__ticks" aria-hidden="true">${ticks.join('')}</div>
        ${gaps.map(([a, b]) => `<span class="ptl__gap" style="left:${pct(a)};width:${width(a, b)}" title="unplanned: ${fromMinutes(a)}–${fromMinutes(b)} (${mins(b - a)})"></span>`).join('')}
        ${stages.map((s, i) => {
          const outside = hasWindow && (s.start < lo! || s.end > hi!);
          const cls = ['ptl__stage', overlapping.has(s.row) ? 'is-overlap' : '', outside ? 'is-outside' : ''].filter(Boolean).join(' ');
          const title = `${fromMinutes(s.start)}–${fromMinutes(s.end)} (${mins(s.end - s.start)})${s.outcome ? ` · LO ${s.outcome}` : ''}${s.label ? `: ${s.label}` : ''}`;
          return `<button type="button" class="${cls}" data-row="${s.row}"
              style="left:${pct(s.start)};width:${width(s.start, s.end)};--ptl-c:${colourOf(s, i)};--lane:${lane.get(s.row)}"
              title="${escape(title)}" aria-label="Stage ${s.row + 1}: ${escape(title)}">
              <span class="ptl__stage-time">${mins(s.end - s.start)}</span>
              <span class="ptl__stage-label">${escape(s.label || `stage ${s.row + 1}`)}</span>
            </button>`;
        }).join('')}
      </div>
      <ol class="ptl__legend">
        ${stages.map((s, i) => `
          <li class="${overlapping.has(s.row) ? 'is-overlap' : ''}" style="--ptl-c:${colourOf(s, i)}">
            <button type="button" data-row="${s.row}">
              <span class="ptl__dot" aria-hidden="true"></span>
              <span class="ptl__when">${fromMinutes(s.start)}–${fromMinutes(s.end)}</span>
              <span class="ptl__mins">${mins(s.end - s.start)}</span>
              ${s.outcome ? `<span class="ptl__lo">LO ${escape(s.outcome)}</span>` : ''}
              <span class="ptl__what">${escape(s.label || `stage ${s.row + 1}`)}</span>
            </button>
          </li>`).join('')}
      </ol>
      ${overlapping.size ? '<p class="ptl__note ptl__note--warn">Some stages overlap.</p>' : ''}
      ${untimed.length ? `<p class="ptl__note">No timing yet: ${untimed.map(i => `<button type="button" data-row="${i}">stage ${i + 1}</button>`).join(', ')}</p>` : ''}
    `;
  };

  return {
    el,
    update(form) {
      latest = form;
      if (pending) return;
      // Batch bursts of edits into one render.
      pending = true;
      queueMicrotask(() => { pending = false; if (latest) render(latest); });
    },
  };
}
