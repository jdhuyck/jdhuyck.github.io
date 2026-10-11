import { gsap, SCRAMBLE_BINARY, prefersReducedMotion } from '../gsap';

type GateId = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR';

interface Gate {
  id: GateId;
  body: 'and' | 'or' | 'not';
  invert: boolean;
  xor?: boolean;
  unary?: boolean;
  expr: string;
  fn: (a: boolean, b: boolean) => boolean;
}

const GATES: Gate[] = [
  { id: 'AND',  body: 'and', invert: false, expr: 'Q = A AND B',       fn: (a, b) => a && b },
  { id: 'OR',   body: 'or',  invert: false, expr: 'Q = A OR B',        fn: (a, b) => a || b },
  { id: 'NOT',  body: 'not', invert: true,  expr: 'Q = NOT A', unary: true, fn: (a) => !a },
  { id: 'NAND', body: 'and', invert: true,  expr: 'Q = NOT (A AND B)', fn: (a, b) => !(a && b) },
  { id: 'NOR',  body: 'or',  invert: true,  expr: 'Q = NOT (A OR B)',  fn: (a, b) => !(a || b) },
  { id: 'XOR',  body: 'or',  invert: false, expr: 'Q = A XOR B', xor: true, fn: (a, b) => a !== b },
];

// Gate bodies as paths so MorphSVG can tween between them.
const SHAPES = {
  and: 'M110,40 H160 A50,50 0 0 1 160,140 H110 Z',
  or:  'M104,40 Q136,90 104,140 Q176,140 214,90 Q176,40 104,40 Z',
  not: 'M112,46 L198,90 L112,134 Z',
};
const OUT_X = { and: 210, or: 214, not: 198 };

const ROWS: [boolean, boolean][] = [[false, false], [false, true], [true, false], [true, true]];
const bit = (b: boolean) => (b ? '1' : '0');

/** Interactive logic gate with a live truth table. */
export function createGatesWidget(): { el: HTMLElement; animate: () => void } {
  const el = document.createElement('div');
  el.className = 'panel lab gates';
  el.innerHTML = `
    <div class="panel__bar"><span class="panel__dots"><i></i><i></i><i></i></span>logic.circ</div>
    <div class="panel__body">
      <h3 class="lab__title">Logic gates</h3>
      <p class="lab__hint output--muted">Pick a gate, then switch the inputs on and off.</p>
      <div class="gates__picker" role="group" aria-label="Gate">
        ${GATES.map(g => `<button class="chip" type="button" data-gate="${g.id}" aria-pressed="${g.id === 'AND'}">${g.id}</button>`).join('')}
      </div>
      <div class="gates__grid">
        <div class="gates__circuit">
          <svg viewBox="0 0 320 180" class="gates__svg" role="img" aria-label="Logic gate diagram">
            <g class="gates__wires">
              <path class="gates__wire" data-wire="a" d="M40,60 H122" />
              <path class="gates__wire" data-wire="b" d="M40,120 H122" />
              <path class="gates__wire" data-wire="q" d="M210,90 H282" />
            </g>
            <g class="gates__pulses">
              <path class="gates__pulse" data-pulse="a" d="M40,60 H122" />
              <path class="gates__pulse" data-pulse="b" d="M40,120 H122" />
              <path class="gates__pulse" data-pulse="q" d="M210,90 H282" />
            </g>
            <path class="gates__xor" d="M94,40 Q126,90 94,140" />
            <path class="gates__body" d="${SHAPES.and}" />
            <circle class="gates__bubble" cx="0" cy="90" r="8" />
            <text class="gates__name" x="150" y="96" text-anchor="middle">AND</text>
            <circle class="gates__led" cx="292" cy="90" r="11" />
            <text class="gates__io" x="20" y="65">A</text>
            <text class="gates__io" x="20" y="125" data-io-b>B</text>
            <text class="gates__io" x="286" y="122">Q</text>
          </svg>
          <div class="gates__inputs">
            <button class="gates__switch" type="button" data-in="a" aria-pressed="false">A = <b>0</b></button>
            <button class="gates__switch" type="button" data-in="b" aria-pressed="false">B = <b>0</b></button>
          </div>
        </div>
        <div class="gates__table-wrap">
          <p class="gates__expr" data-expr>Q = A AND B</p>
          <table class="gates__table">
            <thead><tr><th scope="col">A</th><th scope="col" data-col-b>B</th><th scope="col">Q</th></tr></thead>
            <tbody>
              ${ROWS.map(([a, b], i) => `<tr data-row="${i}"><td>${bit(a)}</td><td data-col-b>${bit(b)}</td><td data-q>0</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const animate = () => {
    const reduced = prefersReducedMotion();
    const q = <T extends Element>(s: string) => el.querySelector<T>(s)!;
    const body = q<SVGPathElement>('.gates__body');
    const bubble = q<SVGCircleElement>('.gates__bubble');
    const xorArc = q<SVGPathElement>('.gates__xor');
    const name = q<SVGTextElement>('.gates__name');
    const led = q<SVGCircleElement>('.gates__led');
    const wireQ = q<SVGPathElement>('[data-wire="q"]');
    const pulseQ = q<SVGPathElement>('[data-pulse="q"]');
    const exprEl = q<HTMLElement>('[data-expr]');
    const bOnly = el.querySelectorAll<SVGElement | HTMLElement>('[data-wire="b"], [data-pulse="b"], [data-io-b], [data-in="b"], [data-col-b]');
    const rows = [...el.querySelectorAll<HTMLTableRowElement>('tbody tr')];

    let gate = GATES[0];
    const input = { a: false, b: false };

    gsap.set('.gates__pulse', { drawSVG: '0% 0%' });
    gsap.set(xorArc, { autoAlpha: 0 });
    gsap.set(bubble, { scale: 0, transformOrigin: '50% 50%' });

    const pulse = (id: 'a' | 'b' | 'q') => {
      if (reduced) return;
      gsap.fromTo(`[data-pulse="${id}"]`, { drawSVG: '0% 0%' }, {
        keyframes: [{ drawSVG: '0% 100%', duration: 0.25 }, { drawSVG: '100% 100%', duration: 0.2 }],
        ease: 'power1.inOut',
        overwrite: true,
      });
    };

    const output = () => gate.fn(input.a, gate.unary ? false : input.b);

    const sync = ({ animateOut = true } = {}) => {
      const out = output();
      (['a', 'b'] as const).forEach(k => {
        el.querySelector(`[data-wire="${k}"]`)!.classList.toggle('is-on', input[k]);
        const sw = el.querySelector<HTMLButtonElement>(`[data-in="${k}"]`)!;
        sw.setAttribute('aria-pressed', String(input[k]));
        sw.querySelector('b')!.textContent = bit(input[k]);
      });
      const wasOn = led.classList.contains('is-on');
      wireQ.classList.toggle('is-on', out);
      led.classList.toggle('is-on', out);
      if (animateOut && out !== wasOn && !reduced) {
        pulse('q');
        gsap.fromTo(led, { scale: out ? 0.6 : 1.15 }, { scale: 1, transformOrigin: '50% 50%', duration: 0.4, ease: 'relay' });
      }
      const current = gate.unary ? (input.a ? 2 : 0) : ROWS.findIndex(([a, b]) => a === input.a && b === input.b);
      rows.forEach((r, i) => r.classList.toggle('is-current', gate.unary ? i === current || i === current + 1 : i === current));
    };

    const setGate = (next: Gate) => {
      gate = next;
      el.querySelectorAll<HTMLButtonElement>('[data-gate]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.gate === next.id)));
      const dur = reduced ? 0 : 0.35;
      const outX = OUT_X[next.body];
      const bubbleX = outX + 8;
      const wireStart = next.invert ? bubbleX + 8 : outX;

      gsap.to(body, { morphSVG: SHAPES[next.body], duration: dur, ease: 'power3.inOut' });
      gsap.to(bubble, { attr: { cx: bubbleX }, scale: next.invert ? 1 : 0, duration: dur * 0.6, ease: 'relay' });
      gsap.to(xorArc, { autoAlpha: next.xor ? 1 : 0, x: next.xor ? 0 : -10, duration: dur * 0.6 });
      gsap.to([wireQ, pulseQ], { attr: { d: `M${wireStart},90 H282` }, duration: dur });
      gsap.to(name, { attr: { x: next.body === 'not' ? 140 : 150 }, duration: dur });
      gsap.to(bOnly, { autoAlpha: next.unary ? 0.15 : 1, duration: dur * 0.5 });
      el.querySelectorAll<HTMLButtonElement>('[data-in="b"]').forEach(b => { b.disabled = !!next.unary; });

      const setText = (target: Element, text: string) => {
        if (reduced) target.textContent = text;
        else gsap.to(target, { duration: 0.2, scrambleText: { text, chars: SCRAMBLE_BINARY, speed: 2 }, overwrite: true });
      };
      setText(name, next.id);
      setText(exprEl, next.expr);
      rows.forEach((r, i) => {
        const [a, b] = ROWS[i];
        setText(r.querySelector('[data-q]')!, bit(next.fn(a, next.unary ? false : b)));
      });
      sync({ animateOut: false });
    };

    el.querySelectorAll<HTMLButtonElement>('[data-gate]').forEach(b => {
      b.addEventListener('click', () => setGate(GATES.find(g => g.id === b.dataset.gate)!));
    });
    el.querySelectorAll<HTMLButtonElement>('[data-in]').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.dataset.in as 'a' | 'b';
        input[k] = !input[k];
        if (input[k]) pulse(k);
        sync();
      });
    });

    setGate(gate);
  };

  return { el, animate };
}
