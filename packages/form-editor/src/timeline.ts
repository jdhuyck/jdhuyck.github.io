import type { FilledForm, RowField, Template } from './types';
import { parseTimerange, toMinutes } from './timerange';
import { parseTimeslot, type Timeslot } from './timeslot';
import { parseChoices } from './choices';

/**
 * The lesson timeline for a template's `timeline` config: each stage of the
 * plan placed across the lesson window, with the learning outcomes it relates
 * to. Shared by the on-screen timeline and its PDF export.
 */

export interface TimelineStage {
  /** Row index in the plan (stage number − 1). */
  row: number;
  start: number;
  end: number;
  label: string;
  /** Learning outcome numbers, ascending (may be empty). */
  outcomes: number[];
  /** Overlapping stages stack onto extra lanes. */
  lane: number;
  overlap: boolean;
  /** Runs outside the lesson window. */
  outside: boolean;
}

export interface Timeline {
  slot: Timeslot;
  /** Window in minutes: the lesson time, or the stages' extent without one. */
  lo?: number;
  hi?: number;
  hasWindow: boolean;
  stages: TimelineStage[];
  /** Rows with something in them but no usable timing. */
  untimed: number[];
  /** Unplanned time inside the window. */
  gaps: Array<[number, number]>;
  lanes: number;
  /** Minutes covered by at least one stage (overlaps count once). */
  planned: number;
  /** Learning outcome texts, by number − 1. */
  outcomes: string[];
}

/** The multiselect field a timeline's `outcome` names, if any. */
export function outcomeField(template: Template): RowField | undefined {
  const cfg = template.timeline;
  return template.groups?.find(g => g.id === cfg?.group)?.fields.find(f => f.id === cfg?.outcome);
}

export function buildTimeline(template: Template, form: FilledForm): Timeline | null {
  const cfg = template.timeline;
  if (!cfg) return null;
  const slot = cfg.window ? parseTimeslot(form.values[cfg.window]) : { periods: [] };
  const choices = outcomeField(template)?.choices;
  const outcomes = (form.rows[choices?.group ?? ''] ?? []).map(r => (choices?.label ? r[choices.label] ?? '' : '').trim());

  const stages: TimelineStage[] = [];
  const untimed: number[] = [];
  (form.rows[cfg.group] ?? []).forEach((row, i) => {
    const r = parseTimerange(row[cfg.timing]);
    const s = toMinutes(r.start), e = toMinutes(r.end);
    const label = (row[cfg.label] ?? '').trim();
    if (s === undefined || e === undefined || e <= s) {
      if (label || r.start || r.end || r.legacy) untimed.push(i);
      return;
    }
    stages.push({
      row: i, start: s, end: e, label,
      outcomes: cfg.outcome ? parseChoices(row[cfg.outcome]) : [],
      lane: 0, overlap: false, outside: false,
    });
  });
  stages.sort((a, b) => a.start - b.start || a.end - b.end);

  let lo = toMinutes(slot.start), hi = toMinutes(slot.end);
  const hasWindow = lo !== undefined && hi !== undefined && hi > lo;
  if (!hasWindow) {
    lo = stages.length ? Math.min(...stages.map(s => s.start)) : undefined;
    hi = stages.length ? Math.max(...stages.map(s => s.end)) : undefined;
  }

  let planned = 0;
  let reach = -Infinity;
  for (const st of stages) {
    const a = Math.max(st.start, reach, lo ?? st.start), b = Math.min(st.end, hi ?? st.end);
    if (b > a) planned += b - a;
    reach = Math.max(reach, st.end);
  }

  const gaps: Array<[number, number]> = [];
  if (lo !== undefined && hi !== undefined) {
    let cursor = lo;
    stages.forEach((s, i) => {
      if (s.start > cursor) gaps.push([cursor, s.start]);
      if (i > 0 && s.start < stages[i - 1].end) { s.overlap = true; stages[i - 1].overlap = true; }
      cursor = Math.max(cursor, s.end);
    });
    if (hasWindow && cursor < hi) gaps.push([cursor, hi]);
  }

  const laneEnds: number[] = [];
  for (const s of stages) {
    let l = laneEnds.findIndex(end => end <= s.start);
    if (l === -1) { l = laneEnds.length; laneEnds.push(s.end); } else laneEnds[l] = s.end;
    s.lane = l;
    s.outside = hasWindow && (s.start < lo! || s.end > hi!);
  }

  return { slot, lo, hi, hasWindow, stages, untimed, gaps, lanes: Math.max(1, laneEnds.length), planned, outcomes };
}
