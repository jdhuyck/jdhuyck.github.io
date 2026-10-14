import {
  PDFDocument, StandardFonts, TextAlignment, rgb,
  pushGraphicsState, popGraphicsState, rectangle, clip, endPath, concatTransformationMatrix, drawObject,
  type PDFEmbeddedPage, type PDFFont, type PDFPage, type PDFTextField,
} from 'pdf-lib';
import type { Template, FilledForm } from '../types';
import { layoutForm, type Cell } from './flow';
import { helveticaMetrics } from './fit';

export type ExportMode = 'flatten' | 'fillable';

export interface ExportResult {
  bytes: Uint8Array;
  /** Fields whose text was still too long at the minimum font size. */
  truncated: string[];
  pageCount: number;
}

/**
 * Build the finished PDF. Pages are composed from bands of the template
 * (copied or stretched), so tables have exactly the rows in use and boxes
 * grow to fit their text, pushing later content down and onto new pages.
 *  - `flatten`: text is drawn into the page.
 *  - `fillable`: real AcroForm fields at the same positions, pre-filled,
 *    with font size 0 (auto) so text keeps fitting as it is edited.
 */
export async function exportForm(
  template: Template,
  form: FilledForm,
  mode: ExportMode = 'flatten',
): Promise<ExportResult> {
  const res = await fetch(template.sourceUrl);
  if (!res.ok) throw new Error(`Template PDF not found at ${template.sourceUrl} (HTTP ${res.status}).`);
  const src = await PDFDocument.load(await res.arrayBuffer());
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const layout = layoutForm(template, form, helveticaMetrics(), { mode: 'print' });
  const { width: W, height: H } = layout.pageSize;

  doc.setTitle(form.name);
  doc.setSubject(template.name);
  doc.setCreationDate(new Date());

  // Each source page is embedded once; bands draw it through a clipping
  // rectangle, scaled vertically when a blank area has been stretched.
  const srcPages = src.getPages();
  const embedded = new Map<number, PDFEmbeddedPage>();
  const pageXObject = async (p: number) => {
    let e = embedded.get(p);
    if (!e) { e = await doc.embedPage(srcPages[p]); embedded.set(p, e); }
    return e;
  };

  const pdfForm = mode === 'fillable' ? doc.getForm() : null;
  const autoSized: PDFTextField[] = [];
  const usedNames = new Set<string>();

  for (const out of layout.pages) {
    const page = doc.addPage([W, H]);
    for (const b of out.bands) {
      const e = await pageXObject(b.page);
      const name = page.node.newXObject('Band', e.ref);
      const outBottom = H - b.y - b.h;
      const sy = b.h / (b.top - b.bottom);
      const [x0, x1] = b.x?.from ?? [0, W];
      const [ox0, ox1] = b.x?.to ?? [0, W];
      const sx = (ox1 - ox0) / (x1 - x0);
      page.pushOperators(
        pushGraphicsState(),
        rectangle(ox0, outBottom, ox1 - ox0, b.h),
        clip(),
        endPath(),
        // Map source [x0, x1] × [bottom, top] onto output [ox0, ox1] × [outBottom, outBottom + h].
        concatTransformationMatrix(sx, 0, 0, sy, ox0 - x0 * sx, outBottom - b.bottom * sy),
        drawObject(name),
        popGraphicsState(),
      );
    }
    for (const l of out.labels) {
      const f = l.bold ? bold : font;
      page.drawText(l.text, { x: l.x + (l.w - f.widthOfTextAtSize(l.text, l.size)) / 2, y: l.y, size: l.size, font: f, color: rgb(0, 0, 0) });
    }
    for (const cell of out.cells) {
      if (cell.number && (cell.text || mode === 'fillable')) drawNumber(page, cell, font);
      if (pdfForm) addFormField(pdfForm, page, cell, font, usedNames, autoSized);
      else drawCell(page, cell, font);
    }
  }

  // pdf-lib writes the size it chose into each /DA. Reset it to 0 (auto) so
  // PDF readers keep re-fitting the text as it is edited.
  for (const tf of autoSized) {
    const field = tf.acroField;
    const fix = (da: string | undefined) => da?.replace(/(\d+(?:\.\d+)?)\s+Tf/, '0 Tf');
    const da = fix(field.getDefaultAppearance());
    if (da) field.setDefaultAppearance(da);
    for (const w of field.getWidgets()) {
      const wda = fix(w.getDefaultAppearance());
      if (wda) w.setDefaultAppearance(wda);
    }
  }

  const bytes = await doc.save(pdfForm ? { updateFieldAppearances: false } : undefined);
  return { bytes, truncated: layout.truncated, pageCount: layout.pages.length };
}

function drawNumber(page: PDFPage, cell: Cell, font: PDFFont) {
  const size = cell.fit?.size ?? 9;
  const baseline = cell.fit ? cell.fit.firstBaseline : cell.rect.y + cell.rect.h - size;
  page.drawText(cell.number!.text, { x: cell.number!.x, y: baseline, size, font, color: rgb(0, 0, 0) });
}

function drawCell(page: PDFPage, cell: Cell, font: PDFFont) {
  if (cell.type === 'checkbox') {
    if (cell.value !== 'true') return;
    const { x, y, w, h } = cell.rect;
    const s = Math.min(w, h);
    const ox = x + (w - s) / 2;
    const oy = y + (h - s) / 2;
    page.drawSvgPath(`M ${0.18 * s} ${0.52 * s} L ${0.42 * s} ${0.76 * s} L ${0.84 * s} ${0.22 * s}`, {
      x: ox, y: oy + s, borderColor: rgb(0, 0, 0), borderWidth: Math.max(1, s * 0.12),
    });
    return;
  }
  const fit = cell.fit;
  if (!fit || !cell.text) return;
  const align = cell.field.align ?? 'left';
  fit.lines.forEach((line, i) => {
    const w = font.widthOfTextAtSize(line, fit.size);
    let x = cell.rect.x + fit.padX;
    if (align === 'center') x = cell.rect.x + (cell.rect.w - w) / 2;
    else if (align === 'right') x = cell.rect.x + cell.rect.w - w - fit.padX;
    page.drawText(line, { x, y: fit.firstBaseline - i * fit.lineHeight, size: fit.size, font, color: rgb(0, 0, 0) });
  });
}

function addFormField(
  pdfForm: ReturnType<PDFDocument['getForm']>,
  page: PDFPage,
  cell: Cell,
  font: PDFFont,
  used: Set<string>,
  autoSized: PDFTextField[],
) {
  let name = cell.id.replace(/\./g, '_').replace(/-/g, '_');
  while (used.has(name)) name += '_';
  used.add(name);
  const box = { x: cell.rect.x, y: cell.rect.y, width: cell.rect.w, height: cell.rect.h };

  if (cell.type === 'checkbox') {
    const cb = pdfForm.createCheckBox(name);
    cb.addToPage(page, { ...box, borderWidth: 0.75, borderColor: rgb(0.4, 0.4, 0.4), backgroundColor: undefined });
    if (cell.value === 'true') cb.check();
    return;
  }

  const tf = pdfForm.createTextField(name);
  if (cell.fit && (cell.fit.lines.length > 1 || cell.type === 'multiline')) tf.enableMultiline();
  const align = cell.field.align ?? 'left';
  tf.setAlignment(align === 'center' ? TextAlignment.Center : align === 'right' ? TextAlignment.Right : TextAlignment.Left);
  tf.setText(cell.text);
  // `backgroundColor: undefined` keeps the template's printed box visible.
  tf.addToPage(page, { ...box, font, borderWidth: 0, backgroundColor: undefined });
  autoSized.push(tf);
}
