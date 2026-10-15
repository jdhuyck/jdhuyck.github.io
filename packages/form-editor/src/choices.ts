/**
 * Multiselect fields: any number (including none) of numbered options, e.g.
 * the learning outcomes a lesson stage relates to. Stored as "1,3".
 * Each number also has a colour, used by the lesson timeline and the stage
 * bars beside the plan, on screen and in the timeline PDF.
 */

/** Colour-blind-safe palette (Okabe–Ito), by option number (1 → first). */
export const CHOICE_COLOURS = ['#56b4e9', '#009e73', '#e69f00', '#cc79a7', '#0072b2', '#d55e00', '#f0e442'] as const;
/** Colour for "none chosen". */
export const NO_CHOICE_COLOUR = '#9a9a96';

export const colourOf = (n: number): string => CHOICE_COLOURS[(n - 1) % CHOICE_COLOURS.length];

/** Chosen numbers, ascending. Older free-text values ("LO 1 & 2") keep their numbers. */
export function parseChoices(value: string | undefined): number[] {
  const nums = (value ?? '').match(/\d+/g)?.map(Number).filter(n => n > 0) ?? [];
  return [...new Set(nums)].sort((a, b) => a - b);
}

const REFRESH = 'choices:refresh';

/** Redraw every choices editor under `root`, e.g. after outcomes are added, removed or renamed. */
export function refreshChoices(root: ParentNode): void {
  root.querySelectorAll('.ch').forEach(e => e.dispatchEvent(new Event(REFRESH)));
}

export const serializeChoices = (nums: number[]): string => nums.join(',');

/** "1, 3" for print (or the old free text if it had no numbers). */
export function formatChoices(value: string | undefined): string {
  const nums = parseChoices(value);
  return nums.length ? nums.join(', ') : (value ?? '').trim();
}

/**
 * CSS background image for a set of choices: one colour, equal stacked bands
 * for several (top to bottom, in order), or grey for none. Always an image
 * (never a bare colour), so it can be layered over other backgrounds.
 */
export function choicesFill(nums: number[], direction = 'to bottom'): string {
  if (nums.length <= 1) { const c = nums.length ? colourOf(nums[0]) : NO_CHOICE_COLOUR; return `linear-gradient(${c}, ${c})`; }
  const step = 100 / nums.length;
  return `linear-gradient(${direction}, ${nums.map((n, i) => `${colourOf(n)} ${i * step}% ${(i + 1) * step}%`).join(', ')})`;
}

/**
 * How a block with several choices is patterned, so the number of outcomes
 * reads at a glance: 2 → diagonal stripes, 3 → stripes the other way,
 * 4 → checks, 5 or more → upright stripes. Shared by screen and PDF.
 */
export type ChoicePattern = { kind: 'solid' } | { kind: 'stripes'; angle: number } | { kind: 'checks' };
export function patternFor(count: number): ChoicePattern {
  if (count <= 1) return { kind: 'solid' };
  if (count === 2) return { kind: 'stripes', angle: 45 };
  if (count === 3) return { kind: 'stripes', angle: -45 };
  if (count === 4) return { kind: 'checks' };
  return { kind: 'stripes', angle: 90 };
}

/**
 * CSS background patterning every chosen colour (see `patternFor`), each
 * passed through `paint` (e.g. to tint it). Grey when none are chosen.
 */
export function choicesPattern(nums: number[], paint: (colour: string) => string = c => c, stripe = 6): string {
  const cs = (nums.length ? nums.map(colourOf) : [NO_CHOICE_COLOUR]).map(paint);
  const p = patternFor(cs.length);
  if (p.kind === 'solid') return cs[0];
  if (p.kind === 'checks') {
    // One tile of four squares (each colour once), repeated.
    const t = stripe * 2;
    return `conic-gradient(${cs[0]} 0 25%, ${cs[1]} 0 50%, ${cs[2]} 0 75%, ${cs[3]} 0) 0 0 / ${t}px ${t}px`;
  }
  const stops = cs.map((c, i) => `${c} ${i * stripe}px ${(i + 1) * stripe}px`).join(', ');
  return `repeating-linear-gradient(${p.angle}deg, ${stops})`;
}

/**
 * Toggle buttons 1…n (like the period picker). `options()` is read each time
 * the editor is shown or focused, so it follows outcomes being added or
 * removed. Chosen numbers past the end (an outcome since deleted) are shown,
 * flagged, so they can be cleared.
 */
export function createChoicesEditor(
  value: string,
  onChange: (value: string) => void,
  options: () => string[],
  { prefix = '', empty = 'none' }: { prefix?: string; empty?: string } = {},
): HTMLElement {
  let chosen = parseChoices(value);
  const el = document.createElement('div');
  el.className = 'ts ch';

  /** What was last drawn: redraw only when the options have changed. */
  let drawn = '';
  const render = () => {
    const labels = options();
    const count = Math.max(labels.length, ...chosen);
    const key = JSON.stringify([labels, count]);
    if (key === drawn) return false;
    drawn = key;
    el.innerHTML = `
      <div class="ts__row" role="group" aria-label="Choose any number">
        ${count ? Array.from({ length: count }, (_, i) => {
          const n = i + 1;
          const stale = n > labels.length;
          const title = stale ? `${prefix}${n} no longer exists` : `${prefix}${n}${labels[i] ? `: ${labels[i]}` : ''}`;
          return `<button type="button" class="ts__chip ch__chip${stale ? ' is-stale' : ''}" data-choice="${n}"
            aria-pressed="${chosen.includes(n)}" title="${title.replace(/"/g, '&quot;')}" style="--ch-c:${colourOf(n)}">${prefix}${n}</button>`;
        }).join('') : `<span class="ch__empty">${empty}</span>`}
      </div>`;
    return true;
  };

  el.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-choice]');
    if (!b) return;
    e.preventDefault();
    const n = Number(b.dataset.choice);
    chosen = chosen.includes(n) ? chosen.filter(x => x !== n) : [...chosen, n].sort((a, c) => a - c);
    b.setAttribute('aria-pressed', String(chosen.includes(n)));
    onChange(serializeChoices(chosen));
  });
  // Outcomes may have been added, removed or renamed since: redraw if so.
  el.addEventListener('pointerenter', render);
  el.addEventListener('focusin', (e) => {
    const n = (e.target as HTMLElement).dataset.choice;
    if (render() && n) el.querySelector<HTMLElement>(`[data-choice="${n}"]`)?.focus();
  });
  el.addEventListener(REFRESH, () => { render(); });
  render();
  return el;
}
