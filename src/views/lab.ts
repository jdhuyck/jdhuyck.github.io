import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../gsap';
import { createViewShell } from './_shell';
import { createCpuSection } from '../components/cpu';
import { createBinaryWidget } from '../components/binary';
import { createGatesWidget } from '../components/gates';
import type { ViewHandle } from '../router';
import './lab.css';

/** Classroom interactives: the fetch–decode–execute simulator, binary and logic gates. */
export function createLabView(): ViewHandle {
  const view = createViewShell({
    className: 'view--lab',
    body: `
      <header class="page-head">
        <div class="container">
          <span class="eyebrow">cd ~/lab</span>
          <h1 class="page-head__title" data-split>Lab</h1>
          <p class="lede">Interactives for the classroom. Put them on the board, or let students explore at their own pace.</p>
        </div>
      </header>
      <div data-cpu></div>
      <section class="section" aria-label="More interactives">
        <div class="container">
          <div class="lab__grid" data-lab></div>
        </div>
      </section>
    `,
  });

  const cpu = createCpuSection();
  view.querySelector('[data-cpu]')!.replaceWith(cpu.el);
  const binary = createBinaryWidget();
  const gates = createGatesWidget();
  view.querySelector('[data-lab]')!.append(binary.el, gates.el);

  const mount = () => {
    cpu.animate();
    gates.animate();
    const stopBinary = binary.animate();

    if (!prefersReducedMotion()) {
      SplitText.create(view.querySelector('[data-split]')!, {
        type: 'chars',
        onSplit: self => gsap.from(self.chars, { autoAlpha: 0, yPercent: 80, stagger: 0.05, duration: 0.5, ease: 'relay' }),
      });
      ScrollTrigger.batch(view.querySelectorAll('.lab'), {
        start: 'top 88%',
        once: true,
        onEnter: els => gsap.from(els, { autoAlpha: 0, y: 40, duration: 0.7, stagger: 0.1 }),
      });
    }
    return stopBinary;
  };

  return { el: view, mount, title: 'Lab' };
}
