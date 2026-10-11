import { StandardFontEmbedder, StandardFonts } from 'pdf-lib';
import type { FieldType, Rect } from '../types';
import { formatTimeslot, parseTimeslot } from '../timeslot';
import { formatTimerange, parseTimerange } from '../timerange';

/**
 * The font measurements layout needs. Both the on-screen editor and the PDF
 * export use Helvetica's metrics, so what you see is what gets printed.
 */
export interface TextMetrics {
  widthOfTextAtSize(text: string, size: number): number;
  heightAtSize(size: number, options?: { descender?: boolean }): number;
  supports(codePoint: number): boolean;
}

let helvetica: TextMetrics | null = null;

/** Helvetica metrics, available synchronously (no PDF document needed). */
export function helveticaMetrics(): TextMetrics {
  if (helvetica) return helvetica;
  const emb = StandardFontEmbedder.for(StandardFonts.Helvetica as never);
  const supported = new Set(emb.encoding.supportedCodePoints);
  helvetica = {
    widthOfTextAtSize: (t, s) => emb.widthOfTextAtSize(t, s),
    heightAtSize: (s, o) => emb.heightOfFontAtSize(s, o),
    supports: cp => supported.has(cp),
  };
  return helvetica;
}

export interface FitOptions {
  maxSize: number;
  minSize: number;
  multiline: boolean;
  /** Line height as a multiple of font size. */
  leading?: number;
}

export interface FitResult {
  size: number;
  lines: string[];
  lineHeight: number;
  firstBaseline: number;
  padX: number;
  truncated: boolean;
}

export const PAD_X = 2;
export const PAD_Y = 1.5;
export const LEADING = 1.18;
const STEP = 0.5;
const ELLIPSIS = '…';

/** Greedy word-wrap; words longer than the line are broken by character. */
export function wrap(m: TextMetrics, text: string, size: number, maxWidth: number): string[] {
  const width = (s: string) => m.widthOfTextAtSize(s, size);
  const lines: string[] = [];

  for (const para of text.split(/\r?\n/)) {
    if (!para.trim()) { lines.push(''); continue; }
    let line = '';
    // Split on spaces but not on no-break spaces (U+00A0), which keep e.g. "15 min" together.
    for (const word of para.split(/[^\S\u00a0]+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (width(candidate) <= maxWidth) { line = candidate; continue; }
      if (line) lines.push(line);
      if (width(word) <= maxWidth) { line = word; continue; }
      // Hard-break an over-long word
      let chunk = '';
      for (const ch of word) {
        if (width(chunk + ch) > maxWidth && chunk) { lines.push(chunk); chunk = ch; }
        else chunk += ch;
      }
      line = chunk;
    }
    lines.push(line);
  }
  return lines;
}

const ascentOf = (m: TextMetrics, size: number) => m.heightAtSize(size, { descender: false });

/** Height a block of `lineCount` lines needs at `size`, including padding. */
export function blockHeight(m: TextMetrics, lineCount: number, size: number, leading = LEADING): number {
  return ascentOf(m, size) + Math.max(0, lineCount - 1) * size * leading + size * 0.22 + PAD_Y * 2;
}

/** Always end with an ellipsis, trimming characters until it fits. */
const withEllipsis = (m: TextMetrics, s: string, size: number, maxWidth: number) => {
  let out = s.trimEnd();
  while (out && m.widthOfTextAtSize(out + ELLIPSIS, size) > maxWidth) out = out.slice(0, -1);
  return out.trimEnd() + ELLIPSIS;
};

/**
 * How tall `rect` must be for `text` to fit without dropping below
 * `readable`. Returns `rect.h` if it already fits at a size ≥ readable;
 * otherwise the height needed at the readable size (text wraps).
 */
export function requiredHeight(
  m: TextMetrics, text: string, rect: Rect,
  opts: { maxSize: number; readable: number; multiline: boolean },
): number {
  if (!text.trim()) return rect.h;
  const fit = fitText(m, text, rect, { maxSize: opts.maxSize, minSize: opts.readable, multiline: opts.multiline });
  if (!fit.truncated) return rect.h;
  const lines = wrap(m, text, opts.readable, Math.max(1, rect.w - PAD_X * 2));
  return Math.max(rect.h, blockHeight(m, lines.length, opts.readable) + 0.5);
}

/**
 * Find the largest font size (≤ maxSize, ≥ minSize) at which `text` fits
 * inside `rect`. Multiline text wraps; single-line text must fit its width.
 * If nothing fits at minSize the text is truncated with an ellipsis.
 */
export function fitText(m: TextMetrics, text: string, rect: Rect, opts: FitOptions): FitResult {
  const leading = opts.leading ?? LEADING;
  const availW = Math.max(1, rect.w - PAD_X * 2);
  const availH = Math.max(1, rect.h - PAD_Y * 2);
  const maxSize = Math.min(opts.maxSize, opts.multiline ? opts.maxSize : availH);
  const minSize = Math.min(opts.minSize, maxSize);
  // Helvetica cap height ≈ 0.718 em; used to centre single lines optically.
  const capHeight = (size: number) => size * 0.718;
  const oneLine = text.replace(/\s*\n\s*/g, ' ');

  const result = (size: number, lines: string[], truncated: boolean): FitResult => {
    const lineHeight = size * leading;
    const firstBaseline = opts.multiline
      ? rect.y + rect.h - PAD_Y - ascentOf(m, size)
      : rect.y + (rect.h - capHeight(size)) / 2;
    return { size, lines, lineHeight, firstBaseline, padX: PAD_X, truncated };
  };

  for (let size = maxSize; size >= minSize - 1e-6; size -= STEP) {
    if (!opts.multiline) {
      if (m.widthOfTextAtSize(oneLine, size) <= availW) return result(size, [oneLine], false);
      continue;
    }
    const lines = wrap(m, text, size, availW);
    if (blockHeight(m, lines.length, size, leading) - PAD_Y * 2 <= availH + 0.05) return result(size, lines, false);
  }

  // Doesn't fit even at the minimum size: keep what fits and mark it.
  const size = minSize;
  if (!opts.multiline) {
    const fits = m.widthOfTextAtSize(oneLine, size) <= availW;
    return result(size, [fits ? oneLine : withEllipsis(m, oneLine, size, availW)], !fits);
  }
  const lines = wrap(m, text, size, availW);
  const maxLines = Math.max(1, Math.floor((availH - ascentOf(m, size) - size * 0.22) / (size * leading)) + 1);
  if (lines.length <= maxLines) return result(size, lines, false);
  const kept = lines.slice(0, maxLines);
  kept[kept.length - 1] = withEllipsis(m, kept[kept.length - 1], size, availW);
  return result(size, kept, true);
}

/** Replace characters the standard PDF font can't encode (emoji, arrows…). */
export function sanitizer(m: TextMetrics): (s: string) => string {
  const swaps: Record<string, string> = { '→': '->', '←': '<-', '≤': '<=', '≥': '>=', '≠': '!=', '×': 'x', '\t': '    ' };
  return (s: string) => {
    let out = '';
    for (const ch of s) {
      if (ch === '\n' || ch === '\r') { out += ch; continue; }
      if (m.supports(ch.codePointAt(0)!)) out += ch;
      else if (swaps[ch]) out += swaps[ch];
      else out += '?';
    }
    return out;
  };
}

/** Format stored values for print (e.g. ISO dates → dd/mm/yyyy). */
export function formatValue(type: FieldType, value: string): string {
  if (type === 'date') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  if (type === 'timeslot') return formatTimeslot(parseTimeslot(value));
  if (type === 'timerange') return formatTimerange(parseTimerange(value));
  return value;
}
