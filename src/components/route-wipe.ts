import { gsap, SCRAMBLE_TERM, prefersReducedMotion } from '../gsap';
import type { RouteTransition } from '../router';

/**
 * Page transition: a terminal panel wipes down over the old view while the
 * command for the new route scrambles in, then wipes away to reveal it.
 */
export function createRouteWipe(): { el: HTMLElement; transition: RouteTransition } {
  const el = document.createElement('div');
  el.className = 'route-wipe';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<span class="route-wipe__cmd"><span class="prompt" data-cmd></span><span class="cursor"></span></span>`;
  const cmd = el.querySelector<HTMLElement>('[data-cmd]')!;

  gsap.set(el, { scaleY: 0, transformOrigin: '50% 0%' });

  const transition: RouteTransition = {
    out: (view, to) => new Promise(resolve => {
      if (prefersReducedMotion()) {
        gsap.to(view, { autoAlpha: 0, duration: 0.15, onComplete: resolve });
        return;
      }
      const target = to === '/' ? 'cd ~' : `cd ~${to}`;
      gsap.timeline({ onComplete: () => resolve() })
        .to(view, { autoAlpha: 0.4, duration: 0.15, ease: 'power2.in' }, 0)
        .set(el, { transformOrigin: '50% 0%' }, 0)
        .to(el, { scaleY: 1, duration: 0.2, ease: 'power3.inOut' }, 0)
        .to(cmd, { duration: 0.2, scrambleText: { text: target, chars: SCRAMBLE_TERM, speed: 2 } }, 0.05);
    }),
    in: (view) => new Promise(resolve => {
      if (prefersReducedMotion()) {
        gsap.fromTo(view, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, onComplete: resolve });
        return;
      }
      gsap.timeline({ onComplete: () => resolve() })
        .set(el, { transformOrigin: '50% 100%' })
        .to(el, { scaleY: 0, duration: 0.25, ease: 'power3.inOut' })
        .from(view, { autoAlpha: 0, duration: 0.25, clearProps: 'opacity,visibility' }, '-=0.15')
        .set(cmd, { textContent: '' });
    }),
  };

  return { el, transition };
}
