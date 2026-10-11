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
