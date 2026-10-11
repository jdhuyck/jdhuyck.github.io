import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/**
 * GitHub Pages has no SPA rewrites, so deep links like /blog/my-post would 404.
 * Serving a copy of index.html as 404.html lets the client router take over.
 */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

/**
 * Blog drafts are hidden in production, but `import.meta.glob` would still
 * bundle their text. Blank them out of production builds entirely.
 */
function stripDrafts(): Plugin {
  return {
    name: 'blog-strip-drafts',
    apply: 'build',
    transform(code, id) {
      if (!/\/posts\/[^/]+\.md\?raw$/.test(id)) return null;
      const front = /^export default "---\\n([\s\S]*?)\\n---/.exec(code)?.[1] ?? '';
      return /(^|\\n)draft:\s*true\b/.test(front) ? { code: 'export default ""', map: null } : null;
    },
  }
}

/** The local blog editor's dev-server API, if packages/blog-admin is present. */
async function optionalBlogAdmin(): Promise<Plugin[]> {
  const entry = resolve('packages/blog-admin/vite-plugin.ts')
  if (!existsSync(entry)) return []
  // Not a static import: the folder may be a private submodule that isn't checked out.
  const { blogAdmin } = await import(entry) as { blogAdmin: (postsDir: string) => Plugin }
  return [blogAdmin('packages/blog/posts')]
}

export default defineConfig(async ({ command }) => ({
  base: '/',
  plugins: [
    spaFallback(),
    stripDrafts(),
    ...(command === 'serve' ? await optionalBlogAdmin() : []),
  ],
  resolve: {
    // packages/* carry their own node_modules; force a single copy of each lib
    // so GSAP plugins register on the same instance everywhere.
    dedupe: ['gsap', 'pdf-lib', 'pdfjs-dist', 'marked', 'highlight.js'],
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    // /forms lazy-loads pdf.js + pdf-lib (~900 kB); nothing else comes close.
    chunkSizeWarningLimit: 1000,
  },
}))
