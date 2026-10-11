import type {
  Template, FilledForm, Rect, ScalarField, RepeatableGroup, RowField,
  GrowBand, RowsBand, FieldType,
} from '../types';
import { fitText, requiredHeight, sanitizer, formatValue, blockHeight, wrap, PAD_X, PAD_Y, LEADING, type TextMetrics, type FitResult } from './fit';
import { groupCellRect } from '../layout';

/**
 * Flow layout: turns a template + filled form into output pages.
 *
 * Each source page is cut into horizontal segments, top to bottom:
 *  - copy:  drawn exactly as printed;
 *  - grow:  a blank area redrawn by stretching a thin slice of itself, so it
 *           can be as tall as its fields need (borders and shading survive);
 *  - rows:  a table's printed rows, replaced by one row per row in use.
 * When something grows, everything after it moves down and, if needed, onto
 * a new page (topped with the template's continuation band). The on-screen
 * editor and the PDF export both draw from this result.
 */

/** Source range [top, bottom] of `page`, drawn into output [y, y + h] (y from the page top). */
export interface Band { page: number; top: number; bottom: number; y: number; h: number }

export interface Cell {
  /** Field id, or `${group}.${row}.${field}` for group rows. */
  id: string;
  field: ScalarField | RowField;
  group?: RepeatableGroup;
  row?: number;
  label: string;
  type: FieldType;
  /** Output page coordinates (PDF points, origin bottom-left). */
  rect: Rect;
  /** Raw stored value. */
  value: string;
  /** Printable text: formatted and sanitised. */
  text: string;
  /** Font size, wrapped lines and baseline. Null for checkboxes. */
  fit: FitResult | null;
  /** List numbering ("1.") drawn at `x`, aligned with the first line. */
  number?: { text: string; x: number };
  /** True when this cell can make its band taller. */
  grows: boolean;
  /**
   * Overflow of another cell's text, continued in a box below (often on the
   * next page) because its own box couldn't grow any further. Read-only.
   */
  continued?: boolean;
}

export interface OutPage { bands: Band[]; cells: Cell[] }

export interface Layout {
  pageSize: { width: number; height: number };
  pages: OutPage[];
  /** Labels of fields whose text still didn't fit. */
  truncated: string[];
}

export interface LayoutOptions {
  /** 'edit' keeps empty rows (the editor shows them); 'print' drops them. */
  mode: 'edit' | 'print';
}

// ── Internal block model ─────────────────────────────────

type Part =
  | { kind: 'copy'; top: number; bottom: number }
  | { kind: 'blank'; top: number; bottom: number; slice: [number, number]; h: number };

interface PendingCell {
  base: Omit<Cell, 'rect' | 'fit'>;
  /** Offsets from block top. */
  top: number;
  bottom: number;
  x: number;
  w: number;
  maxSize: number;
  minSize: number;
  wrapText: boolean;
  /** Needed more room than the page allows: the rest continues below. */
  overflow?: boolean;
}

interface Block {
  page: number;
  parts: Part[];
  cells: PendingCell[];
  /** Repeated above this block if it starts a continuation page. */
  header?: { top: number; bottom: number };
}

const partH = (p: Part) => (p.kind === 'copy' ? p.top - p.bottom : p.h);
const blockH = (b: Block) => b.parts.reduce((s, p) => s + partH(p), 0);
const isRows = (b: GrowBand | RowsBand): b is RowsBand => 'group' in b;

/** Offset from block top for source `y`. Inside a blank part, anchor to its top or bottom edge. */
function mapY(parts: Part[], y: number, anchor: 'top' | 'bottom'): number {
  let off = 0;
  for (const p of parts) {
    if (y <= p.top + 0.01 && y >= p.bottom - 0.01) {
      if (p.kind === 'copy') return off + (p.top - y);
      return anchor === 'top'
        ? off + Math.min(p.h, p.top - y)
        : off + Math.max(0, p.h - (y - p.bottom));
    }
    off += partH(p);
  }
  // Above the first part / below the last: clamp.
  return y > parts[0].top ? 0 : off;
}

const hasValue = (v: string | undefined) => !!v && v.trim() !== '' && v !== 'false';

export function layoutForm(
  template: Template,
  form: FilledForm,
  m: TextMetrics,
  { mode }: LayoutOptions,
): Layout {
  const { width: W, height: H } = template.pageSize;
  const flow = template.flow;
  const readable = flow?.readable ?? 8;
  const marginBottom = flow?.marginBottom ?? 28;
  const cont = flow?.continuation;
  const contH = cont ? cont.from - cont.to : 0;
  const capacity = H - marginBottom - contH;
  const clean = sanitizer(m);
  const truncated: string[] = [];

  const textOf = (type: FieldType, v: string) => (type === 'checkbox' ? '' : clean(formatValue(type, v ?? '')).trim());
  const groupById = new Map((template.groups ?? []).map(g => [g.id, g]));

  const rowsOf = (g: RepeatableGroup): Array<{ index: number; row: Record<string, string> }> => {
    const all = (form.rows[g.id] ?? []).map((row, index) => ({ index, row }));
    if (mode === 'edit') return all.length ? all : [{ index: 0, row: {} }];
    const used = all.filter(r => g.fields.some(f => hasValue(r.row[f.id])));
    return used.length ? used : [{ index: -1, row: {} }]; // one blank row keeps the table's shape
  };

  /** How much taller than `rect` this text needs to be (0 if it fits at a readable size). */
  const extraFor = (type: FieldType, f: ScalarField | RowField, text: string, rect: Rect): { extra: number; wrapText: boolean } => {
    if (type === 'checkbox' || !text) return { extra: 0, wrapText: type === 'multiline' };
    const maxSize = f.fontSize ?? 10;
    if (type !== 'multiline') {
      const single = fitText(m, text, rect, { maxSize, minSize: readable, multiline: false });
      if (!single.truncated) return { extra: 0, wrapText: false };
    }
    const need = requiredHeight(m, text, rect, { maxSize, readable, multiline: true });
    return { extra: Math.max(0, need - rect.h), wrapText: true };
  };

  // ── Build blocks for one source page ────────────────────
  const blocksForPage = (p: number): Block[] => {
    const bands = (flow?.bands ?? []).filter(b => b.page === p).sort((a, b) => b.from - a.from);
    const blocks: Block[] = [];
    let cursor = H;
    let lead: Part | null = null;

    const pushCopy = (top: number, bottom: number) => {
      if (top - bottom < 0.01) return;
      if (lead) blocks.push({ page: p, parts: [lead], cells: [] });
      lead = { kind: 'copy', top, bottom };
    };
    const takeLead = (): Part[] => { const l = lead ? [lead] : []; lead = null; return l; };

    for (const band of bands) {
      pushCopy(cursor, band.from);
      if (isRows(band)) {
        const g = groupById.get(band.group);
        const rows = g ? rowsOf(g) : [];
        const leadParts = takeLead();
        rows.forEach((r, i) => {
          const slice = band.row.slice ?? [band.row.to + 1.6, band.row.to + 1.1];
          const parts: Part[] = [
            ...(i === 0 ? leadParts : []),
            { kind: 'blank', top: band.row.from, bottom: band.row.to + 1, slice, h: band.row.from - band.row.to - 1 },
            { kind: 'copy', top: band.row.to + 1, bottom: band.row.to },
          ];
          blocks.push({ page: p, parts, cells: [], header: band.header ? { top: band.header.from, bottom: band.header.to } : undefined });
          // Cells: the printed first row's geometry, reused for every row.
          if (!g) return;
          const block = blocks[blocks.length - 1];
          for (const rf of g.fields) {
            const src = groupCellRect(g, rf, 0, 1);
            addCell(block, {
              id: `${g.id}.${r.index}.${rf.id}`, field: rf, group: g, row: r.index,
              label: `${g.label} ${i + 1}: ${rf.label}`, type: rf.type,
              value: r.row[rf.id] ?? '', text: textOf(rf.type, r.row[rf.id] ?? ''), grows: true,
            }, src, true);
          }
        });
        cursor = band.to;
        continue;
      }

      const slice = band.slice ?? [band.to + 1.6, band.to + 1.1];
      const parts: Part[] = [
        ...takeLead(),
        { kind: 'blank', top: band.from, bottom: band.to + 1, slice, h: band.from - band.to - 1 },
        { kind: 'copy', top: band.to + 1, bottom: band.to },
      ];
      blocks.push({ page: p, parts, cells: [] });
      cursor = band.to;
    }

    const bottom = flow?.bottoms?.[p] ?? (bands.length ? cursor : 0);
    pushCopy(cursor, bottom);
    if (lead) blocks.push({ page: p, parts: [lead], cells: [] });
    return blocks;
  };

  /** Which block a source y belongs to (its parts cover it). */
  const blockAt = (blocks: Block[], y: number) =>
    blocks.find(b => y <= b.parts[0].top + 0.01 && y >= b.parts[b.parts.length - 1].bottom - 0.01);

  function addCell(block: Block, base: PendingCell['base'], src: Rect, growable: boolean) {
    const f = base.field;
    const bottomInBlank = block.parts.some(pt => pt.kind === 'blank' && src.y <= pt.top && src.y >= pt.bottom - 0.01);
    const grows = growable && bottomInBlank;
    block.cells.push({
      base: { ...base, grows },
      top: mapY(block.parts, src.y + src.h, 'top'),
      bottom: mapY(block.parts, src.y, grows ? 'bottom' : 'top'),
      x: src.x,
      w: src.w,
      maxSize: f.fontSize ?? (base.group ? 9 : 10),
      minSize: f.minFontSize ?? (base.group ? 5 : 6),
      wrapText: base.type === 'multiline',
    });
    const c = block.cells[block.cells.length - 1];
    if (!grows) c.bottom = c.top + src.h; // fixed cells keep their printed height
  }

  // ── Grow blank parts to fit their cells ─────────────────
  const listExtra = new Map<Block, number>();
  const settle = (block: Block, extraCap: number) => {
    const blank = block.parts.find((pt): pt is Extract<Part, { kind: 'blank' }> => pt.kind === 'blank');
    if (!blank) return;
    let extra = 0;
    for (const c of block.cells) {
      if (!c.base.grows) continue;
      const rect = { x: c.x, y: 0, w: c.w, h: c.bottom - c.top };
      const e = extraFor(c.base.type, c.base.field, c.base.text, rect);
      extra = Math.max(extra, e.extra);
      c.wrapText = e.wrapText;
      c.overflow = e.extra > Math.max(0, extraCap) + 0.5;
    }
    extra = Math.max(extra, listExtra.get(block) ?? 0);
    extra = Math.min(extra, Math.max(0, extraCap));
    if (extra <= 0) return;
    // Grow: cells anchored to the blank's bottom stretch; fixed cells below it move down.
    const blankBottom = mapY(block.parts, blank.top, 'top') + blank.h;
    blank.h += extra;
    for (const c of block.cells) {
      if (c.base.grows) c.bottom += extra;
      // List items are stacked from the list's top, so they never move.
      else if (!c.base.number && c.top >= blankBottom - 0.01) { c.top += extra; c.bottom += extra; }
    }
  };

  // ── Lists (e.g. learning outcomes) inside grow bands ────
  const placeLists = (p: number, blocks: Block[]) => {
    for (const g of template.groups ?? []) {
      if (!g.list || g.page !== p) continue;
      const block = blockAt(blocks, g.list.rect.y);
      if (!block) continue;
      const rf = g.fields[0];
      const rows = rowsOf(g).filter(r => r.index >= 0); // print: no placeholder item
      const size = rf.fontSize ?? 9;
      const minItem = g.rowHeight;
      const r = g.list.rect;
      const listTop = mapY(block.parts, r.y + r.h, 'top');
      let y = listTop;
      let total = 0;
      rows.forEach((row, k) => {
        const text = textOf(rf.type, row.row[rf.id] ?? '');
        const lines = text ? wrap(m, text, size, r.w - PAD_X * 2) : [''];
        const h = Math.max(minItem, blockHeight(m, lines.length, size));
        block.cells.push({
          base: {
            id: `${g.id}.${row.index}.${rf.id}`, field: rf, group: g, row: row.index,
            label: `${g.label} ${k + 1}`, type: rf.type, value: row.row[rf.id] ?? '', text,
            grows: false, number: { text: `${k + 1}.`, x: g.list!.numberX ?? r.x - 10 },
          },
          top: y, bottom: y + h, x: r.x, w: r.w, maxSize: size, minSize: size, wrapText: true,
        });
        y += h;
        total += h;
      });
      listExtra.set(block, Math.max(0, total - r.h));
    }
  };

  // ── Lay out every source page ───────────────────────────
  const pages: OutPage[] = [];
  let out: OutPage = { bands: [], cells: [] };
  let y = 0;
  let startY = 0;

  const newPage = (continuation: boolean) => {
    out = { bands: [], cells: [] };
    pages.push(out);
    y = 0;
    if (continuation && cont) {
      out.bands.push({ page: cont.page, top: cont.from, bottom: cont.to, y: 0, h: contH });
      y = contH;
    }
    startY = y;
  };

  for (let p = 0; p < template.pageCount; p++) {
    const blocks = blocksForPage(p);

    // Scalar fields and table-less groups go to the block that holds them.
    for (const f of template.fields.filter(f => f.page === p)) {
      const block = blockAt(blocks, f.rect.y) ?? blockAt(blocks, f.rect.y + f.rect.h / 2);
      if (!block) continue;
      addCell(block, {
        id: f.id, field: f, label: f.label, type: f.type,
        value: form.values[f.id] ?? '', text: textOf(f.type, form.values[f.id] ?? ''), grows: true,
      }, f.rect, f.type !== 'checkbox');
    }
    for (const g of template.groups ?? []) {
      if (g.page !== p || g.list || (flow?.bands ?? []).some(b => isRows(b) && b.group === g.id)) continue;
      const rows = rowsOf(g);
      rows.forEach((r, i) => g.fields.forEach(rf => {
        const src = groupCellRect(g, rf, i, rows.length);
        const block = blockAt(blocks, src.y + src.h / 2);
        if (block) addCell(block, {
          id: `${g.id}.${r.index}.${rf.id}`, field: rf, group: g, row: r.index,
          label: `${g.label} ${i + 1}: ${rf.label}`, type: rf.type,
          value: r.row[rf.id] ?? '', text: textOf(rf.type, r.row[rf.id] ?? ''), grows: false,
        }, src, false);
      }));
    }
    placeLists(p, blocks);

    newPage(false);
    for (const block of blocks) {
      settle(block, capacity - blockH(block));
      const h = blockH(block);
      // Never stricter than where the template itself prints: unchanged pages fit as-is.
      const floor = Math.min(marginBottom, block.parts[block.parts.length - 1].bottom);
      if (y + h > H - floor + 0.01 && y > startY + 0.5) {
        newPage(true);
        if (block.header) {
          const hh = block.header.top - block.header.bottom;
          out.bands.push({ page: block.page, top: block.header.top, bottom: block.header.bottom, y, h: hh });
          y += hh;
        }
      }

      // Draw parts
      let py = y;
      for (const part of block.parts) {
        if (part.kind === 'copy') out.bands.push({ page: block.page, top: part.top, bottom: part.bottom, y: py, h: part.top - part.bottom });
        else out.bands.push({ page: block.page, top: part.slice[0], bottom: part.slice[1], y: py, h: part.h });
        py += partH(part);
      }

      // Place cells
      const spills: Array<{ base: PendingCell['base']; x: number; w: number; lines: string[] }> = [];
      for (const c of block.cells) {
        const rect: Rect = { x: c.x, y: H - (y + c.bottom), w: c.w, h: c.bottom - c.top };
        let fit: FitResult | null = null;
        if (c.overflow) {
          // Keep what fits at the readable size; the rest continues below.
          const lines = wrap(m, c.base.text, readable, Math.max(1, c.w - PAD_X * 2));
          const n = Math.max(1, linesThatFit(rect.h, readable));
          if (lines.length > n) {
            out.cells.push({ ...c.base, rect, fit: manualFit(rect, readable, lines.slice(0, n)) });
            spills.push({ base: c.base, x: c.x, w: c.w, lines: lines.slice(n) });
            continue;
          }
        }
        if (c.base.type !== 'checkbox') {
          const floor = c.base.grows ? readable : c.minSize;
          fit = fitText(m, c.base.text, rect, { maxSize: c.maxSize, minSize: Math.min(floor, c.maxSize), multiline: c.wrapText });
          if (fit.truncated && floor > c.minSize) {
            fit = fitText(m, c.base.text, rect, { maxSize: c.maxSize, minSize: c.minSize, multiline: c.wrapText });
          }
          if (fit.truncated) truncated.push(c.base.label);
        }
        out.cells.push({ ...c.base, rect, fit });
      }
      y += h;

      // Continuation boxes: the block's own border line, its blank slice
      // stretched to the remaining text, and the border again.
      const blank = block.parts.find((pt): pt is Extract<Part, { kind: 'blank' }> => pt.kind === 'blank');
      const border = block.parts[block.parts.length - 1];
      for (const sp of spills) {
        let k = 1;
        while (sp.lines.length && blank && border.kind === 'copy') {
          const edge = border.top - border.bottom;
          const minBox = edge * 2 + blockHeight(m, Math.min(3, sp.lines.length), readable);
          if (y + minBox > H - marginBottom) newPage(true);
          const room = H - marginBottom - y - edge * 2;
          const n = Math.max(1, Math.min(sp.lines.length, linesThatFit(room, readable)));
          const bh = blockHeight(m, n, readable) + 2;
          out.bands.push({ page: block.page, top: border.top, bottom: border.bottom, y, h: edge });
          out.bands.push({ page: block.page, top: blank.slice[0], bottom: blank.slice[1], y: y + edge, h: bh });
          out.bands.push({ page: block.page, top: border.top, bottom: border.bottom, y: y + edge + bh, h: edge });
          const rect: Rect = { x: sp.x, y: H - (y + edge + bh), w: sp.w, h: bh };
          out.cells.push({
            ...sp.base, id: `${sp.base.id}~${k++}`, label: `${sp.base.label} (continued)`,
            rect, fit: manualFit(rect, readable, sp.lines.slice(0, n)), continued: true, grows: false,
          });
          sp.lines = sp.lines.slice(n);
          y += edge * 2 + bh;
        }
      }
    }
  }

  return { pageSize: { width: W, height: H }, pages, truncated };

  /** How many lines of `size` text fit in a box `h` tall. */
  function linesThatFit(h: number, size: number): number {
    const ascent = m.heightAtSize(size, { descender: false });
    return Math.floor((h - PAD_Y * 2 - ascent - size * 0.22) / (size * LEADING)) + 1;
  }

  function manualFit(rect: Rect, size: number, lines: string[]): FitResult {
    const ascent = m.heightAtSize(size, { descender: false });
    return {
      size, lines, lineHeight: size * LEADING,
      firstBaseline: rect.y + rect.h - PAD_Y - ascent, padX: PAD_X, truncated: false,
    };
  }
}
