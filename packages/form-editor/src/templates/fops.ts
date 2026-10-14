import type { GrowBand, Rect, ScalarField, Template } from '../types';

/**
 * Focused Observations of Practice (FoPs).
 *
 * The UH FoP sheets share a structure: a header line (name/subject,
 * class/set, date/time), a COMMENTS column beside the prompts (sometimes
 * spanning pages), and two REFLECTIONS AND NEXT STEPS questions. Layouts
 * below were measured from the PDFs in /public/templates (the .doc
 * originals converted with LibreOffice). If you re-export a PDF from Word,
 * pagination may shift: re-measure with "measure" mode in `npm run dev`.
 */

interface FopLayout {
  id: string;
  /** Shown after "FoP: ". */
  focus: string;
  pageCount: number;
  header: { page: number; teacher: Rect; classSet: Rect; date: Rect; time: Rect };
  /**
   * One box per page the comments column runs across. `band` is the blank
   * strip between the last printed prompt and the table's bottom border:
   * it stretches when comments need more room.
   */
  comments: { page: number; rect: Rect; band: Band }[];
  reflections: {
    page: number;
    success: { label: string; rect: Rect; band: Band };
    next: { label: string; rect: Rect; band: Band };
  };
}

/**
 * `slice` overrides the strip that's stretched, for tables whose prompts run
 * right down to the border (no blank strip at the bottom).
 */
interface Band { from: number; to: number; slice?: [number, number] }

const A4 = { width: 595, height: 842 };

const LAYOUTS: FopLayout[] = [
  {
    id: 'fop-assessment', focus: 'Assessment', pageCount: 2,
    header: { page: 0, teacher: { x: 160, y: 648, w: 124, h: 12 }, classSet: { x: 340, y: 648, w: 73, h: 12 },
      date: { x: 486, y: 648, w: 43, h: 12 }, time: { x: 531, y: 648, w: 33, h: 12 } },
    comments: [
      { page: 0, rect: { x: 294, y: 29, w: 270, h: 591 }, band: { from: 35.1, to: 25.8 } },
    ],
    reflections: {
      page: 1,
      success: { label: "What was successful about how assessment was used within the lesson and why?", rect: { x: 66, y: 689.2, w: 495, h: 53.8 }, band: { from: 696.7, to: 687.2 } },
      next: { label: "How will you use this observation to help you with your planning and teaching?", rect: { x: 66, y: 620, w: 495, h: 53.7 }, band: { from: 628, to: 617.8 } },
    },
  },
  {
    id: 'fop-behaviour-management', focus: 'Behaviour Management', pageCount: 2,
    header: { page: 0, teacher: { x: 149, y: 663, w: 89, h: 12 }, classSet: { x: 296, y: 663, w: 65, h: 12 },
      date: { x: 422, y: 663, w: 35, h: 12 }, time: { x: 459, y: 663, w: 26, h: 12 } },
    comments: [
      { page: 0, rect: { x: 330, y: 21, w: 240, h: 620 }, band: { from: 27.4, to: 18.1 } },
    ],
    reflections: {
      page: 1,
      success: { label: "What was successful about how behaviour management was used within the lesson and why?", rect: { x: 51, y: 689.2, w: 517, h: 53.8 }, band: { from: 696.7, to: 687.2 } },
      next: { label: "How will you use this observation to help you with your planning and teaching?", rect: { x: 51, y: 618, w: 517, h: 55.7 }, band: { from: 626, to: 615.6 } },
    },
  },
  {
    id: 'fop-curriculum', focus: 'Curriculum & Subject Knowledge', pageCount: 2,
    header: { page: 0, teacher: { x: 146, y: 655, w: 124, h: 12 }, classSet: { x: 325, y: 655, w: 73, h: 12 },
      date: { x: 471, y: 655, w: 43, h: 12 }, time: { x: 516, y: 655, w: 33, h: 12 } },
    comments: [
      { page: 0, rect: { x: 316, y: 25, w: 254, h: 598 }, band: { from: 29.6, to: 22.5 } },
    ],
    reflections: {
      page: 1,
      success: { label: "What was successful about how curriculum and subject knowledge was used within the lesson and why?", rect: { x: 51, y: 696.3, w: 517, h: 52.7 }, band: { from: 703.8, to: 694.3 } },
      next: { label: "How will you use this observation to help you with your planning and teaching?", rect: { x: 51, y: 625, w: 517, h: 55.8 }, band: { from: 633, to: 622.7 } },
    },
  },
  {
    id: 'fop-adaptive-practice', focus: 'Pedagogy (Adaptive Practice)', pageCount: 3,
    header: { page: 1, teacher: { x: 185, y: 70, w: 99, h: 12 }, classSet: { x: 331, y: 70, w: 74, h: 12 },
      date: { x: 456, y: 70, w: 44, h: 12 }, time: { x: 502, y: 70, w: 33, h: 12 } },
    comments: [
      { page: 1, rect: { x: 302, y: 17.8, w: 268, h: 20.2 }, band: { from: 17.9, to: 16.7, slice: [29.3, 28.7] } },
      { page: 2, rect: { x: 302, y: 404, w: 268, h: 377 }, band: { from: 412.5, to: 402 } },
    ],
    reflections: {
      page: 2,
      success: { label: "What was successful about how adaptive practice was used within the lesson and why?", rect: { x: 51, y: 306.9, w: 517, h: 52.1 }, band: { from: 314.4, to: 304.9 } },
      next: { label: "How will you use this observation to help you with your planning and teaching?", rect: { x: 51, y: 238, w: 517, h: 53.4 }, band: { from: 246, to: 235.5 } },
    },
  },
  {
    id: 'fop-cognitive-science', focus: 'Pedagogy (Cognitive Science)', pageCount: 3,
    header: { page: 1, teacher: { x: 174, y: 73, w: 99, h: 12 }, classSet: { x: 321, y: 73, w: 74, h: 12 },
      date: { x: 445, y: 73, w: 44, h: 12 }, time: { x: 491, y: 73, w: 33, h: 12 } },
    comments: [
      { page: 2, rect: { x: 295, y: 334, w: 276, h: 448 }, band: { from: 340.9, to: 331.5 } },
    ],
    reflections: {
      page: 2,
      success: { label: "Can you relate what you saw in the lesson observation to some theories from cognitive science?", rect: { x: 51, y: 236.4, w: 517, h: 52.6 }, band: { from: 243.9, to: 234.4 } },
      next: { label: "How will you use this observation to help you with your planning and teaching?", rect: { x: 51, y: 168, w: 517, h: 52.9 }, band: { from: 176, to: 165 } },
    },
  },
  {
    id: 'fop-dialogic-literacy', focus: 'Pedagogy (Dialogic Practice & Literacy)', pageCount: 4,
    header: { page: 1, teacher: { x: 185, y: 67, w: 99, h: 12 }, classSet: { x: 331, y: 67, w: 74, h: 12 },
      date: { x: 456, y: 67, w: 44, h: 12 }, time: { x: 502, y: 67, w: 33, h: 12 } },
    comments: [
      { page: 2, rect: { x: 273, y: 22.7, w: 297, h: 758.3 }, band: { from: 22.8, to: 21.6, slice: [129.4, 128.8] } },
      { page: 3, rect: { x: 273, y: 626.1, w: 297, h: 154.9 }, band: { from: 626.2, to: 625, slice: [754, 753.4] } },
    ],
    reflections: {
      page: 3,
      success: { label: "What was successful about how dialogic practice and/or literacy development was used within the lesson and why?", rect: { x: 51, y: 529.8, w: 517, h: 53.2 }, band: { from: 537.3, to: 527.8 } },
      next: { label: "How will you use this observation to help you with your planning and teaching?", rect: { x: 51, y: 461, w: 517, h: 53.3 }, band: { from: 469, to: 458.4 } },
    },
  },
  {
    id: 'fop-eal', focus: 'Pedagogy (EAL)', pageCount: 4,
    header: { page: 2, teacher: { x: 185, y: 748, w: 99, h: 12 }, classSet: { x: 331, y: 748, w: 74, h: 12 },
      date: { x: 456, y: 748, w: 44, h: 12 }, time: { x: 502, y: 748, w: 33, h: 12 } },
    comments: [
      { page: 2, rect: { x: 273, y: 16.3, w: 297, h: 700.7 }, band: { from: 16.4, to: 15.2, slice: [39.3, 38.7] } },
      { page: 3, rect: { x: 273, y: 566, w: 297, h: 216 }, band: { from: 607.3, to: 563.2 } },
    ],
    reflections: {
      page: 3,
      success: { label: "What was successful about how EAL pedagogical approaches were used within the lesson and why?", rect: { x: 51, y: 468.1, w: 517, h: 52.9 }, band: { from: 475.6, to: 466.1 } },
      next: { label: "How will you use this observation to help you with your planning and teaching?", rect: { x: 51, y: 399, w: 517, h: 53.6 }, band: { from: 407, to: 396.7 } },
    },
  },
  {
    id: 'fop-planning-sequencing', focus: 'Pedagogy (Planning & Sequencing)', pageCount: 4,
    header: { page: 1, teacher: { x: 174, y: 73, w: 99, h: 12 }, classSet: { x: 321, y: 73, w: 74, h: 12 },
      date: { x: 445, y: 73, w: 44, h: 12 }, time: { x: 491, y: 73, w: 33, h: 12 } },
    comments: [
      { page: 2, rect: { x: 295, y: 174, w: 276, h: 608 }, band: { from: 181.1, to: 171.8 } },
    ],
    reflections: {
      page: 2,
      success: { label: "What was successful about how planning and sequencing was used within the lesson and why?", rect: { x: 51, y: 76.6, w: 517, h: 53.4 }, band: { from: 84.1, to: 74.6 } },
      next: { label: "How will you use this observation to help you with your planning and teaching?", rect: { x: 51, y: 20.1, w: 517, h: 41 }, band: { from: 20.2, to: 19, slice: [31, 30.4] } },
    },
  },
];

function fop(l: FopLayout): Template {
  const h = l.header;
  // The date sits on the whole "Date/Time…" line; day, periods and time go just above it.
  const when = { x: h.date.x, w: h.time.x + h.time.w - h.date.x };
  const commentIds = l.comments.map((_, i) => (i === 0 ? 'comments' : `comments${i + 1}`));
  const fields: ScalarField[] = [
    { id: 'teacher', type: 'text', label: 'Teacher’s name / subject', required: true, page: h.page, rect: h.teacher, fontSize: 9 },
    { id: 'classSet', type: 'text', label: 'Class / set', page: h.page, rect: h.classSet, fontSize: 9 },
    { id: 'date', type: 'date', label: 'Date', required: true, now: true, page: h.page,
      rect: { ...when, y: h.date.y, h: h.date.h }, fontSize: 9, minFontSize: 5 },
    { id: 'time', type: 'timeslot', label: 'Time (day, period, time)',
      help: 'Pick a day and one or more periods, and/or a start and end time. "now" fills today and the current time.',
      page: h.page, rect: { ...when, y: h.date.y + 12, h: 10 }, fontSize: 8, minFontSize: 5 },
    ...l.comments.map((c, i): ScalarField => ({
      id: commentIds[i],
      type: 'multiline',
      label: l.comments.length > 1 ? `Comments / questions (page ${c.page + 1})` : 'Comments / questions',
      help: 'Things you notice, and questions to ask the teacher afterwards.',
      page: c.page,
      rect: c.rect,
      fontSize: 10,
      minFontSize: 6,
    })),
    {
      id: 'successes', type: 'multiline', label: l.reflections.success.label, required: true,
      page: l.reflections.page, rect: l.reflections.success.rect, fontSize: 10, minFontSize: 6,
    },
    {
      id: 'nextSteps', type: 'multiline', label: l.reflections.next.label, required: true,
      page: l.reflections.page, rect: l.reflections.next.rect, fontSize: 10, minFontSize: 6,
    },
  ];

  return {
    id: l.id,
    name: `FoP: ${l.focus}`,
    category: 'Focused observations (FoPs)',
    description: `Focused Observation of Practice: ${l.focus}. Note what you see and the questions you'd ask, then reflect with the teacher you observed.`,
    sourceUrl: `templates/${l.id}.pdf`,
    pageCount: l.pageCount,
    pageSize: A4,
    fields,
    rules: [{ kind: 'oneOf', fields: commentIds, message: 'Add at least one comment or question.' }],
    flow: {
      // The UH logo strip tops any overflow pages.
      continuation: { page: 0, from: 842, to: 786 },
      bands: [
        ...l.comments.map((c): GrowBand => ({ page: c.page, ...c.band })),
        { page: l.reflections.page, ...l.reflections.success.band },
        { page: l.reflections.page, ...l.reflections.next.band },
      ],
    },
  };
}

/** Routines (ITaP week) uses a different, row-per-routine table and has no header line. */
const routines: Template = {
  id: 'fop-routines',
  name: 'FoP: Behaviour Management (Routines)',
  category: 'Focused observations (FoPs)',
  description: 'Intensive Training and Practice: the routines a teacher uses to start a lesson, move between activities and finish.',
  sourceUrl: 'templates/fop-routines.pdf',
  pageCount: 1,
  pageSize: A4,
  fields: [
    { id: 'entry', type: 'multiline', label: 'Routine one: Entry Procedures', page: 0, rect: { x: 271, y: 470, w: 272, h: 203 } },
    { id: 'transitions', type: 'multiline', label: 'Routine two: Transitions Between Activities', page: 0, rect: { x: 271, y: 289, w: 272, h: 176 } },
    { id: 'end', type: 'multiline', label: 'Routine three: The End of the Lesson', page: 0, rect: { x: 271, y: 162, w: 272, h: 122 } },
    { id: 'notes', type: 'multiline', label: 'Additional Notes and Comments',
      help: 'Relate your observations to the theoretical basis for routines and other discussions from your ITaP week.',
      page: 0, rect: { x: 271, y: 89, w: 272, h: 68 } },
  ],
  rules: [{ kind: 'oneOf', fields: ['entry', 'transitions', 'end'], message: 'Record observations for at least one routine.' }],
  flow: {
    continuation: { page: 0, from: 842, to: 770 },
    bands: [
      // Blank strip at the foot of each row, under the printed prompts.
      { page: 0, from: 472.5, to: 468 },
      { page: 0, from: 291.5, to: 287 },
      { page: 0, from: 164.5, to: 160 },
      { page: 0, from: 91.5, to: 87 },
    ],
  },
};

export const fops: Template[] = [...LAYOUTS.map(fop), routines];
