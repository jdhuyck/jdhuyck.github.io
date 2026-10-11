# jdhuyck.github.io

The website of Mr Huyck, Teacher of Computing (KS3, GCSE, A Level, T Level).

Built with Vite, TypeScript (no framework) and [GSAP](https://gsap.com) with its plugins: ScrollTrigger, ScrollTo, SplitText, ScrambleText, Text, DrawSVG, MorphSVG, MotionPath, Flip, Draggable, Observer, Inertia, CustomEase and CustomWiggle.

```
src/                    site shell: router, nav, home, links, lab, theme
  gsap.ts               registers every GSAP plugin + house eases
  site.ts               names, blog categories, timeline, links, resources (edit me)
  components/           circuit background, CPU simulator, binary + logic gate widgets
packages/blog/          Markdown blog → /blog              (see its README)
packages/blog-admin/    local-only post editor → /admin    (dev server only; see its README)
packages/form-editor/   PDF form filler → /forms           (see its README)
public/templates/       blank PDFs used by the form editor
```

## Develop

```bash
npm install
npm run dev
```

`npm run build` type-checks and builds to `dist/`. While `npm run dev` is running, write posts at http://localhost:5173/admin. Pushing to `main` deploys to GitHub Pages; `dist/404.html` is a copy of `index.html`, so deep links like `/blog/some-post` work.

Every animation respects `prefers-reduced-motion`. The CPU walkthrough falls back to prev/next buttons.
