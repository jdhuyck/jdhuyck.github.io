import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Dev-server-only API for the blog editor (`/admin` in `npm run dev`).
 *
 *   GET  /__blog-admin/posts          → [{ slug, source }]
 *   POST /__blog-admin/posts          { slug, source, overwrite? } → writes posts/<slug>.md
 *
 * `apply: 'serve'` means this never exists in a production build, and
 * requests from anything but this machine are refused. Publishing still
 * happens the normal way: commit the new .md file and push.
 */
export function blogAdmin(postsDir: string): Plugin {
  const dir = resolve(postsDir);
  const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  // Files this plugin just wrote: skip the full page reload Vite would trigger
  // (posts are bundled with import.meta.glob), so the editor keeps its state.
  const justWrote = new Set<string>();

  return {
    name: 'blog-admin',
    apply: 'serve',
    handleHotUpdate(ctx) {
      if (justWrote.delete(ctx.file)) return [];
    },
    configureServer(server) {
      server.middlewares.use('/__blog-admin/posts', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        const ip = req.socket.remoteAddress ?? '';
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)) return send(403, { error: 'local only' });

        try {
          if (req.method === 'GET') {
            const files = (await readdir(dir)).filter(f => f.endsWith('.md') && !f.startsWith('_'));
            const posts = await Promise.all(files.map(async f => ({
              slug: f.replace(/\.md$/, ''),
              source: await readFile(resolve(dir, f), 'utf8'),
            })));
            return send(200, posts);
          }

          if (req.method === 'POST') {
            // Same-origin check: browsers send Origin on cross-site POSTs.
            const origin = req.headers.origin;
            if (origin && !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)) return send(403, { error: 'bad origin' });

            let raw = '';
            for await (const chunk of req) raw += chunk;
            const { slug, source, overwrite } = JSON.parse(raw) as { slug?: string; source?: string; overwrite?: boolean };
            if (!slug || !SLUG.test(slug)) return send(400, { error: 'slug must be lower-case words joined by hyphens' });
            if (typeof source !== 'string' || !source.startsWith('---')) return send(400, { error: 'source must start with frontmatter' });

            const file = resolve(dir, `${slug}.md`);
            if (existsSync(file) && !overwrite) return send(409, { error: `posts/${slug}.md already exists` });
            justWrote.add(file);
            await writeFile(file, source.endsWith('\n') ? source : `${source}\n`, 'utf8');
            return send(200, { ok: true, path: `packages/blog/posts/${slug}.md` });
          }

          send(405, { error: 'method not allowed' });
        } catch (err) {
          send(500, { error: err instanceof Error ? err.message : String(err) });
        }
      });
    },
  };
}
