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
 * The lesson timeline as a PDF of its own (A4 landscape): stages across the
 * lesson coloured by their learning outcomes, a key to the outcomes, and a
 * table of every stage with its timing, length and outcomes.
 */

const W = 842, H = 595, M = 36;
const LANE = 40;
const INK = rgb(0.1, 0.1, 0.1), MUTED = rgb(0.4, 0.4, 0.4), RULE = rgb(0.75, 0.75, 0.73);

const hex = (h: string): [number, number, number] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
/** `h` mixed with white: `amount` 1 is the full colour. */
const tintOf = (h: string, amount = 1): RGB => { const [r, g, b] = hex(h); return rgb(1 - (1 - r) * amount, 1 - (1 - g) * amount, 1 - (1 - b) * amount); };
const coloursOf = (s: TimelineStage) => (s.outcomes.length ? s.outcomes.map(colourOf) : [NO_CHOICE_COLOUR]);

export async function exportTimeline(template: Template, form: FilledForm): Promise<Uint8Array> {
  const tl = buildTimeline(template, form);
  if (!tl || tl.lo === undefined || tl.hi === undefined || tl.hi <= tl.lo) throw new Error('Give the stages timings to export the timeline.');
  const lo = tl.lo, hi = tl.hi, span = hi - lo;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const clean = sanitizer(helveticaMetrics());
  doc.setTitle(`${form.name}: lesson timeline`);
  doc.setSubject(template.name);
  doc.setCreationDate(new Date());

  let page = doc.addPage([W, H]);
  let y = H - M;

  const text = (s: string, x: number, at: number, size: number, f: PDFFont = font, color: RGB = INK) =>
    page.drawText(clean(s), { x, y: at, size, font: f, color });
  /** `s` cut to fit `w` at `size`, with an ellipsis. */
  const fit = (s: string, w: number, size: number, f: PDFFont = font) => {
    let out = clean(s);
    if (f.widthOfTextAtSize(out, size) <= w) return out;
    while (out && f.widthOfTextAtSize(`${out}…`, size) > w) out = out.slice(0, -1);
    return out ? `${out.trimEnd()}…` : '';
  };
  /** A box filled with equal bands of `colours`, top to bottom. */
  const bands = (p: PDFPage, x: number, top: number, w: number, h: number, colours: string[], amount: number) => {
    const bh = h / colours.length;
    colours.forEach((c, i) => p.drawRectangle({ x, y: top - (i + 1) * bh, width: w, height: bh, color: tintOf(c, amount) }));
  };

  /**
   * A box patterned with every colour, as on screen (see `patternFor`):
   * stripes at the pattern's angle, or checks, clipped to the box.
   */
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
  const cfg = template.timeline!;
  text('Lesson timeline', M, y - 14, 16, bold);
  const subject = form.values.subject?.trim();
  const date = form.values.date ? formatValue('date', form.values.date) : '';
  const when = [formatTimeslot(tl.slot), tl.hasWindow ? `${tl.planned} / ${span} min planned` : ''].filter(Boolean).join(' · ');
  text(fit([subject || form.name, date, when].filter(Boolean).join(' · '), W - 2 * M, 9), M, y - 30, 9, font, MUTED);
  y -= 50;

  // ── Track ──────────────────────────────────────────────
  const x0 = M, x1 = W - M;
  const xOf = (m: number) => x0 + ((Math.min(Math.max(m, lo), hi) - lo) / span) * (x1 - x0);
  const trackH = tl.lanes * LANE;
  const top = y;
  page.drawRectangle({ x: x0, y: top - trackH, width: x1 - x0, height: trackH, color: rgb(0.98, 0.98, 0.97) });
  for (const [a, b] of tl.gaps) {
    page.drawRectangle({ x: xOf(a), y: top - trackH, width: xOf(b) - xOf(a), height: trackH, color: rgb(0.99, 0.91, 0.8) });
  }
  const step = span <= 40 ? 5 : span <= 120 ? 10 : span <= 240 ? 15 : 30;
  for (let m = Math.ceil(lo / step) * step; m <= hi; m += step) {
    const major = m % (step * 2) === 0 || m === lo || m === hi;
    const x = xOf(m);
    page.drawLine({ start: { x, y: top }, end: { x, y: top - trackH - (major ? 4 : 2) }, thickness: major ? 0.6 : 0.3, color: RULE });
    if (major) { const t = fromMinutes(m); text(t, x - font.widthOfTextAtSize(t, 7) / 2, top - trackH - 12, 7, font, MUTED); }
  }
  for (const s of tl.stages) {
    const bx = xOf(s.start), bw = Math.max(2, xOf(s.end) - bx);
    const by = top - s.lane * LANE - 2, bh = LANE - 4;
    patterned(page, bx, by, bw, bh, coloursOf(s), 0.3);
    bands(page, bx, by, Math.min(3, bw), bh, coloursOf(s), 1);
    if (s.overlap) page.drawRectangle({ x: bx, y: by - bh, width: bw, height: bh, borderColor: rgb(0.8, 0.1, 0.1), borderWidth: 1 });
    const room = bw - 8;
    if (room > 6) {
      text(fit(`${s.row + 1}. ${s.label || `stage ${s.row + 1}`}`, room, 8, bold), bx + 6, by - 13, 8, bold);
      text(fit(`${s.end - s.start} min · ${s.outcomes.length ? `LO ${s.outcomes.join(', ')}` : 'no LO'}`, room, 7), bx + 6, by - 25, 7, font, MUTED);
    }
  }
  page.drawRectangle({ x: x0, y: top - trackH, width: x1 - x0, height: trackH, borderColor: RULE, borderWidth: 0.6 });
  y = top - trackH - 32;

  // ── Learning outcomes key ──────────────────────────────
  const used = [...new Set(tl.stages.flatMap(s => s.outcomes))].sort((a, b) => a - b);
  const m = helveticaMetrics();
  if (used.length || tl.outcomes.length) {
    text('Learning outcomes', M, y, 9, bold);
    y -= 14;
    const shown = [...new Set([...tl.outcomes.map((_, i) => i + 1), ...used])];
    for (const n of shown) {
      const lines = wrap(m, clean(`LO ${n}: ${tl.outcomes[n - 1] || '(no longer listed)'}`), 8.5, W - 2 * M - 16);
      page.drawRectangle({ x: M, y: y - 1, width: 8, height: 8, color: tintOf(colourOf(n)) });
      lines.forEach((l, i) => text(l, M + 14, y - i * 11, 8.5));
      y -= lines.length * 11 + 3;
    }
    page.drawRectangle({ x: M, y: y - 1, width: 8, height: 8, color: tintOf(NO_CHOICE_COLOUR) });
    text('No learning outcome', M + 14, y, 8.5, font, MUTED);
    y -= 22;
  }

  // ── Stages table ───────────────────────────────────────
  const cols = [
    { title: 'Stage', w: 40 },
    { title: 'Time', w: 80 },
    { title: 'Mins', w: 36 },
    { title: 'Learning outcomes', w: 96 },
    { title: cfg.label === 'teacher' ? 'What is the teacher doing?' : 'Stage', w: W - 2 * M - 252 },
  ];
  const header = () => {
    let x = M + 6;
    page.drawRectangle({ x: M, y: y - 5, width: W - 2 * M, height: 16, color: rgb(0.93, 0.93, 0.91) });
    for (const c of cols) { text(c.title, x, y, 8, bold); x += c.w; }
    y -= 18;
  };
  const newPage = () => {
    page = doc.addPage([W, H]);
    y = H - M - 10;
    text('Lesson timeline (continued)', M, y, 9, bold, MUTED);
    y -= 22;
    header();
  };
  if (y < M + 60) newPage(); else header();

  const byRow = [...tl.stages].sort((a, b) => a.row - b.row);
  for (const s of byRow) {
    const lines = wrap(m, clean(s.label || '—'), 8.5, cols[4].w - 8);
    const rh = Math.max(1, lines.length) * 11 + 8;
    if (y - rh < M) newPage();
    const rowTop = y + 9;
    bands(page, M, rowTop, 3, rh, coloursOf(s), 1);
    let x = M + 6;
    const cells = [String(s.row + 1), `${fromMinutes(s.start)}–${fromMinutes(s.end)}`, String(s.end - s.start), s.outcomes.length ? `LO ${s.outcomes.join(', ')}` : '—'];
    cells.forEach((c, i) => { text(fit(c, cols[i].w - 6, 8.5, i === 0 ? bold : font), x, y, 8.5, i === 0 ? bold : font); x += cols[i].w; });
    lines.forEach((l, i) => text(l, x, y - i * 11, 8.5));
    y -= rh;
    page.drawLine({ start: { x: M, y: y + 9 }, end: { x: W - M, y: y + 9 }, thickness: 0.3, color: RULE });
  }
  if (tl.untimed.length) {
    if (y < M + 14) newPage();
    text(`No timing yet: ${tl.untimed.map(i => `stage ${i + 1}`).join(', ')}`, M, y - 4, 8, font, MUTED);
  }

  return await doc.save();
}
