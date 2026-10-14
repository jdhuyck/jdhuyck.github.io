import type { Rect, RepeatableGroup, RowField } from './types';

/** Height of each row when a group has `rowCount` rows. */
export function groupRowHeight(g: RepeatableGroup, rowCount: number): number {
  return g.area ? Math.min(g.rowHeight, g.area.height / Math.max(1, rowCount)) : g.rowHeight;
}

/**
 * Where cell `rf` of row `i` sits on the page, given `rowCount` rows.
 * Row 0's band runs from `origin.y` up to `origin.y + rowHeight`; later rows
 * stack downwards. Groups with an `area` compress their rows (and cells)
 * proportionally so the whole list fits inside that area.
 */
export function groupCellRect(g: RepeatableGroup, rf: RowField, i: number, rowCount: number): Rect {
  const eff = groupRowHeight(g, rowCount);
  const k = eff / g.rowHeight;
  const top = g.origin.y + g.rowHeight;
  return {
    x: g.origin.x + rf.offset.x,
    y: top - (i + 1) * eff + (rf.offset.y ?? 0) * k,
    w: rf.size.w,
    h: rf.size.h * k,
  };
}

/** Whether another row can be added. Overflow onto new pages is handled by the flow layout. */
export function canAddRow(g: RepeatableGroup, rowCount: number): boolean {
  return rowCount < (g.maxRows ?? 40);
}

/** Today / now in the formats `<input type=date|time>` use. */
export function nowValue(type: 'date' | 'time'): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return type === 'date'
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * A new row for `g`, with its `auto` fields filled in: `count` one more than
 * the highest number so far, `now` the current time (when `byHand`).
 */
export function newRow(g: RepeatableGroup, rows: Array<Record<string, string>>, byHand: boolean): Record<string, string> {
  const row: Record<string, string> = {};
  for (const f of g.fields) {
    if (f.auto === 'count') {
      const used = rows.map(r => parseInt(r[f.id] ?? '', 10)).filter(n => Number.isFinite(n));
      row[f.id] = String(used.length ? Math.max(...used) + 1 : rows.length + 1);
    } else if (f.auto === 'now' && byHand) {
      row[f.id] = nowValue('time');
    }
  }
  return row;
}

/** A group's starting rows (`initialRows`, default 1), numbered in turn. */
export function initialRows(g: RepeatableGroup): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];
  for (let i = 0; i < (g.initialRows ?? 1); i++) rows.push(newRow(g, rows, false));
  return rows;
}
