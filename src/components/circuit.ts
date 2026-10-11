import { gsap, ScrollTrigger, prefersReducedMotion } from '../gsap';

const NS = 'http://www.w3.org/2000/svg';

/** Small seeded PRNG so the board layout is the same on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 1200;
const H = 720;
const GRID = 24;

/** PCB-style trace: horizontal run → 45° jog → horizontal run (or the vertical equivalent). */
function tracePath(rand: () => number): { d: string; end: [number, number]; start: [number, number] } {
  const snap = (v: number) => Math.round(v / GRID) * GRID;
  const horizontal = rand() > 0.3;
  if (horizontal) {
    const y = snap(rand() * H);
    const x0 = snap(rand() * W * 0.6) - GRID * 4;
    const run1 = snap(80 + rand() * 260);
    const jog = snap((rand() > 0.5 ? 1 : -1) * (GRID * 2 + rand() * 96));
    const run2 = snap(80 + rand() * 320);
    const x1 = x0 + run1;
    const x2 = x1 + Math.abs(jog);
    const x3 = x2 + run2;
    return { d: `M${x0},${y} H${x1} L${x2},${y + jog} H${x3}`, start: [x0, y], end: [x3, y + jog] };
  }
  const x = snap(rand() * W);
  const y0 = snap(rand() * H * 0.5) - GRID * 2;
  const run1 = snap(60 + rand() * 180);
  const jog = snap((rand() > 0.5 ? 1 : -1) * (GRID * 2 + rand() * 72));
  const run2 = snap(60 + rand() * 220);
  const y1 = y0 + run1;
  const y2 = y1 + Math.abs(jog);
  const y3 = y2 + run2;
  return { d: `M${x},${y0} V${y1} L${x + jog},${y2} V${y3}`, start: [x, y0], end: [x + jog, y3] };
}

/**
 * Animated circuit-board backdrop.
 *  - DrawSVG draws the copper traces in on load.
 *  - MotionPath sends "data packets" along random traces forever.
 *  - ScrollTrigger adds parallax and pauses the packets when off-screen.
 * Call `animate()` from inside a view's mount so everything is reverted on leave.
 */
export function createCircuit(seed = 7, traceCount = 26): { el: SVGSVGElement; animate: () => void } {
  const rand = mulberry32(seed);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('circuit');

  const traces = document.createElementNS(NS, 'g');
  traces.classList.add('circuit__traces');
  const vias = document.createElementNS(NS, 'g');
  vias.classList.add('circuit__vias');
  const packets = document.createElementNS(NS, 'g');
  packets.classList.add('circuit__packets');

  const paths: SVGPathElement[] = [];
  for (let i = 0; i < traceCount; i++) {
    const t = tracePath(rand);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', t.d);
    traces.appendChild(p);
    paths.push(p);
    for (const [cx, cy] of [t.start, t.end]) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(cx));
      c.setAttribute('cy', String(cy));
      c.setAttribute('r', '4.5');
      vias.appendChild(c);
    }
  }

  // A few IC "chips" for texture
  for (let i = 0; i < 4; i++) {
    const r = document.createElementNS(NS, 'rect');
    const w = 72 + Math.round(rand() * 60);
    r.setAttribute('x', String(Math.round(rand() * (W - w))));
    r.setAttribute('y', String(Math.round(rand() * (H - 60))));
    r.setAttribute('width', String(w));
    r.setAttribute('height', '44');
    r.setAttribute('rx', '4');
    r.classList.add('circuit__chip');
    traces.appendChild(r);
  }

  const packetEls: SVGCircleElement[] = [];
  for (let i = 0; i < 9; i++) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '3.5');
    c.setAttribute('cx', '0');
    c.setAttribute('cy', '0');
    packets.appendChild(c);
    packetEls.push(c);
  }

  svg.append(traces, vias, packets);

  const animate = () => {
    if (prefersReducedMotion()) {
      gsap.set(packets, { autoAlpha: 0 });
      return;
    }

    gsap.from(paths, { drawSVG: 0, duration: 1.8, ease: 'power2.inOut', stagger: { each: 0.05, from: 'random' } });
    gsap.from(vias.children, { scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: { each: 0.02, from: 'random' }, delay: 0.6 });

    const loop = gsap.timeline({ delay: 1.2 });
    packetEls.forEach((c, i) => {
      const path = paths[(i * 5 + 3) % paths.length];
      loop.to(c, {
        motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
        duration: 2.2 + rand() * 2.4,
        ease: 'none',
        repeat: -1,
        repeatDelay: rand() * 1.5,
        delay: rand() * 2,
      }, 0);
      loop.fromTo(c, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0);
    });

    ScrollTrigger.create({
      trigger: svg,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: self => { if (self.isActive) loop.resume(); else loop.pause(); },
    });
    gsap.to(svg, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: svg, start: 'top top', end: 'bottom top', scrub: true },
    });
  };

  return { el: svg, animate };
}
