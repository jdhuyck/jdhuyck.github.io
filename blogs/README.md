## Blogs structure

```
_posts/
    2025-01-01-lorem-ipsum.md
    2025-01-02-dolor-sit-amet.md
_layouts/
    posts.html
```

## Front Matter
```markdown
---
title: "Building Efficient Data Pipeline"
data: 2025-01-01
excerpt: "Lorem Ipsum"
spoiler: "Sneak Peak text"
---
```

## Automation

```bash
#!/bin/bash
hugo new posts/$(date +%Y-%m-%d)-$1.md
```