import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';

gsap.registerPlugin(Observer);

let currentIndex = 0;
let animating = false;
const sections = gsap.utils.toArray<HTMLElement>('section');

function gotoSection(index: number, direction: number) {
  if (animating || index < 0 || index >= sections.length) return;
  animating = true;

  const targetSection = sections[index];

  gsap.to(window, {
    duration: 0.8,
    scrollTo: targetSection,
    ease: 'power2.inOut',
    onComplete: () => {
      currentIndex = index;
      animating = false;
    }
  });
}

Observer.create({
  type: 'wheel,touch,pointer',
  wheelSpeed: -1,
  onDown: () => !animating && gotoSection(currentIndex - 1, -1),
  onUp: () => !animating && gotoSection(currentIndex + 1, 1),
  tolerance: 10,
  preventDefault: true
});
