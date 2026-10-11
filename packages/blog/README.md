# blog

Markdown blog for the Mr Huyck site, built into the root app at `/blog`.

## Writing a post

1. Copy `posts/_template.md` to `posts/<slug>.md`. The filename becomes the URL (`/blog/<slug>`).
2. Fill in the frontmatter:

   ```yaml
   ---
   title: What actually happens in the fetch–decode–execute cycle?
   date: 2026-10-10
   summary: One or two sentences for the list and the home page.
   levels: [GCSE, A Level]      # any of KS3, GCSE, A Level, T Level
   tags: [cpu, registers]       # lower-case, used for filtering
   spec: OCR J277 1.1           # optional
   draft: true                  # remove to publish
   ---
   ```

3. Run `npm run dev` at the repo root. Drafts only show in dev, so you can preview before publishing.
4. Delete `draft: true` and push to `main` to publish.

## What Markdown supports

- GitHub-flavoured Markdown: tables, task lists, autolinks.
- Code fences with highlighting for `python`, `pseudocode`, `javascript`, `typescript`, `java`, `csharp`, `sql`, `bash`, `html`, `css`, `json` and `asm`/`lmc`. Each block gets a copy button.
- Callouts:

  ```md
  > [!EXAM]
  > Say the PC's value is *copied* to the MAR.
  ```

  The types are `NOTE`, `TIP`, `WARNING`, `EXAM` (exam tip) and `KEYWORD` (key term).
- Level 2 and 3 headings build a "contents" sidebar once a post has three or more.

## Files

| Path | Purpose |
|------|---------|
| `posts/*.md` | Posts. Files starting with `_` are ignored. |
| `src/posts.ts` | Loads and parses posts at build time (`import.meta.glob`). |
| `src/frontmatter.ts` | Tiny YAML-subset frontmatter parser. |
| `src/markdown.ts` | `marked` + `highlight.js` rendering, callouts, heading anchors. |
| `src/index.ts` | `/blog` list (search, level/tag filters with GSAP Flip) and post views. |
