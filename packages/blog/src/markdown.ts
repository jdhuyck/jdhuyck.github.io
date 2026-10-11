import { Marked, type Tokens } from 'marked';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import x86asm from 'highlight.js/lib/languages/x86asm';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('asm', x86asm);
hljs.registerLanguage('plaintext', plaintext);
// Exam-board pseudocode reads closest to Python.
hljs.registerAliases(['pseudocode', 'erl', 'pseudo'], { languageName: 'python' });
hljs.registerAliases(['py'], { languageName: 'python' });
hljs.registerAliases(['js'], { languageName: 'javascript' });
hljs.registerAliases(['ts'], { languageName: 'typescript' });
hljs.registerAliases(['cs', 'c#'], { languageName: 'csharp' });
hljs.registerAliases(['sh', 'shell', 'terminal'], { languageName: 'bash' });
hljs.registerAliases(['lmc', 'assembly'], { languageName: 'asm' });

const slugify = (s: string) =>
  s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export interface TocEntry { id: string; text: string; depth: number }

interface RendererThis {
  parser: { parse(t: Tokens.Generic[]): string; parseInline(t: Tokens.Generic[]): string };
}

/**
 * Callouts, GitHub style:
 *   > [!NOTE] / [!TIP] / [!WARNING] / [!EXAM] / [!KEYWORD]
 *   > Body text…
 */
const CALLOUTS: Record<string, string> = {
  NOTE: 'note',
  TIP: 'tip',
  WARNING: 'warning',
  EXAM: 'exam tip',
  KEYWORD: 'key term',
};

export function renderMarkdown(md: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const used = new Map<string, number>();

  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading(this: RendererThis, { tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens);
        let id = slugify(text) || 'section';
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        if (depth === 2 || depth === 3) toc.push({ id, text: text.replace(/<[^>]+>/g, ''), depth });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${text}</h${depth}>\n`;
      },
      code({ text, lang }: Tokens.Code) {
        const language = (lang ?? '').trim().split(/\s+/)[0].toLowerCase();
        const known = language && hljs.getLanguage(language);
        const html = known ? hljs.highlight(text, { language }).value : escapeHtml(text);
        const label = language || 'text';
        return `<figure class="code"><figcaption class="code__bar"><span>${escapeHtml(label)}</span><button class="code__copy" type="button">copy</button></figcaption><pre><code class="hljs language-${escapeHtml(label)}">${html}</code></pre></figure>\n`;
      },
      blockquote(this: RendererThis, { tokens }: Tokens.Blockquote) {
        const first = tokens[0] as Tokens.Paragraph | undefined;
        const m = first?.type === 'paragraph' ? /^\[!(\w+)\]\s*/.exec(first.raw) : null;
        const kind = m ? CALLOUTS[m[1].toUpperCase()] : undefined;
        if (!m || !kind) return `<blockquote>${this.parser.parse(tokens)}</blockquote>\n`;
        const strippedFirst = new Marked().parseInline(first!.raw.slice(m[0].length)) as string;
        const rest = this.parser.parse(tokens.slice(1));
        return `<aside class="callout callout--${m[1].toLowerCase()}"><p class="callout__label">${kind}</p><p>${strippedFirst}</p>${rest}</aside>\n`;
      },
      link(this: RendererThis, { href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const t = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(href)}"${t}${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
      },
    },
  });

  const html = marked.parse(md, { async: false }) as string;
  return { html, toc };
}

/** Wire up copy buttons in rendered code blocks. */
export function enhanceCodeBlocks(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('.code__copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.closest('.code')?.querySelector('code')?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = 'copied ✓';
      } catch {
        btn.textContent = 'press ⌘/Ctrl+C';
      }
      setTimeout(() => { btn.textContent = 'copy'; }, 1600);
    });
  });
}
