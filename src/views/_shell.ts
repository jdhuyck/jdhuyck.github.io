export interface ViewShellOptions {
  /** Inner HTML for the view. */
  body: string;
  /** Extra class(es) for the root element, e.g. `view--blog`. */
  className?: string;
  /**
   * `page`: normal scrolling document (default).
   * `split`: fixed-height IDE layout with `.ide-bar`, `.ide-sidebar`,
   *          `.ide-main` and `.ide-status` children.
   */
  layout?: 'page' | 'split';
  /** `ide` darkens the view surface; `default` uses the site background. */
  theme?: 'default' | 'ide';
}

/** Common root element for every routed view. */
export function createViewShell({
  body,
  className = '',
  layout = 'page',
  theme = 'default',
}: ViewShellOptions): HTMLElement {
  const el = document.createElement('section');
  el.className = ['view', `view--${layout}`, `theme-${theme}`, className].filter(Boolean).join(' ');
  el.innerHTML = body;
  return el;
}

/** Escape text for safe interpolation into template-literal HTML. */
export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
