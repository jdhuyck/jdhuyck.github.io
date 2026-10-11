import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export type PdfDoc = pdfjsLib.PDFDocumentProxy;

/** Widest the page is ever shown on screen, in CSS px; drives render resolution. */
const MAX_DISPLAY_WIDTH = 1100;

export async function loadPdf(url: string): Promise<PdfDoc> {
  return await pdfjsLib.getDocument({ url }).promise;
}

/**
 * Render a page to a canvas sized for crisp display at up to
 * MAX_DISPLAY_WIDTH CSS px. The canvas is styled to fill its container,
 * so callers can size the page responsively with CSS.
 */
export async function renderPage(doc: PdfDoc, pageNum: number): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNum);
  const base = page.getViewport({ scale: 1 });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = Math.min(4, (MAX_DISPLAY_WIDTH * dpr) / base.width);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  // Print intent renders in one pass (no requestAnimationFrame), so it also
  // completes in background tabs.
  await page.render({ canvas, canvasContext: ctx, viewport, intent: 'print' }).promise;
  return canvas;
}

/** PDF rect (origin bottom-left, points) → CSS percentages of the page box. */
export function pdfRectToPercent(
  rect: { x: number; y: number; w: number; h: number },
  pageSize: { width: number; height: number },
) {
  return {
    left:   `${(rect.x / pageSize.width) * 100}%`,
    top:    `${((pageSize.height - rect.y - rect.h) / pageSize.height) * 100}%`,
    width:  `${(rect.w / pageSize.width) * 100}%`,
    height: `${(rect.h / pageSize.height) * 100}%`,
  };
}

/**
 * CSS length for `pt` PDF points on a page `pageWidthPt` wide. Relies on the
 * page element being an inline-size container (`container-type: inline-size`).
 */
export const ptToCss = (pt: number, pageWidthPt: number): string =>
  `calc(${pt} * 100cqi / ${pageWidthPt})`;

/** Create the responsive page shell: an aspect-ratio box holding the canvas. */
export function createPageShell(pageSize: { width: number; height: number }, pageIdx: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'fe-page';
  wrap.dataset.page = String(pageIdx);
  wrap.style.aspectRatio = `${pageSize.width} / ${pageSize.height}`;
  wrap.style.setProperty('--fe-page-max', `${Math.round(pageSize.width * 1.6)}px`);
  return wrap;
}
