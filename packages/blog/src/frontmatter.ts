/**
 * Minimal frontmatter reader for the subset of YAML the blog needs:
 *   key: value
 *   key: "quoted value"
 *   key: [a, b, "c d"]
 *   key:
 *     - a
 *     - b
 *   key: true | false
 * Anything fancier belongs in the post body.
 */
export type FrontValue = string | boolean | string[];

const unquote = (s: string): string => {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
};

const scalar = (raw: string): FrontValue => {
  const t = raw.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t.startsWith('[') && t.endsWith(']')) {
    const inner = t.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(/,(?=(?:[^"']|"[^"]*"|'[^']*')*$)/).map(unquote).filter(Boolean);
  }
  return unquote(t);
};

export function parseFrontmatter(source: string): { data: Record<string, FrontValue>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!m) return { data: {}, body: source };

  const data: Record<string, FrontValue> = {};
  let listKey: string | null = null;

  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) {
      (data[listKey] as string[]).push(unquote(item[1]));
      continue;
    }

    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value.trim() === '') {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = scalar(value);
      listKey = null;
    }
  }

  return { data, body: source.slice(m[0].length) };
}
