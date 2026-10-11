import { parseFrontmatter, type FrontValue } from './frontmatter';
import { keyStages, levelFromLabel, blogCategories, categoryById, type LevelId, type CategoryId } from '../../../src/site';

export interface Post {
  slug: string;
  title: string;
  date: string;          // ISO yyyy-mm-dd
  summary: string;
  /** One of the blog categories in src/site.ts. */
  category?: CategoryId;
  levels: LevelId[];
  tags: string[];
  /** Specification reference, e.g. "OCR J277 1.1" or "AQA 7517 4.7". */
  spec?: string;
  draft: boolean;
  body: string;          // markdown
  readingMinutes: number;
}

/**
 * Every `posts/*.md` file is bundled at build time. Files starting with `_`
 * (like `_template.md`) are ignored. Drafts are visible in `npm run dev` only.
 */
const files = import.meta.glob('../posts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const asString = (v: FrontValue | undefined): string => (typeof v === 'string' ? v : Array.isArray(v) ? v.join(', ') : '');
const asList = (v: FrontValue | undefined): string[] =>
  Array.isArray(v) ? v : typeof v === 'string' && v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];

const words = (md: string) => md.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;

function load(): Post[] {
  const posts: Post[] = [];
  for (const [path, raw] of Object.entries(files)) {
    const file = path.split('/').pop()!;
    if (file.startsWith('_') || !raw) continue; // `raw` is blank for drafts in production
    const slug = file.replace(/\.md$/, '');
    const { data, body } = parseFrontmatter(raw);

    const levels = asList(data.levels).map(levelFromLabel).filter((l): l is LevelId => !!l);
    const unknown = asList(data.levels).filter(l => !levelFromLabel(l));
    if (unknown.length && import.meta.env.DEV) {
      console.warn(`[blog] ${file}: unknown level(s) ${unknown.join(', ')}. Use ${keyStages.map(k => k.label).join(' / ')}.`);
    }

    const categoryRaw = asString(data.category).toLowerCase().trim();
    const category = categoryById(categoryRaw)?.id;
    if (categoryRaw && !category && import.meta.env.DEV) {
      console.warn(`[blog] ${file}: unknown category "${categoryRaw}". Use one of: ${blogCategories.map(c => c.id).join(', ')}.`);
    }

    posts.push({
      slug,
      title: asString(data.title) || slug,
      date: asString(data.date) || '1970-01-01',
      summary: asString(data.summary),
      category,
      levels,
      tags: asList(data.tags).map(t => t.toLowerCase()),
      spec: asString(data.spec) || undefined,
      draft: data.draft === true,
      body,
      readingMinutes: Math.max(1, Math.round(words(body) / 200)),
    });
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

const ALL = load();

export const getPosts = (): Post[] => ALL.filter(p => import.meta.env.DEV || !p.draft);

export const getPost = (slug: string): Post | undefined => getPosts().find(p => p.slug === slug);

export const allTags = (posts: Post[]): string[] => [...new Set(posts.flatMap(p => p.tags))].sort();

export const formatDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const levelBadges = (levels: LevelId[]): string =>
  levels.map(id => {
    const k = keyStages.find(s => s.id === id)!;
    return `<span class="chip level level--${id}">${k.label}</span>`;
  }).join('');

export const categoryBadge = (id: CategoryId | undefined): string => {
  const c = id && categoryById(id);
  return c ? `<span class="chip cat cat--${c.id}">${c.label}</span>` : '';
};
