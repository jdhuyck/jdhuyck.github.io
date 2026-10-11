import { gsap, SCRAMBLE_BINARY, prefersReducedMotion } from '../gsap';
import { createViewShell, esc } from './_shell';
import type { RouteContext, ViewHandle } from '../router';

export function createNotFoundView(ctx: RouteContext): ViewHandle {
  const view = createViewShell({
    className: 'view--404',
    body: `
      <div class="container section">
        <span class="eyebrow">exit code 404</span>
        <h1 class="page-head__title" data-code>404</h1>
        <pre class="panel" style="padding: var(--sp-5); white-space: pre-wrap; margin-bottom: var(--sp-5);"><span class="prompt">cd ${esc(ctx.path)}</span>
<span style="color: var(--c-error)">bash: cd: ${esc(ctx.path)}: No such file or directory</span></pre>
        <a class="btn btn--primary" href="/">cd ~</a>
      </div>
    `,
  });

  const mount = () => {
    if (prefersReducedMotion()) return;
    const code = view.querySelector<HTMLElement>('[data-code]')!;
    code.textContent = '';
    gsap.to(code, {
      duration: 1.2,
      scrambleText: { text: '404', chars: SCRAMBLE_BINARY, revealDelay: 0.4 },
    });
  };

  return { el: view, mount, title: 'Not found' };
}
