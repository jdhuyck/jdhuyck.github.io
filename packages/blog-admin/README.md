# blog-admin

A local editor for writing blog posts, at **http://localhost:5173/admin** while `npm run dev` is running.

- Fields for every frontmatter value: title, slug, date, summary, category, audience, tags, spec reference and draft.
- Markdown with a live preview rendered exactly as the published post: callouts, code highlighting, headings.
- **:w** (or Ctrl/⌘+S) saves `packages/blog/posts/<slug>.md`. To publish, commit the file and push to `main`.

## Why it's only yours

GitHub Pages serves static files. It has no server to check a password, so any "login" in the browser could be read and bypassed from the public JavaScript. Instead, the editor only exists on your machine:

- `vite-plugin.ts` adds the save API to the **dev server only** (`apply: 'serve'`). It accepts requests from `localhost` only, and it isn't loaded by `vite build`.
- `src/main.ts` registers `/admin` inside `if (import.meta.env.DEV)`, so production builds drop the route. `npm run build` output contains none of this code.
- Publishing still needs push access to the GitHub repo, which only you have.

## Moving it into a private submodule (optional)

The code above is safe to keep in the public repo: it contains no secrets and never runs on the live site. Make it private if you'd rather keep the editor itself out of view, or if you later add private templates or drafts:

```bash
# 1. Create an empty private repo, e.g. github.com/jdhuyck/blog-admin, then:
cd packages/blog-admin
git init && git add . && git commit -m "Blog editor"
git remote add origin git@github.com:jdhuyck/blog-admin.git && git push -u origin main
cd ../..

# 2. Replace the folder with a submodule
rm -rf packages/blog-admin
git submodule add git@github.com:jdhuyck/blog-admin.git packages/blog-admin
```

Everything is wired so the folder is optional. With the submodule not checked out (as on GitHub Actions, which can't read your private repo), the site builds and deploys normally; there's just no `/admin`.

## Writing from anywhere (future)

Editing on the live site, from any device, would need real authentication. The usual approach is a GitHub OAuth app plus a tiny server-side token exchange (e.g. a Cloudflare Worker), with the editor committing posts through the GitHub API. Never put an OAuth client secret or a password in front-end code.
