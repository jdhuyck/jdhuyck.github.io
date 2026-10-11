import { gsap, ScrollTrigger, SCRAMBLE_BINARY, prefersReducedMotion } from '../gsap';

/**
 * A scroll-driven walkthrough of the fetch–decode–execute cycle running a
 * three-instruction program (LDA 5 / ADD 6 / STA 7) on a simple Von Neumann
 * machine. Scrolling scrubs a single GSAP timeline; ScrollTrigger pins the
 * diagram and snaps to the end of each step. Values move between registers
 * as "chips" (MotionPath) while the bus they travel on lights up (DrawSVG).
 */

const NS = 'http://www.w3.org/2000/svg';

type Phase = 'intro' | 'fetch' | 'decode' | 'execute' | 'repeat';
interface Step { phase: Phase; text: string; start: number; end: number }

// ── Geometry (SVG user units, viewBox 0 0 800 440) ───────
const REG = { w: 140, h: 56 };
const regs = {
  pc:  { x: 210, y: 50,  label: 'PC',  title: 'Program Counter' },
  mar: { x: 380, y: 50,  label: 'MAR', title: 'Memory Address Register' },
  cir: { x: 210, y: 170, label: 'CIR', title: 'Current Instruction Register' },
  mdr: { x: 380, y: 170, label: 'MDR', title: 'Memory Data Register' },
  acc: { x: 30,  y: 290, label: 'ACC', title: 'Accumulator' },
} as const;
type RegId = keyof typeof regs;
const centre = (id: RegId): [number, number] => [regs[id].x + REG.w / 2, regs[id].y + REG.h / 2 + 6];

const CU  = { x: 30, y: 50,  w: 150, h: 90 };
const ALU = { x: 30, y: 170, w: 150, h: 90 };
const RAM = { x: 600, y: 20, w: 190, rowTop: 56, rowH: 44 };
const rowY = (n: number) => RAM.rowTop + n * RAM.rowH + RAM.rowH / 2;
const RAM_CELL_X = 715;
const ADDR_BUS_X = 560;
const DATA_BUS_X = 575;

const PROGRAM: string[] = ['LDA 5', 'ADD 6', 'STA 7', 'HLT', '0', '3', '4', '0'];

const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, text?: string) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
};

function buildDiagram() {
  const svg = el('svg', { viewBox: '0 0 800 440', class: 'cpu__svg', role: 'img', 'aria-labelledby': 'cpu-title' });
  svg.appendChild(el('title', { id: 'cpu-title' }, 'Diagram of a CPU connected to RAM by an address bus and a data bus'));

  // CPU frame
  svg.appendChild(el('rect', { x: 10, y: 10, width: 530, height: 420, rx: 14, class: 'cpu__frame' }));
  svg.appendChild(el('text', { x: 28, y: 36, class: 'cpu__frame-label' }, 'CPU'));

  // Buses (static)
  const buses = el('g', { class: 'cpu__buses' });
  buses.appendChild(el('path', { d: `M520,${rowY(0)} H${ADDR_BUS_X} V${rowY(7)}`, class: 'cpu__bus cpu__bus--addr' }));
  buses.appendChild(el('path', { d: `M520,198 H${DATA_BUS_X} M${DATA_BUS_X},${rowY(0)} V${rowY(7)}`, class: 'cpu__bus cpu__bus--data' }));
  for (let n = 0; n < 8; n++) {
    buses.appendChild(el('path', { d: `M${ADDR_BUS_X},${rowY(n)} H${RAM.x}`, class: 'cpu__bus-stub' }));
  }
  buses.appendChild(el('text', { x: 548, y: 262, class: 'cpu__bus-label', transform: 'rotate(-90 548 262)' }, 'address bus'));
  buses.appendChild(el('text', { x: 590, y: 262, class: 'cpu__bus-label', transform: 'rotate(-90 590 262)' }, 'data bus'));
  svg.appendChild(buses);

  // Units
  const unit = (b: typeof CU, label: string, cls: string) => {
    const g = el('g', { class: `cpu__unit ${cls}` });
    g.appendChild(el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 8, class: 'cpu__box' }));
    g.appendChild(el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 8, class: 'cpu__hl' }));
    g.appendChild(el('text', { x: b.x + 12, y: b.y + 22, class: 'cpu__label' }, label));
    const value = el('text', { x: b.x + b.w / 2, y: b.y + b.h / 2 + 18, class: 'cpu__value cpu__value--sm', 'text-anchor': 'middle' }, '—');
    g.appendChild(value);
    svg.appendChild(g);
    return { g, hl: g.querySelector('.cpu__hl')!, value };
  };
  const cu = unit(CU, 'Control Unit', 'cpu__unit--cu');
  const alu = unit(ALU, 'ALU', 'cpu__unit--alu');

  // Registers
  const regEls = {} as Record<RegId, { hl: SVGRectElement; value: SVGTextElement }>;
  (Object.keys(regs) as RegId[]).forEach(id => {
    const r = regs[id];
    const g = el('g', { class: `cpu__reg cpu__reg--${id}` });
    g.appendChild(el('title', {}, r.title));
    g.appendChild(el('rect', { x: r.x, y: r.y, width: REG.w, height: REG.h, rx: 6, class: 'cpu__box' }));
    const hl = el('rect', { x: r.x, y: r.y, width: REG.w, height: REG.h, rx: 6, class: 'cpu__hl' });
    g.appendChild(hl);
    g.appendChild(el('text', { x: r.x + 10, y: r.y + 18, class: 'cpu__label' }, r.label));
    const value = el('text', { x: r.x + REG.w / 2, y: r.y + 44, class: 'cpu__value', 'text-anchor': 'middle' }, id === 'pc' ? '0' : '—');
    g.appendChild(value);
    svg.appendChild(g);
    regEls[id] = { hl, value };
  });

  // RAM
  const ram = el('g', { class: 'cpu__ram' });
  ram.appendChild(el('rect', { x: RAM.x, y: RAM.y, width: RAM.w, height: RAM.rowTop - RAM.y + RAM.rowH * 8 + 8, rx: 10, class: 'cpu__box' }));
  ram.appendChild(el('text', { x: RAM.x + 12, y: RAM.y + 24, class: 'cpu__label' }, 'RAM'));
  ram.appendChild(el('text', { x: RAM.x + 60, y: RAM.y + 24, class: 'cpu__label cpu__label--dim' }, 'addr · contents'));
  const rows: { hl: SVGRectElement; value: SVGTextElement }[] = [];
  PROGRAM.forEach((v, n) => {
    const y = RAM.rowTop + n * RAM.rowH;
    const hl = el('rect', { x: RAM.x + 6, y: y + 3, width: RAM.w - 12, height: RAM.rowH - 6, rx: 4, class: 'cpu__hl' });
    ram.appendChild(el('rect', { x: RAM.x + 6, y: y + 3, width: RAM.w - 12, height: RAM.rowH - 6, rx: 4, class: 'cpu__cell' }));
    ram.appendChild(hl);
    ram.appendChild(el('text', { x: RAM.x + 26, y: y + 29, class: 'cpu__addr', 'text-anchor': 'middle' }, String(n)));
    const value = el('text', { x: RAM_CELL_X, y: y + 29, class: 'cpu__value cpu__value--sm', 'text-anchor': 'middle' }, v);
    ram.appendChild(value);
    rows.push({ hl, value });
  });
  svg.appendChild(ram);

  const signals = el('g', { class: 'cpu__signals' });
  svg.appendChild(signals);

  // The moving value "chip", centred on its own origin so MotionPath moves its centre.
  const chip = el('g', { class: 'cpu__chip' });
  chip.appendChild(el('rect', { x: -38, y: -15, width: 76, height: 30, rx: 6 }));
  const chipText = el('text', { x: 0, y: 6, 'text-anchor': 'middle' }, '');
  chip.appendChild(chipText);
  svg.appendChild(chip);

  return { svg, cu, alu, regEls, rows, signals, chip, chipText };
}

export function createCpuSection(): { el: HTMLElement; animate: () => void } {
  const section = document.createElement('section');
  section.className = 'cpu';
  section.id = 'cpu';
  section.setAttribute('aria-labelledby', 'cpu-heading');
  section.innerHTML = `
    <div class="cpu__pin">
      <div class="container cpu__layout">
        <header class="cpu__head">
          <span class="eyebrow">inside the machine</span>
          <h2 class="section-title" id="cpu-heading">The fetch–decode–execute cycle</h2>
        </header>
        <div class="cpu__stage panel">
          <div class="panel__bar"><span class="panel__dots"><i></i><i></i><i></i></span>von-neumann.sim</div>
          <div class="cpu__diagram" data-diagram></div>
        </div>
        <div class="cpu__caption" aria-live="polite">
          <div class="cpu__meta">
            <span class="cpu__phase" data-phase>READY</span>
            <span class="cpu__count output--dim" data-count></span>
          </div>
          <p class="cpu__text" data-text></p>
          <div class="cpu__controls">
            <button class="ibtn" type="button" data-prev aria-label="Previous step">◀ prev</button>
            <button class="ibtn" type="button" data-next aria-label="Next step">next ▶</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const d = buildDiagram();
  section.querySelector('[data-diagram]')!.appendChild(d.svg);

  const phaseEl = section.querySelector<HTMLElement>('[data-phase]')!;
  const countEl = section.querySelector<HTMLElement>('[data-count]')!;
  const textEl = section.querySelector<HTMLElement>('[data-text]')!;
  const prevBtn = section.querySelector<HTMLButtonElement>('[data-prev]')!;
  const nextBtn = section.querySelector<HTMLButtonElement>('[data-next]')!;

  const INTRO = 'Scroll (or press next) to step a CPU through a tiny program: load 3, add 4, store the result.';

  const animate = () => {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    const steps: Step[] = [];
    const reduced = prefersReducedMotion();

    gsap.set(d.chip, { autoAlpha: 0 });

    // ── Timeline builders ─────────────────────────────
    const step = (phase: Phase, text: string, build: () => void) => {
      tl.to({}, { duration: 0.3 }); // breathing room between steps
      const start = tl.duration();
      tl.addLabel(`s${steps.length}`, start);
      build();
      steps.push({ phase, text, start, end: tl.duration() });
    };

    const flash = (hl: Element, at = '<') => {
      tl.to(hl, { opacity: 1, duration: 0.15 }, at).to(hl, { opacity: 0, duration: 0.6 });
    };

    const setText = (target: Element, text: string, at: string | number = '>') => {
      tl.to(target, { duration: 0.45, scrambleText: { text, chars: SCRAMBLE_BINARY, speed: 0.6 } }, at);
    };

    const transfer = (label: string, path: string) => {
      const sig = el('path', { d: path, class: 'cpu__signal' });
      d.signals.appendChild(sig);
      gsap.set(sig, { drawSVG: '0% 0%' });
      tl.set(d.chipText, { text: label })
        .set(d.chip, { autoAlpha: 1 })
        .to(sig, { drawSVG: '0% 100%', duration: 0.9 }, '<')
        .to(d.chip, { motionPath: { path }, duration: 0.9 }, '<')
        .to(sig, { drawSVG: '100% 100%', duration: 0.35 })
        .set(d.chip, { autoAlpha: 0 }, '<');
    };

    const reg = (id: RegId, value: string) => {
      setText(d.regEls[id].value, value);
      flash(d.regEls[id].hl);
    };

    const [pcX, pcY] = centre('pc');
    const [marX, marY] = centre('mar');
    const [cirX, cirY] = centre('cir');
    const [mdrX, mdrY] = centre('mdr');
    const [accX, accY] = centre('acc');
    const cuC = [CU.x + CU.w / 2, CU.y + CU.h / 2 + 6];
    const aluC = [ALU.x + ALU.w / 2, ALU.y + ALU.h / 2 + 6];

    const P = {
      pcToMar: `M${pcX},${pcY} L${marX},${marY}`,
      marToRam: (n: number) => `M${marX},${marY} H${ADDR_BUS_X} V${rowY(n)} H${RAM_CELL_X}`,
      ramToMdr: (n: number) => `M${RAM_CELL_X},${rowY(n)} H${DATA_BUS_X} V${mdrY} H${mdrX}`,
      mdrToRam: (n: number) => `M${mdrX},${mdrY} H${DATA_BUS_X} V${rowY(n)} H${RAM_CELL_X}`,
      mdrToCir: `M${mdrX},${mdrY} L${cirX},${cirY}`,
      cirToCu: `M${cirX},${cirY} C${cirX - 70},${cirY} ${cuC[0] + 60},${cuC[1]} ${cuC[0]},${cuC[1]}`,
      cirToMar: `M${cirX},${cirY} C${cirX + 80},${cirY} ${marX - 80},${marY} ${marX},${marY}`,
      mdrToAcc: `M${mdrX},${mdrY} C${mdrX},${accY} ${accX + 160},${accY} ${accX},${accY}`,
      mdrToAlu: `M${mdrX},${mdrY} C${mdrX - 60},${mdrY + 70} ${aluC[0] + 120},${aluC[1]} ${aluC[0]},${aluC[1]}`,
      accToAlu: `M${accX - 30},${accY} L${aluC[0] - 30},${aluC[1]}`,
      aluToAcc: `M${aluC[0] + 30},${aluC[1]} L${accX + 30},${accY}`,
      accToMdr: `M${accX},${accY} C${accX + 200},${accY} ${mdrX},${accY} ${mdrX},${mdrY}`,
    };

    const ram = [...PROGRAM];
    let pc = 0;

    const fetch = () => {
      const addr = pc;
      const instr = ram[addr];
      step('fetch', `The address held in the Program Counter (PC), ${addr}, is copied into the Memory Address Register (MAR).`, () => {
        flash(d.regEls.pc.hl, '>');
        transfer(String(addr), P.pcToMar);
        reg('mar', String(addr));
      });
      pc += 1;
      step('fetch', `The PC is incremented to ${pc}, so it already points at the next instruction.`, () => {
        reg('pc', String(pc));
      });
      step('fetch', `The MAR puts address ${addr} on the address bus, selecting that location in RAM.`, () => {
        transfer(String(addr), P.marToRam(addr));
        flash(d.rows[addr].hl);
      });
      step('fetch', `The instruction stored there, “${instr}”, travels back along the data bus into the Memory Data Register (MDR).`, () => {
        transfer(instr, P.ramToMdr(addr));
        reg('mdr', instr);
      });
      step('fetch', 'The instruction is copied from the MDR into the Current Instruction Register (CIR).', () => {
        transfer(instr, P.mdrToCir);
        reg('cir', instr);
      });
      return instr;
    };

    const decode = (instr: string, meaning: string, cuText: string) => {
      step('decode', `The Control Unit decodes the CIR. “${instr}” means ${meaning}`, () => {
        transfer(instr, P.cirToCu);
        setText(d.cu.value, cuText);
        flash(d.cu.hl);
      });
    };

    const operandToMar = (n: number) => {
      step('execute', `The operand, address ${n}, is copied from the CIR into the MAR.`, () => {
        transfer(String(n), P.cirToMar);
        reg('mar', String(n));
      });
    };

    const readIntoMdr = (n: number) => {
      step('execute', `Address ${n} goes out on the address bus and its contents, ${ram[n]}, come back on the data bus into the MDR.`, () => {
        transfer(String(n), P.marToRam(n));
        flash(d.rows[n].hl);
        transfer(ram[n], P.ramToMdr(n));
        reg('mdr', ram[n]);
      });
    };

    // ── Program ───────────────────────────────────────
    let acc = 0;

    // LDA 5
    let instr = fetch();
    decode(instr, '“load the value stored at address 5 into the accumulator”.', 'LOAD');
    operandToMar(5);
    readIntoMdr(5);
    acc = Number(ram[5]);
    step('execute', `The value moves from the MDR into the Accumulator (ACC). ACC = ${acc}.`, () => {
      transfer(ram[5], P.mdrToAcc);
      reg('acc', String(acc));
    });

    // ADD 6
    instr = fetch();
    decode(instr, '“add the value stored at address 6 to the accumulator”.', 'ADD');
    operandToMar(6);
    readIntoMdr(6);
    const sum = acc + Number(ram[6]);
    step('execute', `The Arithmetic Logic Unit (ALU) adds the MDR to the ACC: ${acc} + ${ram[6]}.`, () => {
      transfer(ram[6], P.mdrToAlu);
      transfer(String(acc), P.accToAlu);
      setText(d.alu.value, `${acc} + ${ram[6]}`);
      flash(d.alu.hl);
    });
    acc = sum;
    step('execute', `The ALU's result is written back into the ACC. ACC = ${acc}.`, () => {
      transfer(String(acc), P.aluToAcc);
      reg('acc', String(acc));
      setText(d.alu.value, '—');
    });

    // STA 7
    instr = fetch();
    decode(instr, '“store the accumulator in RAM at address 7”.', 'STORE');
    operandToMar(7);
    step('execute', `The value in the ACC, ${acc}, is copied into the MDR ready to be written.`, () => {
      transfer(String(acc), P.accToMdr);
      reg('mdr', String(acc));
    });
    ram[7] = String(acc);
    step('execute', `The MDR is written along the data bus to the address in the MAR. RAM[7] now holds ${acc}.`, () => {
      transfer(String(acc), P.mdrToRam(7));
      setText(d.rows[7].value, String(acc));
      flash(d.rows[7].hl);
    });

    step('repeat', 'Then it all repeats: fetch, decode, execute. A modern CPU does this billions of times every second.', () => {
      const all = d.svg.querySelectorAll('.cpu__unit .cpu__hl, .cpu__reg .cpu__hl');
      tl.to(all, { opacity: 1, duration: 0.3, stagger: 0.05 })
        .to(all, { opacity: 0, duration: 0.6, stagger: 0.05 });
    });

    // ── Caption sync ──────────────────────────────────
    let shown = -2;
    const showStep = (i: number) => {
      if (i === shown) return;
      shown = i;
      const s = steps[i];
      phaseEl.textContent = s ? s.phase.toUpperCase() : 'READY';
      phaseEl.dataset.phase = s ? s.phase : 'intro';
      countEl.textContent = s ? `step ${String(i + 1).padStart(2, '0')} / ${steps.length}` : `${steps.length} steps`;
      textEl.textContent = s ? s.text : INTRO;
      prevBtn.disabled = i < 0;
      nextBtn.disabled = i >= steps.length - 1;
      if (!reduced) gsap.fromTo(textEl, { autoAlpha: 0.2, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.3, overwrite: true });
    };
    const stepAt = (time: number) => {
      let idx = -1;
      steps.forEach((s, i) => { if (time >= s.start - 0.01) idx = i; });
      return idx;
    };
    showStep(-1);

    // ── Drive: scroll (default) or buttons only (reduced motion) ──
    let st: ScrollTrigger | null = null;
    if (!reduced) {
      const dur = tl.duration();
      st = ScrollTrigger.create({
        trigger: section,
        pin: section.querySelector('.cpu__pin'),
        start: () => `top top+=${document.querySelector<HTMLElement>('.nav')?.offsetHeight ?? 0}`,
        end: () => `+=${steps.length * 110}`,
        scrub: 0.6,
        animation: tl,
        invalidateOnRefresh: true,
        snap: {
          snapTo: [0, ...steps.map(s => s.end / dur)],
          duration: { min: 0.15, max: 0.5 },
          delay: 0.08,
          ease: 'power1.inOut',
          inertia: false, // settle on the nearest step; never skip ahead on a fast flick
        },
        onUpdate: () => showStep(stepAt(tl.time())),
      });
    }

    const goTo = (i: number) => {
      const target = i < 0 ? 0 : steps[i].end;
      if (st) {
        const scroll = st.start + (st.end - st.start) * (target / tl.duration());
        gsap.to(window, { scrollTo: scroll, duration: 0.7, ease: 'power2.inOut' });
      } else {
        tl.seek(target, false);
        showStep(i);
      }
    };
    prevBtn.addEventListener('click', () => goTo(Math.max(-1, shown - 1)));
    nextBtn.addEventListener('click', () => goTo(Math.min(steps.length - 1, shown + 1)));
  };

  return { el: section, animate };
}
