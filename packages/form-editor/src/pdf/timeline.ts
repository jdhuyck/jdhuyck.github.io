import {
  PDFDocument, StandardFonts, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath,
  type PDFFont, type PDFPage, type RGB,
} from 'pdf-lib';
import type { FilledForm, Template } from '../types';
import { buildTimeline, type TimelineStage } from '../timeline';
import { fromMinutes } from '../timerange';
import { formatTimeslot } from '../timeslot';
import { colourOf, patternFor, NO_CHOICE_COLOUR } from '../choices';
import { formatValue, helveticaMetrics, sanitizer, wrap } from './fit';

/**
 * The lesson timeline as a one-page PDF (A4 landscape): stages across the
 * full width of the page, coloured by their learning outcomes, then a key to
 * the outcomes and a table of every stage with its timing, length and
 * outcomes. The key and table condense (smaller text, fewer lines per stage,
 * the key in columns) until they fit the rest of the page.
 */

const W = 842, H = 595, M = 28;
const INK = rgb(0.1, 0.1, 0.1), MUTED = rgb(0.4, 0.4, 0.4), RULE = rgb(0.75, 0.75, 0.73);
const LEADING = 1.22;

const hex = (h: string): [number, number, number] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
/** `h` mixed with white: `amount` 1 is the full colour. */
const tintOf = (h: string, amount = 1): RGB => { const [r, g, b] = hex(h); return rgb(1 - (1 - r) * amount, 1 - (1 - g) * amount, 1 - (1 - b) * amount); };
const coloursOf = (s: TimelineStage) => (s.outcomes.length ? s.outcomes.map(colourOf) : [NO_CHOICE_COLOUR]);
const outcomeText = (s: TimelineStage) => (s.outcomes.length ? `LO ${s.outcomes.join(', ')}` : 'no LO');

export async function exportTimeline(template: Template, form: FilledForm): Promise<Uint8Array> {
  const tl = buildTimeline(template, form);
  if (!tl || tl.lo === undefined || tl.hi === undefined || tl.hi <= tl.lo) throw new Error('Give the stages timings to export the timeline.');
  const lo = tl.lo, hi = tl.hi, span = hi - lo;
  const m = helveticaMetrics();
  const sanitize = sanitizer(m);
  /** Printable text; line breaks become " / " where only one line fits. */
  const clean = (s: string) => sanitize(s);
  const oneLine = (s: string) => sanitize(s).split(/\s*\n\s*/).filter(Boolean).join(' / ');

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(`${form.name}: lesson timeline`);
  doc.setSubject(template.name);
  doc.setCreationDate(new Date());
  const page = doc.addPage([W, H]);

  const text = (s: string, x: number, y: number, size: number, f: PDFFont = font, color: RGB = INK) =>
    page.drawText(oneLine(s), { x, y, size, font: f, color });
  /** `s` on one line, cut to fit `w` at `size` with an ellipsis. */
  const fit = (s: string, w: number, size: number, f: PDFFont = font) => {
    let out = oneLine(s);
    if (f.widthOfTextAtSize(out, size) <= w) return out;
    while (out && f.widthOfTextAtSize(`${out}…`, size) > w) out = out.slice(0, -1);
    return out ? `${out.trimEnd()}…` : '';
  };
  /** Up to `max` wrapped lines of `s` in `w`, the last cut with an ellipsis if there's more. */
  const lines = (s: string, w: number, size: number, max: number) => {
    const all = wrap(m, clean(s), size, w).filter((l, i, a) => l || (i > 0 && i < a.length - 1));
    if (all.length <= max) return all.length ? all : [''];
    const kept = all.slice(0, max);
    kept[max - 1] = fit(`${kept[max - 1]} ${all.slice(max).join(' ')}`, w, size);
    return kept;
  };
  /** Equal bands of `colours`, top to bottom (narrow bars). */
  const bands = (x: number, top: number, w: number, h: number, colours: string[], amount: number) => {
    const bh = h / colours.length;
    colours.forEach((c, i) => page.drawRectangle({ x, y: top - (i + 1) * bh, width: w, height: bh, color: tintOf(c, amount) }));
  };
  /** A box patterned with every colour, as on screen (see `patternFor`), clipped to the box. */
  const patterned = (p: PDFPage, x: number, top: number, w: number, h: number, colours: string[], amount: number, size = 4) => {
    const pat = patternFor(colours.length);
    const paint = colours.map(c => tintOf(c, amount));
    if (pat.kind === 'solid') { p.drawRectangle({ x, y: top - h, width: w, height: h, color: paint[0] }); return; }
    p.pushOperators(pushGraphicsState(), rectangle(x, top - h, w, h), clip(), endPath());
    if (pat.kind === 'checks') {
      // Each 2×2 tile: top-right, bottom-right, bottom-left, top-left (the CSS conic order).
      const quad = [[3, 0], [2, 1]];
      for (let iy = 0; iy * size < h; iy++) {
        for (let ix = 0; ix * size < w; ix++) {
          p.drawRectangle({ x: x + ix * size, y: top - (iy + 1) * size, width: size, height: size, color: paint[quad[iy % 2][ix % 2]] });
        }
      }
    } else {
      // CSS angles: 0° points up, 90° right; stripes run across that direction.
      const a = (pat.angle * Math.PI) / 180;
      const g = { x: Math.sin(a), y: Math.cos(a) }, d = { x: g.y, y: -g.x };
      const cx = x + w / 2, cy = top - h / 2, reach = w + h;
      for (let k = -Math.ceil(reach / size); k * size <= reach; k++) {
        const ox = cx + g.x * k * size, oy = cy + g.y * k * size;
        p.drawLine({
          start: { x: ox - d.x * reach, y: oy - d.y * reach }, end: { x: ox + d.x * reach, y: oy + d.y * reach },
          thickness: size + 0.2, color: paint[((k % paint.length) + paint.length) % paint.length],
        });
      }
    }
    p.pushOperators(popGraphicsState());
  };

  // ── Heading ────────────────────────────────────────────
  let y = H - M;
  text('Lesson timeline', M, y - 12, 14, bold);
  const subject = form.values.subject?.trim();
  const date = form.values.date ? formatValue('date', form.values.date) : '';
  const when = [formatTimeslot(tl.slot), tl.hasWindow ? `${tl.planned} / ${span} min planned` : ''].filter(Boolean).join(' · ');
  text(fit([subject || form.name, date, when].filter(Boolean).join(' · '), W - 2 * M, 8.5), M, y - 26, 8.5, font, MUTED);
  y -= 40;

  // ── Track: the full width of the page ──────────────────
  const x0 = M, x1 = W - M;
  const xOf = (t: number) => x0 + ((Math.min(Math.max(t, lo), hi) - lo) / span) * (x1 - x0);
  // Lanes shrink if overlaps stack them deep, so the track never takes more than ~a third of the page.
  const lane = Math.min(40, 180 / tl.lanes);
  const trackH = tl.lanes * lane;
  const top = y;
  page.drawRectangle({ x: x0, y: top - trackH, width: x1 - x0, height: trackH, color: rgb(0.98, 0.98, 0.97) });
  for (const [a, b] of tl.gaps) {
    page.drawRectangle({ x: xOf(a), y: top - trackH, width: xOf(b) - xOf(a), height: trackH, color: rgb(0.99, 0.91, 0.8) });
  }
  const step = span <= 40 ? 5 : span <= 120 ? 10 : span <= 240 ? 15 : 30;
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) {
    const major = t % (step * 2) === 0 || t === lo || t === hi;
    const x = xOf(t);
    page.drawLine({ start: { x, y: top }, end: { x, y: top - trackH - (major ? 4 : 2) }, thickness: major ? 0.6 : 0.3, color: RULE });
    if (major) { const s = fromMinutes(t); text(s, Math.min(Math.max(x - font.widthOfTextAtSize(s, 7) / 2, M), W - M - font.widthOfTextAtSize(s, 7)), top - trackH - 12, 7, font, MUTED); }
  }
  for (const s of tl.stages) {
    const bx = xOf(s.start), bw = Math.max(2, xOf(s.end) - bx);
    const by = top - s.lane * lane - 1.5, bh = lane - 3;
    patterned(page, bx, by, bw, bh, coloursOf(s), 0.3);
    bands(bx, by, Math.min(3, bw), bh, coloursOf(s), 1);
    if (s.overlap) page.drawRectangle({ x: bx, y: by - bh, width: bw, height: bh, borderColor: rgb(0.8, 0.1, 0.1), borderWidth: 1 });
    const room = bw - 8;
    const size = Math.min(8, bh / 3.2);
    if (room > 6 && size >= 4) {
      text(fit(`${s.row + 1}. ${s.label || `stage ${s.row + 1}`}`, room, size, bold), bx + 6, by - size - 2, size, bold);
      if (bh > size * 2.6) text(fit(`${s.end - s.start} min · ${outcomeText(s)}`, room, size - 1, font), bx + 6, by - size * 2.3 - 3, size - 1, font, MUTED);
    }
  }
  page.drawRectangle({ x: x0, y: top - trackH, width: x1 - x0, height: trackH, borderColor: RULE, borderWidth: 0.6 });
  y = top - trackH - 26;

  // ── Below the track: condensed to fit what's left ──────
  const used = [...new Set(tl.stages.flatMap(s => s.outcomes))];
  const shown = [...new Set([...tl.outcomes.map((_, i) => i + 1), ...used])].sort((a, b) => a - b);
  const keyItems = [...shown.map(n => ({ colour: colourOf(n), text: `LO ${n}: ${tl.outcomes[n - 1] || '(no longer listed)'}` })),
    { colour: NO_CHOICE_COLOUR, text: 'No learning outcome' }];
  const byRow = [...tl.stages].sort((a, b) => a.row - b.row);
  const untimedNote = tl.untimed.length ? `No timing yet: ${tl.untimed.map(i => `stage ${i + 1}`).join(', ')}` : '';
  const cfg = template.timeline!;
  const colW = [34, 66, 28, 92];
  const whatW = W - 2 * M - colW.reduce((a, b) => a + b, 0) - 6;

  interface Plan { size: number; maxLines: number; keyCols: number; height: number }
  const measure = (size: number, maxLines: number, keyCols: number): Plan => {
    const lh = size * LEADING;
    let h = (shown.length ? size + 6 : 0) + Math.ceil(keyItems.length / keyCols) * (lh + 1) + 8;
    h += lh + 8; // table header
    for (const s of byRow) h += lines(s.label || '—', whatW - 6, size, maxLines).length * lh + 4;
    if (untimedNote) h += lh + 4;
    return { size, maxLines, keyCols, height: h };
  };
  const room = y - M;
  let plan: Plan | null = null;
  // Largest text first; then fewer lines per stage; then the key in more columns.
  search: for (let size = 8.5; size >= 4; size -= 0.5) {
    for (const maxLines of [4, 3, 2, 1]) {
      for (const keyCols of [1, 2, 3]) {
        const p = measure(size, maxLines, keyCols);
        if (p.height <= room) { plan = p; break search; }
      }
    }
  }
  plan ??= measure(4, 1, 3);
  const { size, maxLines, keyCols } = plan;
  const lh = size * LEADING;

  // Key to the learning outcomes, in `keyCols` columns.
  if (shown.length) { text('Learning outcomes', M, y, size + 0.5, bold); y -= size + 6; }
  const keyW = (W - 2 * M) / keyCols;
  const keyRows = Math.ceil(keyItems.length / keyCols);
  keyItems.forEach((k, i) => {
    const col = Math.floor(i / keyRows), row = i % keyRows;
    const kx = M + col * keyW, ky = y - row * (lh + 1);
    page.drawRectangle({ x: kx, y: ky - 1, width: size * 0.9, height: size * 0.9, color: tintOf(k.colour) });
    text(fit(k.text, keyW - size * 2 - 8, size), kx + size * 1.5, ky, size, font, k.colour === NO_CHOICE_COLOUR ? MUTED : INK);
  });
  y -= keyRows * (lh + 1) + 8;

  // Stages table.
  const heads = ['Stage', 'Time', 'Mins', 'Learning outcomes', cfg.label === 'teacher' ? 'What is the teacher doing?' : 'Stage'];
  page.drawRectangle({ x: M, y: y - lh * 0.35, width: W - 2 * M, height: lh + 3, color: rgb(0.93, 0.93, 0.91) });
  let hx = M + 6;
  heads.forEach((h, i) => { text(fit(h, (colW[i] ?? whatW) - 4, size, bold), hx, y, size, bold); hx += colW[i] ?? 0; });
  y -= lh + 8;
  for (const s of byRow) {
    const what = lines(s.label || '—', whatW - 6, size, maxLines);
    const rh = what.length * lh + 4;
    bands(M, y + size, 3, rh, coloursOf(s), 1);
    const cells = [String(s.row + 1), `${fromMinutes(s.start)}–${fromMinutes(s.end)}`, String(s.end - s.start), s.outcomes.length ? `LO ${s.outcomes.join(', ')}` : '—'];
    let x = M + 6;
    cells.forEach((c, i) => { const f = i === 0 ? bold : font; text(fit(c, colW[i] - 4, size, f), x, y, size, f); x += colW[i]; });
    what.forEach((l, i) => text(l, x, y - i * lh, size));
    y -= rh;
    page.drawLine({ start: { x: M, y: y + size - 1 }, end: { x: W - M, y: y + size - 1 }, thickness: 0.3, color: RULE });
  }
  if (untimedNote) text(fit(untimedNote, W - 2 * M, size), M, y - 2, size, font, MUTED);

  return await doc.save();
}
