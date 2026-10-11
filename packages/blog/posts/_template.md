---
# Copy this file to posts/your-post-slug.md (the filename becomes the URL: /blog/your-post-slug).
# Files starting with "_" are never published.
title: A clear, specific title
date: 2026-01-31
summary: One or two sentences shown on the blog list and home page.
# One of: pedagogy, adaptive-practice, curriculum-design, curriculum-policy,
#         cognition-inclusion, computing-landscape, computational-past
category: pedagogy
# Optional audience badges, any of: KS3, GCSE, A Level, T Level
levels: [GCSE, A Level]
# Lower-case topic tags, used for finer filtering
tags: [programming, primm]
# Optional specification reference shown under the title
spec: OCR J277 2.1
# Drafts only appear when running `npm run dev`. Delete this line (or set false) to publish.
draft: true
---

Open with the question the post answers, in plain language.

## A section heading

Headings at level 2 and 3 build the "contents" sidebar automatically once there are three or more.

> [!KEYWORD]
> **Abstraction**: removing unnecessary detail to focus on what matters for the problem.

> [!EXAM]
> Callouts work for exam tips (`[!EXAM]`), key terms (`[!KEYWORD]`), tips (`[!TIP]`), notes (`[!NOTE]`) and warnings (`[!WARNING]`).

```python
def linear_search(items, target):
    for i, item in enumerate(items):
        if item == target:
            return i
    return -1
```

Code fences highlight `python`, `pseudocode`, `javascript`, `typescript`, `java`, `csharp`, `sql`, `bash`, `html`, `css`, `json` and `asm`.

| Input | Output |
|-------|--------|
| 0     | 1      |
| 1     | 0      |
