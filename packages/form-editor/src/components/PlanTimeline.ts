import type { FilledForm, Template } from '../types';
import { fromMinutes } from '../timerange';
import { formatTimeslot } from '../timeslot';
import { colourOf, choicesFill, choicesPattern } from '../choices';
import { buildTimeline, type TimelineStage } from '../timeline';

/**
 * On-screen lesson timeline for a template's `timeline` config (the lesson
 * plan's "plan for learning"). Each stage is a block across the lesson
 * window, coloured by the learning outcomes it relates to (bands of each
 * colour when there are several, grey for none). Gaps and overlaps are
 * flagged, and clicking a stage jumps to its timing. It isn't part of the
 * lesson plan PDF, but can be exported as a PDF of its own.
 */

const COLLAPSE_KEY = 'form-editor:timeline-collapsed';
const escape = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const mins = (n: number) => `${n} min`;

/** A stage's tint: its outcome colour(s) mixed with the surface, patterned when there are several. */
const tint = (outcomes: number[], pct: number) =>
  choicesPattern(outcomes, c => `color-mix(in oklab, ${c} ${pct}%, var(--c-surface))`);

const outcomeText = (s: TimelineStage) => (s.outcomes.length ? `LO ${s.outcomes.join(', ')}` : 'no LO');

export interface PlanTimeline {
  el: HTMLElement;
  update: (form: FilledForm) => void;
}

export function createPlanTimeline(
  template: Template,
  onSelect: (fieldId: string) => void,
  onExport?: (form: FilledForm) => void,
): PlanTimeline | null {
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
    if (t.closest('[data-export]')) { if (latest) onExport?.(latest); return; }
    if (t.closest('[data-toggle]')) {
      collapsed = !collapsed;
      el.classList.toggle('is-collapsed', collapsed);
      try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
      if (latest) render(latest);
    }
  });

  const render = (form: FilledForm) => {
    const tl = buildTimeline(template, form)!;
    const { stages, untimed, gaps, lanes, hasWindow, planned } = tl;
    const lo = tl.lo, hi = tl.hi;
    const windowText = [formatTimeslot(tl.slot), hasWindow ? mins(hi! - lo!) : ''].filter(Boolean).join(' · ');

    const head = `
      <header class="ptl__head">
        <span class="ptl__title">lesson timeline</span>
        <span class="ptl__window">${escape(windowText || 'set the lesson time (day, periods, start–end)')}</span>
        ${hasWindow ? `<span class="ptl__sum">${planned} / ${hi! - lo!} min planned</span>` : ''}
        <span class="ptl__actions">
          ${onExport && stages.length ? '<button type="button" class="ptl__toggle" data-export title="Export the timeline, with timings and learning outcomes, as its own PDF">export pdf</button>' : ''}
          <button type="button" class="ptl__toggle" data-toggle aria-expanded="${!collapsed}">${collapsed ? 'show' : 'hide'}</button>
        </span>
      </header>`;

    if (collapsed) { el.innerHTML = head; return; }
    if (lo === undefined || hi === undefined || hi <= lo) {
      el.innerHTML = `${head}<p class="ptl__empty">Give each stage a start and an end (or a duration) to see the lesson laid out here.</p>`;
      return;
    }

    const span = hi - lo;
    const pct = (m: number) => `${((Math.min(Math.max(m, lo), hi) - lo) / span) * 100}%`;
    const width = (a: number, b: number) => `${((Math.min(b, hi) - Math.max(a, lo)) / span) * 100}%`;

    // Ticks every 5/10/15/30 minutes depending on length.
    const step = span <= 40 ? 5 : span <= 120 ? 10 : span <= 240 ? 15 : 30;
    const ticks: string[] = [];
    for (let m = Math.ceil(lo / step) * step; m <= hi; m += step) {
      const major = m % (step * 2) === 0 || m === lo || m === hi;
      ticks.push(`<span class="ptl__tick${major ? ' is-major' : ''}" style="left:${pct(m)}">${major ? fromMinutes(m) : ''}</span>`);
    }

    // Outcomes in use, for the key.
    const used = [...new Set(stages.flatMap(s => s.outcomes))].sort((a, b) => a - b);

    el.innerHTML = `
      ${head}
      <div class="ptl__track" style="--lanes:${lanes}">
        <div class="ptl__ticks" aria-hidden="true">${ticks.join('')}</div>
        ${gaps.map(([a, b]) => `<span class="ptl__gap" style="left:${pct(a)};width:${width(a, b)}" title="unplanned: ${fromMinutes(a)}–${fromMinutes(b)} (${mins(b - a)})"></span>`).join('')}
        ${stages.map(s => {
          const cls = ['ptl__stage', s.overlap ? 'is-overlap' : '', s.outside ? 'is-outside' : ''].filter(Boolean).join(' ');
          const title = `${fromMinutes(s.start)}–${fromMinutes(s.end)} (${mins(s.end - s.start)}) · ${outcomeText(s)}${s.label ? `: ${s.label}` : ''}`;
          return `<button type="button" class="${cls}" data-row="${s.row}"
              style="left:${pct(s.start)};width:${width(s.start, s.end)};--lane:${s.lane};--ptl-bar:${choicesFill(s.outcomes)};--ptl-tint:${tint(s.outcomes, 22)};--ptl-tint-hover:${tint(s.outcomes, 36)}"
              title="${escape(title)}" aria-label="Stage ${s.row + 1}: ${escape(title)}">
              <span class="ptl__stage-time">${mins(s.end - s.start)}</span>
              <span class="ptl__stage-label">${s.label ? `${s.row + 1}. ${escape(s.label)}` : `stage ${s.row + 1}`}</span>
            </button>`;
        }).join('')}
      </div>
      ${used.length ? `<p class="ptl__key">${used.map(n => `<span class="ptl__lo-key" title="${escape(tl.outcomes[n - 1] ?? '')}"><span class="ptl__dot" style="--ptl-bar:${colourOf(n)}" aria-hidden="true"></span>LO ${n}${tl.outcomes[n - 1] ? `: ${escape(tl.outcomes[n - 1])}` : ''}</span>`).join('')}</p>` : ''}
      <ol class="ptl__legend">
        ${stages.map(s => `
          <li class="${s.overlap ? 'is-overlap' : ''}">
            <button type="button" data-row="${s.row}">
              <span class="ptl__dot" style="--ptl-bar:${choicesFill(s.outcomes)}" aria-hidden="true"></span>
              <span class="ptl__num">${s.row + 1}</span>
              <span class="ptl__when">${fromMinutes(s.start)}–${fromMinutes(s.end)}</span>
              <span class="ptl__mins">${mins(s.end - s.start)}</span>
              <span class="ptl__lo">${outcomeText(s)}</span>
              <span class="ptl__what">${escape(s.label || `stage ${s.row + 1}`)}</span>
            </button>
          </li>`).join('')}
      </ol>
      ${stages.some(s => s.overlap) ? '<p class="ptl__note ptl__note--warn">Some stages overlap.</p>' : ''}
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
