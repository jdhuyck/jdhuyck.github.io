import { gsap, prefersReducedMotion } from '../gsap';

const NS = 'http://www.w3.org/2000/svg';

/**
 * Decorative palette for blobs: Okabe & Ito plus Paul Tol's vibrant and
 * muted schemes. Blobs never carry text, so these don't need text contrast;
 * they sit in their own band at the top of each tile.
 */
export const BLOB_PALETTE = [
  // Okabe–Ito
  '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7',
  // Tol vibrant
  '#EE7733', '#0077BB', '#33BBEE', '#EE3377', '#CC3311', '#009988',
  // Tol muted
  '#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255', '#AA4499',
];

/** A fresh shuffle of the palette, so every visit gets a different colour order. */
export function shuffledPalette(): string[] {
  const p = [...BLOB_PALETTE];
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}

interface Pt { x: number; y: number; ax: number; ay: number }

const W = 240;
const H = 150;

/** Irregular polygon: n vertices at jittered angles and radii around a centre. */
function polygon(n: number, cx: number, cy: number, rx: number, ry: number): Pt[] {
  const offset = Math.random() * Math.PI * 2;
  return Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * Math.PI * 2 + (Math.random() - 0.5) * (Math.PI / n);
    const r = 0.62 + Math.random() * 0.38;
    const x = cx + Math.cos(a) * rx * r;
    const y = cy + Math.sin(a) * ry * r;
    return { x, y, ax: x, ay: y };
  });
}

const toPoints = (pts: Pt[]) => pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

export interface Blob {
  el: SVGSVGElement;
  /** Layers for scroll-linked parallax. Move `nodes` with `front`: they mark its vertices. */
  layers: { back: SVGGElement; front: SVGGElement; nodes: SVGGElement };
  /** Start the idle drift. Call inside a gsap.context so it is reverted on leave. */
  animate: () => void;
  /** Pause/resume the drift, e.g. while offscreen. */
  setActive: (on: boolean) => void;
}

/**
 * A low-poly "network" blob: two overlapping random polygons in two palette
 * colours, with a node at every vertex of the front shape, like a graph.
 * The vertices drift slowly so the shape breathes.
 */
export function createBlob(colors: [string, string]): Blob {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('blob');

  const backPts = polygon(5 + Math.floor(Math.random() * 4), W * 0.56, H * 0.52, W * 0.34, H * 0.42);
  const frontPts = polygon(6 + Math.floor(Math.random() * 4), W * 0.44, H * 0.5, W * 0.3, H * 0.38);

  const g = (cls: string) => {
    const el = document.createElementNS(NS, 'g');
    el.classList.add(cls);
    svg.appendChild(el);
    return el;
  };
  const back = g('blob__back');
  const front = g('blob__front');
  const nodes = g('blob__nodes');

  const backPoly = document.createElementNS(NS, 'polygon');
  backPoly.setAttribute('fill', colors[1]);
  back.appendChild(backPoly);

  const frontPoly = document.createElementNS(NS, 'polygon');
  frontPoly.setAttribute('fill', colors[0]);
  front.appendChild(frontPoly);

  // Spokes from a hub to each vertex, then the vertex nodes
  const hub = { x: W * 0.44, y: H * 0.5 };
  const spokes = frontPts.map(() => {
    const l = document.createElementNS(NS, 'line');
    l.classList.add('blob__spoke');
    nodes.appendChild(l);
    return l;
  });
  const dots = frontPts.map(() => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '3.2');
    c.classList.add('blob__node');
    nodes.appendChild(c);
    return c;
  });

  const draw = () => {
    backPoly.setAttribute('points', toPoints(backPts));
    frontPoly.setAttribute('points', toPoints(frontPts));
    frontPts.forEach((p, i) => {
      dots[i].setAttribute('cx', p.x.toFixed(1));
      dots[i].setAttribute('cy', p.y.toFixed(1));
      spokes[i].setAttribute('x1', hub.x.toFixed(1));
      spokes[i].setAttribute('y1', hub.y.toFixed(1));
      spokes[i].setAttribute('x2', p.x.toFixed(1));
      spokes[i].setAttribute('y2', p.y.toFixed(1));
    });
  };
  draw();

  let drift: gsap.core.Timeline | null = null;

  const animate = () => {
    if (prefersReducedMotion()) return;
    drift = gsap.timeline({ onUpdate: draw });
    for (const p of [...backPts, ...frontPts]) {
      drift.to(p, {
        x: p.ax + gsap.utils.random(-14, 14),
        y: p.ay + gsap.utils.random(-10, 10),
        duration: gsap.utils.random(2.4, 4.2),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      }, gsap.utils.random(0, 1.5));
    }
    drift.to(hub, { x: hub.x + 8, y: hub.y - 6, duration: 3.1, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0);
    // Pop in: polygons grow from their centres, nodes follow.
    gsap.from([back, front, nodes], { scale: 0.2, transformOrigin: '50% 50%', duration: 0.9, ease: 'relay', stagger: 0.08 });
    gsap.from(dots, { scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.04, delay: 0.3 });
  };

  return {
    el: svg,
    layers: { back, front, nodes },
    animate,
    setActive: (on) => { if (drift) drift.paused(!on); },
  };
}
