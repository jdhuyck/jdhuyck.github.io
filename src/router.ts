import { gsap, ScrollTrigger } from './gsap';

export interface RouteContext {
  router: Router;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
}

/**
 * What a route handler returns. A bare element is fine for static views;
 * return a handle when the view needs to animate after it is in the DOM.
 * Anything GSAP creates inside `mount` (tweens, ScrollTriggers, SplitText,
 * Draggables…) is reverted automatically when the route changes.
 */
export interface ViewHandle {
  el: HTMLElement;
  title?: string;
  mount?: () => void | (() => void);
}
export type ViewResult = HTMLElement | ViewHandle;
export type RouteHandler = (ctx: RouteContext) => ViewResult | Promise<ViewResult>;

export interface RouteTransition {
  out: (el: HTMLElement, to: string) => Promise<void>;
  in: (el: HTMLElement, path: string) => Promise<void>;
}

interface Route {
  pattern: string;
  regex: RegExp;
  keys: string[];
  handler: RouteHandler;
}

interface Mounted {
  el: HTMLElement;
  ctx: gsap.Context;
  cleanup?: () => void;
}

type ChangeListener = (path: string) => void;

const compile = (pattern: string) => {
  const keys: string[] = [];
  const src = pattern
    .replace(/\/+$/, '')
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:(\w+)/g, (_m, k: string) => { keys.push(k); return '([^/]+)'; });
  return { regex: new RegExp(`^${src || ''}/?$`), keys };
};

export class Router {
  private routes: Route[] = [];
  private current: Mounted | null = null;
  private listeners = new Set<ChangeListener>();
  private navId = 0;
  private readonly baseTitle: string;
  private readonly outlet: HTMLElement;
  private readonly opts: { notFound: RouteHandler; transition?: RouteTransition; baseTitle: string };

  constructor(outlet: HTMLElement, opts: { notFound: RouteHandler; transition?: RouteTransition; baseTitle: string }) {
    this.outlet = outlet;
    this.opts = opts;
    this.baseTitle = opts.baseTitle;
  }

  add(pattern: string, handler: RouteHandler): this {
    this.routes.push({ pattern, handler, ...compile(pattern) });
    return this;
  }

  get path(): string { return location.pathname.replace(/\/+$/, '') || '/'; }

  onChange(fn: ChangeListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  start(): void {
    window.addEventListener('popstate', () => void this.render());
    document.addEventListener('click', this.interceptLinks);
    // Deep links on GitHub Pages arrive via 404.html (a copy of index.html).
    void this.render();
  }

  navigate(to: string, { replace = false } = {}): void {
    const url = new URL(to, location.href);
    if (url.origin !== location.origin) { location.href = to; return; }

    const samePage = url.pathname === location.pathname && url.search === location.search;
    if (samePage && url.hash) {
      history.replaceState(null, '', url);
      this.scrollToHash(url.hash);
      return;
    }
    if (replace) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
    void this.render();
  }

  /** Update the query string without re-rendering (filters, search…). */
  replaceQuery(params: URLSearchParams): void {
    const qs = params.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
  }

  private interceptLinks = (e: MouseEvent): void => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest('a');
    if (!a || a.target || a.hasAttribute('download') || a.dataset.router === 'off') return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    this.navigate(url.pathname + url.search + url.hash);
  };

  private match(path: string): { route: Route | null; params: Record<string, string> } {
    for (const route of this.routes) {
      const m = route.regex.exec(path);
      if (m) {
        const params: Record<string, string> = {};
        route.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
        return { route, params };
      }
    }
    return { route: null, params: {} };
  }

  private async render(): Promise<void> {
    const id = ++this.navId;
    const path = this.path;
    const { route, params } = this.match(path);
    const handler = route?.handler ?? this.opts.notFound;
    const ctx: RouteContext = { router: this, path, params, query: new URLSearchParams(location.search) };

    this.listeners.forEach(fn => fn(path));

    const outgoing = this.current;
    const [result] = await Promise.all([
      Promise.resolve(handler(ctx)),
      outgoing && this.opts.transition ? this.opts.transition.out(outgoing.el, path) : Promise.resolve(),
    ]);
    if (id !== this.navId) return; // a newer navigation won

    if (outgoing) {
      outgoing.cleanup?.();
      outgoing.ctx.revert();
      outgoing.el.remove();
    }

    const handle: ViewHandle = result instanceof HTMLElement ? { el: result } : result;
    this.outlet.appendChild(handle.el);
    document.title = handle.title ? `${handle.title} · ${this.baseTitle}` : this.baseTitle;

    if (location.hash) requestAnimationFrame(() => this.scrollToHash(location.hash));
    else window.scrollTo(0, 0);

    let cleanup: (() => void) | undefined;
    const gctx = gsap.context(() => {
      const r = handle.mount?.();
      if (typeof r === 'function') cleanup = r;
    }, handle.el);
    this.current = { el: handle.el, ctx: gctx, cleanup };

    // Focus the new view's heading for screen readers / keyboard users.
    const heading = handle.el.querySelector<HTMLElement>('h1');
    if (heading && outgoing) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }

    ScrollTrigger.refresh();
    if (this.opts.transition && outgoing) {
      await this.opts.transition.in(handle.el, path);
      // The intro transform is cleared now; re-measure pins and triggers.
      if (id === this.navId) ScrollTrigger.refresh();
    }
  }

  private scrollToHash(hash: string): void {
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    // Honour CSS scroll-margin-top (for sticky sub-navs); else clear the fixed nav.
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
    gsap.to(window, { duration: 0.8, ease: 'power2.inOut', scrollTo: { y: target, offsetY: margin || navH + 16 } });
  }
}
