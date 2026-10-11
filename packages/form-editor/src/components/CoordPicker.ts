import type { Template } from '../types';
import { loadPdf, renderPage, pdfRectToPercent, createPageShell } from '../pdf/render';
import { groupCellRect } from '../layout';

/**
 * Template authoring aid ("measure" mode).
 * Drag a box on the blank PDF to get a ready-to-paste field definition in
 * PDF points (origin bottom-left). Existing fields are outlined so you can
 * check their positions. The latest snippet is also copied to the clipboard.
 */
export async function mountCoordPicker(template: Template, container: HTMLElement): Promise<void> {
  container.innerHTML = '';
  const doc = await loadPdf(template.sourceUrl);

  const layout = document.createElement('div');
  layout.className = 'fe-measure';
  layout.innerHTML = `
    <aside class="fe-measure__panel">
      <p class="fe-measure__title">measure</p>
      <p class="output--muted">Drag on the page to draw a field. Coordinates are PDF points from the bottom-left.</p>
      <pre class="fe-measure__out" data-out>// draw a box…</pre>
      <button type="button" class="ibtn" data-copy>copy</button>
    </aside>
    <div class="fe-measure__pages" data-pages></div>
  `;
  container.appendChild(layout);
  const out = layout.querySelector<HTMLElement>('[data-out]')!;
  const pagesEl = layout.querySelector<HTMLElement>('[data-pages]')!;
  layout.querySelector('[data-copy]')!.addEventListener('click', () => void navigator.clipboard?.writeText(out.textContent ?? ''));

  const { width: W, height: H } = template.pageSize;

  for (let pageIdx = 0; pageIdx < template.pageCount; pageIdx++) {
    const page = createPageShell(template.pageSize, pageIdx);
    page.classList.add('fe-page--picker');
    page.appendChild(await renderPage(doc, pageIdx + 1));

    const overlay = document.createElement('div');
    overlay.className = 'fe-overlay';
    page.appendChild(overlay);

    const outline = (rect: { x: number; y: number; w: number; h: number }, label: string) => {
      const box = document.createElement('div');
      box.className = 'fe-measure__existing';
      box.title = label;
      Object.assign(box.style, pdfRectToPercent(rect, template.pageSize));
      overlay.appendChild(box);
    };
    template.fields.filter(f => f.page === pageIdx).forEach(f => outline(f.rect, f.id));
    (template.groups ?? []).filter(g => g.page === pageIdx).forEach(g => {
      const n = g.initialRows ?? 3;
      for (let i = 0; i < n; i++) g.fields.forEach(rf => outline(groupCellRect(g, rf, i, n), `${g.id}.${i}.${rf.id}`));
      if (g.area) {
        outline({ x: g.origin.x, y: g.origin.y + g.rowHeight - g.area.height, w: Math.max(...g.fields.map(rf => rf.offset.x + rf.size.w)), h: g.area.height }, `${g.id} (area)`);
      }
    });

    const sel = document.createElement('div');
    sel.className = 'fe-measure__sel';
    sel.hidden = true;
    overlay.appendChild(sel);

    const toPdf = (e: PointerEvent) => {
      const r = page.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(W, ((e.clientX - r.left) / r.width) * W)),
        y: Math.max(0, Math.min(H, H - ((e.clientY - r.top) / r.height) * H)),
      };
    };

    let start: { x: number; y: number } | null = null;
    const rectFrom = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
      x: Math.round(Math.min(a.x, b.x)),
      y: Math.round(Math.min(a.y, b.y)),
      w: Math.max(1, Math.round(Math.abs(a.x - b.x))),
      h: Math.max(1, Math.round(Math.abs(a.y - b.y))),
    });

    page.addEventListener('pointerdown', (e) => {
      start = toPdf(e);
      page.setPointerCapture(e.pointerId);
      sel.hidden = false;
      Object.assign(sel.style, pdfRectToPercent({ ...start, w: 0, h: 0 }, template.pageSize));
    });
    page.addEventListener('pointermove', (e) => {
      if (!start) return;
      Object.assign(sel.style, pdfRectToPercent(rectFrom(start, toPdf(e)), template.pageSize));
    });
    page.addEventListener('pointerup', (e) => {
      if (!start) return;
      const rect = rectFrom(start, toPdf(e));
      start = null;
      const snippet = `{ id: 'field', type: '${rect.h > 24 ? 'multiline' : 'text'}', label: 'Field',\n  page: ${pageIdx}, rect: { x: ${rect.x}, y: ${rect.y}, w: ${rect.w}, h: ${rect.h} } },`;
      out.textContent = snippet;
      void navigator.clipboard?.writeText(snippet).catch(() => { /* clipboard blocked */ });
    });

    pagesEl.appendChild(page);
  }
}
