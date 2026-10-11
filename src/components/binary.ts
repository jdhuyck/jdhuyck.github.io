import { gsap, Draggable, SCRAMBLE_HEX, prefersReducedMotion } from '../gsap';

const PLACES = [128, 64, 32, 16, 8, 4, 2, 1];

/**
 * Binary ⇄ denary ⇄ hex explorer.
 * Click a bit to flip it, or throw the slider (Draggable + Inertia, snapping
 * to whole numbers) to sweep through 0–255.
 */
export function createBinaryWidget(): { el: HTMLElement; animate: () => () => void } {
  const el = document.createElement('div');
  el.className = 'panel lab binary';
  el.innerHTML = `
    <div class="panel__bar"><span class="panel__dots"><i></i><i></i><i></i></span>binary.py</div>
    <div class="panel__body">
      <h3 class="lab__title">One byte, three ways</h3>
      <p class="lab__hint output--muted">Click the bits, or drag the slider. Each place value is double the one to its right.</p>
      <div class="binary__bits" role="group" aria-label="Bits">
        ${PLACES.map((p, i) => `
          <button class="binary__bit" type="button" data-i="${i}" aria-pressed="false" aria-label="${p}s bit">
            <span class="binary__face">0</span>
            <span class="binary__place">${p}</span>
          </button>`).join('')}
      </div>
      <div class="binary__track" data-track>
        <div class="binary__fill" data-fill></div>
        <div class="binary__knob" data-knob role="slider" tabindex="0"
             aria-label="Denary value" aria-valuemin="0" aria-valuemax="255" aria-valuenow="0"></div>
      </div>
      <dl class="binary__out">
        <div><dt>denary</dt><dd data-den>0</dd></div>
        <div><dt>binary</dt><dd data-bin>0000 0000</dd></div>
        <div><dt>hex</dt><dd data-hex>00</dd></div>
      </dl>
      <p class="binary__sum output--dim" data-sum>0 = 0</p>
    </div>
  `;

  const bits = [...el.querySelectorAll<HTMLButtonElement>('.binary__bit')];
  const track = el.querySelector<HTMLElement>('[data-track]')!;
  const knob = el.querySelector<HTMLElement>('[data-knob]')!;
  const fill = el.querySelector<HTMLElement>('[data-fill]')!;
  const denEl = el.querySelector<HTMLElement>('[data-den]')!;
  const binEl = el.querySelector<HTMLElement>('[data-bin]')!;
  const hexEl = el.querySelector<HTMLElement>('[data-hex]')!;
  const sumEl = el.querySelector<HTMLElement>('[data-sum]')!;

  let value = 0;

  const animate = () => {
    const reduced = prefersReducedMotion();
    const maxX = () => track.clientWidth - knob.offsetWidth;
    const stepPx = () => maxX() / 255;
    let lastHex = '00';

    const render = (v: number, { flip = true } = {}) => {
      const prev = value;
      value = v;
      bits.forEach((b, i) => {
        const on = (v & PLACES[i]) !== 0;
        const was = (prev & PLACES[i]) !== 0;
        b.setAttribute('aria-pressed', String(on));
        const face = b.querySelector<HTMLElement>('.binary__face')!;
        if (on === was && face.textContent === (on ? '1' : '0')) return;
        if (flip && !reduced) {
          gsap.timeline()
            .to(face, { rotationX: 90, duration: 0.12, ease: 'power1.in' })
            .set(face, { textContent: on ? '1' : '0' })
            .to(face, { rotationX: 0, duration: 0.25, ease: 'relay' });
        } else {
          face.textContent = on ? '1' : '0';
        }
      });

      const bin = v.toString(2).padStart(8, '0');
      const hex = v.toString(16).toUpperCase().padStart(2, '0');
      denEl.textContent = String(v);
      binEl.textContent = `${bin.slice(0, 4)} ${bin.slice(4)}`;
      if (hex !== lastHex) {
        lastHex = hex;
        if (reduced) hexEl.textContent = hex;
        else gsap.to(hexEl, { duration: 0.3, scrambleText: { text: hex, chars: SCRAMBLE_HEX, speed: 1 }, overwrite: true });
      }
      const parts = PLACES.filter(p => v & p);
      sumEl.textContent = parts.length ? `${parts.join(' + ')} = ${v}` : '0 = 0';
      knob.setAttribute('aria-valuenow', String(v));
      knob.setAttribute('aria-valuetext', `${v}, binary ${bin}, hex ${hex}`);
    };

    const placeKnob = (v: number, tween = true) => {
      const x = v * stepPx();
      if (tween && !reduced) {
        gsap.to(knob, { x, duration: 0.45, ease: 'relay', overwrite: true });
        gsap.to(fill, { width: x + knob.offsetWidth / 2, duration: 0.45, ease: 'relay', overwrite: true });
      } else {
        gsap.set(knob, { x });
        gsap.set(fill, { width: x + knob.offsetWidth / 2 });
      }
    };

    const fromKnob = function (this: Draggable) {
      const v = Math.round(gsap.utils.clamp(0, 255, this.x / stepPx()));
      gsap.set(fill, { width: this.x + knob.offsetWidth / 2 });
      if (v !== value) render(v, { flip: false });
    };

    const [drag] = Draggable.create(knob, {
      type: 'x',
      bounds: track,
      inertia: !reduced,
      edgeResistance: 0.85,
      snap: { x: (x: number) => Math.round(x / stepPx()) * stepPx() },
      onDrag: fromKnob,
      onThrowUpdate: fromKnob,
      onRelease: fromKnob,
    });

    bits.forEach((b, i) => b.addEventListener('click', () => {
      const v = value ^ PLACES[i];
      render(v);
      placeKnob(v);
    }));

    knob.addEventListener('keydown', (e) => {
      const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 16, PageDown: -16 }[e.key];
      let v: number | undefined;
      if (delta !== undefined) v = gsap.utils.clamp(0, 255, value + delta);
      else if (e.key === 'Home') v = 0;
      else if (e.key === 'End') v = 255;
      if (v === undefined) return;
      e.preventDefault();
      render(v);
      placeKnob(v, false);
    });

    const ro = new ResizeObserver(() => { drag.applyBounds(track); placeKnob(value, false); });
    ro.observe(track);

    // Start on a friendly number.
    render(42, { flip: false });
    placeKnob(42, false);

    return () => ro.disconnect();
  };

  return { el, animate };
}
