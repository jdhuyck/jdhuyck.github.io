import type { Template } from '../types';

/** Resolve `templates/x.pdf` against the site base so it works from any route. */
const resolveSource = (url: string): string =>
  /^(https?:)?\/\//.test(url) || url.startsWith('/')
    ? url
    : `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}${url}`;

class TemplateRegistry {
  private map = new Map<string, Template>();

  register(t: Template): void { this.map.set(t.id, { ...t, sourceUrl: resolveSource(t.sourceUrl) }); }
  unregister(id: string): void { this.map.delete(id); }
  get(id: string): Template | null { return this.map.get(id) ?? null; }
  list(): Template[] { return [...this.map.values()]; }
}

export const templates = new TemplateRegistry();
