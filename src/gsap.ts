/**
 * Single place where GSAP and every plugin the site uses is registered.
 * Import `gsap` and plugins from here rather than from 'gsap' directly so
 * registration is guaranteed to have happened first.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { TextPlugin } from 'gsap/TextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Flip } from 'gsap/Flip';
import { Draggable } from 'gsap/Draggable';
import { Observer } from 'gsap/Observer';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { CustomWiggle } from 'gsap/CustomWiggle';

gsap.registerPlugin(
  ScrollTrigger,
  ScrollToPlugin,
  SplitText,
  ScrambleTextPlugin,
  TextPlugin,
  DrawSVGPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  Flip,
  Draggable,
  Observer,
  InertiaPlugin,
  CustomEase,
  CustomWiggle,
);

// ── House eases ──────────────────────────────────────────
/** Quick snap with a tiny overshoot: like a relay clicking shut. */
CustomEase.create('relay', 'M0,0 C0.14,0 0.24,1.12 0.46,1.04 0.62,0.98 0.8,1 1,1');
/** Stepped "clock tick" feel for register updates. */
CustomEase.create('tick', 'M0,0 C0.5,0 0.5,1 1,1');
/** Error shake for invalid form fields. */
CustomWiggle.create('shake', { wiggles: 6, type: 'easeOut' });

gsap.defaults({ ease: 'power3.out', duration: 0.6 });

/** Characters used for ScrambleText effects. */
export const SCRAMBLE_BINARY = '01';
export const SCRAMBLE_HEX = '0123456789ABCDEF';
export const SCRAMBLE_TERM = '!<>-_\\/[]{}—=+*^?#01';

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export {
  gsap,
  ScrollTrigger,
  ScrollToPlugin,
  SplitText,
  ScrambleTextPlugin,
  TextPlugin,
  DrawSVGPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  Flip,
  Draggable,
  Observer,
  InertiaPlugin,
  CustomEase,
  CustomWiggle,
};
