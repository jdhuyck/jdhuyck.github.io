import type { ScalarField, Template } from '../types';

/**
 * UH Lesson Observation Form (LOF) 2024–25, used here as the Trainee
 * Observation Form. Coordinates measured from /public/templates/trainee-observation.pdf.
 */

const BROAD_FOCUS = [
  'High Expectations',
  'How Pupils Learn',
  'Subject and Curriculum Knowledge',
  'Classroom Practice',
  'Adaptive Practice',
  'Assessment',
  'Managing Behaviour',
  'Professional Behaviours',
];

const EVIDENCE = [
  'Lesson plan',
  'Pupil response, participation and engagement',
  'Deployment of other adults in the classroom',
  'Quality and impact of marking/feedback',
  "Impact of trainee's questioning and responses",
  'Adaptations for individuals/groups',
];

/** Tick-box rows: each printed row is ~15pt tall, top row's bottom edge at y = 529. */
const tick = (prefix: string, labels: string[], x: number): ScalarField[] =>
  labels.map((label, i) => ({
    id: `${prefix}.${i}`, type: 'checkbox' as const, label,
    page: 0, rect: { x, y: 529 - i * 15.2 + 1, w: 13, h: 13 },
  }));

export const traineeObservation: Template = {
  id: 'uh-trainee-observation',
  name: 'Trainee Observation Form',
  category: 'Observations',
  description: "Lesson observation of a trainee teacher, with post-lesson feedback on page 2.",
  sourceUrl: 'templates/trainee-observation.pdf',
  pageCount: 2,
  pageSize: { width: 595, height: 842 },

  fields: [
    // ── Header table: value column x 264–546 ──────────
    { id: 'trainee',  type: 'text', label: 'Trainee', required: true,  page: 0, rect: { x: 267, y: 726, w: 276, h: 13 } },
    { id: 'observer', type: 'text', label: 'Observer', required: true, page: 0, rect: { x: 267, y: 711, w: 276, h: 13 } },
    // The printed form has one Date cell: date on the left, time on the right.
    { id: 'date', type: 'date', label: 'Date', required: true, now: true, page: 0, rect: { x: 267, y: 696, w: 150, h: 13 } },
    { id: 'time', type: 'time', label: 'Time', required: true, now: true,
      help: 'Use "now" to stamp the current time, or type the lesson’s start time.',
      page: 0, rect: { x: 423, y: 696, w: 120, h: 13 } },
    { id: 'subject',   type: 'text', label: 'Curriculum subject / lesson topic', required: true,
      page: 0, rect: { x: 267, y: 681, w: 276, h: 13 } },
    { id: 'yearGroup', type: 'text', label: 'Year group / class / set',
      page: 0, rect: { x: 267, y: 666, w: 276, h: 13 } },

    // ── Tick boxes (see `rules`) ──────────────────────
    ...tick('focus', BROAD_FOCUS, 273.5),
    ...tick('evidence', EVIDENCE, 557.5),

    // ── Narrative ─────────────────────────────────────
    { id: 'specificFocus', type: 'text', label: 'Specific area of focus',
      page: 0, rect: { x: 175, y: 386.2, w: 397, h: 12 } },
    { id: 'notes', type: 'multiline', label: 'Observation notes', required: true,
      help: 'Focus on the impact on pupils: the trainee’s subject knowledge, the agreed area of focus and their current targets.',
      page: 0, rect: { x: 40, y: 81.5, w: 532, h: 215 } },

    // ── Page 2: post-lesson feedback ──────────────────
    { id: 'strengths', type: 'multiline', label: 'Strengths', required: true,
      help: 'In discussion with your trainee, summarise the key areas of practice that had a positive impact on pupil learning and progress.',
      page: 1, rect: { x: 40, y: 547.5, w: 532, h: 104 } },
    { id: 'development', type: 'multiline', label: 'Areas for development', required: true,
      help: 'In discussion with your trainee, consider specific areas for development moving forwards.',
      page: 1, rect: { x: 40, y: 401.5, w: 532, h: 103.5 } },
  ],

  sections: [
    { page: 0, title: 'Observation' },
    { page: 1, title: 'Post-lesson feedback' },
  ],

  // Notes, feedback and the specific focus grow to fit; later content moves down.
  flow: {
    continuation: { page: 0, from: 842, to: 770 },
    bands: [
      { page: 0, from: 386.6, to: 385, slice: [386.4, 386.1] }, // specific area of focus
      { page: 0, from: 298, to: 80 },                            // observation notes
      { page: 1, from: 653, to: 546 },                           // strengths
      { page: 1, from: 506.5, to: 400 },                         // areas for development
    ],
  },

  rules: [
    { kind: 'minChecked', prefix: 'focus.', min: 1, message: 'Tick at least one broad observation focus.' },
    { kind: 'maxChecked', prefix: 'focus.', max: 3, message: 'Tick no more than 3 broad observation focus areas.' },
    { kind: 'minChecked', prefix: 'evidence.', min: 1, message: 'Tick at least one source of evidence of pupil learning.' },
  ],
};
