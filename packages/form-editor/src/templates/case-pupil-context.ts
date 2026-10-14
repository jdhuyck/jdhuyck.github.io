import type { GrowBand, Matrix, ScalarField, Template } from '../types';

/**
 * UH Case Pupil Context Record (PRP1), A4 landscape, 2 pages.
 * Coordinates measured from /public/templates/case-pupil-context.pdf.
 *
 * The case pupil table is a matrix: pre-labelled rows, one column per case
 * pupil. Word split it across the two printed pages, but it's one table:
 * page 2 is joined on (its logo strip is skipped), the table is kept on one
 * page when it fits, and otherwise breaks between rows with the
 * "Case Pupil A/B/C" header repeated.
 */

const COLUMNS = [
  { id: 'a', label: 'Case Pupil A', x: 246.6 },
  { id: 'b', label: 'Case Pupil B', x: 427.1 },
  { id: 'c', label: 'Case Pupil C', x: 607.7 },
];
const CELL_W = 175;

/**
 * Each row grows from just above its bottom border (`bottom`): the label
 * column's prompts run right down to the border, so the stretched `slice` is
 * a text-free strip between the prompts' last two lines.
 */
const ROWS: Array<Matrix['rows'][number] & { page: number; top: number; bottom: number; slice: [number, number]; required?: boolean }> = [
  {
    id: 'rationale', label: 'Rationale for case pupil selection', required: true,
    page: 0, top: 300.6, bottom: 277.2, slice: [279, 278.5],
  },
  {
    id: 'prior', label: 'Comments on prior attainment and/or learning in the subject',
    help: 'Bullet points may draw on statutory test results, internal summative and formative data, and what you’ve gathered through marking and class observations.',
    page: 0, top: 276.1, bottom: 186.9, slice: [197, 196.4],
  },
  {
    id: 'strengths', label: 'Comments on pupil strengths and/or barriers to learning to inform my planning',
    help: 'Identified learning needs; observations in class; discussions with other professionals and the pupil; approaches used by expert colleagues so that all pupils can meet expectations.',
    page: 0, top: 185.9, bottom: 85.9, slice: [95.9, 95.3],
  },
  {
    id: 'observations', label: 'Observations: what I am noticing about pupils’ participation, learning, enjoyment and progress over the sequence',
    help: 'Class observations, discussions with others who observed the learning, talking to the pupil, assessment and feedback; groupings, scaffolding, questioning. It’s fine not to comment after every lesson.',
    page: 1, top: 522.6, bottom: 376.5, slice: [386.4, 385.8],
  },
  {
    id: 'reflections', label: 'End of sequence: overall reflections on how well each case pupil met the intended outcome',
    help: 'The actual outcome and pupils’ workbooks; support staff and resources. If the outcome wasn’t met, reflect on why: was it too ambitious, or not ambitious enough?',
    page: 1, top: 375.8, bottom: 207.7, slice: [217.7, 217.1],
  },
];

const pupils: Matrix = {
  id: 'pupils',
  label: 'Case pupils',
  columns: COLUMNS.map(({ id, label }) => ({ id, label })),
  rows: ROWS.map(({ id, label, help }) => ({ id, label, help })),
};

/** "Case Pupil A / B / C" header row, repeated above rows that start a new page. */
const header = { page: 0, from: 314.4, to: 300.7 };

const cells: ScalarField[] = ROWS.flatMap(r => COLUMNS.map((c): ScalarField => ({
  id: `${pupils.id}.${r.id}.${c.id}`,
  type: 'multiline',
  label: `${c.label}: ${r.label}`,
  required: r.required,
  page: r.page,
  rect: { x: c.x + 2.5, y: r.bottom, w: CELL_W, h: r.top - r.bottom },
  fontSize: 9,
})));

export const casePupilContext: Template = {
  id: 'uh-case-pupil-context',
  name: 'Case Pupil Context Record (PRP1)',
  category: 'Planning',
  description: 'Context for a sequence of learning, with three case pupils followed from rationale to end-of-sequence reflections.',
  sourceUrl: 'templates/case-pupil-context.pdf',
  pageCount: 2,
  pageSize: { width: 842, height: 595.25 },

  fields: [
    { id: 'outcome', type: 'multiline', label: 'Overarching outcome for the sequence of learning', required: true,
      help: 'What you want pupils to know, remember and be able to do by the end of the sequence.',
      page: 0, rect: { x: 54, y: 431, w: 733, h: 26 } },
    { id: 'context', type: 'multiline', label: 'Context of the school and class', required: true,
      help: 'The school’s unique context and the class’s: pupil premium, SEND and EAL percentages, attainment and setting, behaviour and engagement.',
      page: 0, rect: { x: 57, y: 336.5, w: 728, h: 22 } },
    ...cells,
  ],
  matrices: [pupils],

  flow: {
    // The UH logo strip tops any overflow pages.
    continuation: { page: 0, from: 595.25, to: 528 },
    // Page 2 carries the table straight on, from just under its top border.
    joins: { 1: 522.7 },
    bands: [
      { page: 0, from: 457, to: 430 },     // overarching outcome (printed bullet dropped)
      { page: 0, from: 359, to: 335.4 },   // context box (printed bullet dropped)
      ...ROWS.map((r): GrowBand => ({
        page: r.page, from: r.bottom, to: r.bottom - 1, slice: r.slice,
        table: { id: pupils.id, header },
      })),
    ],
  },
};
