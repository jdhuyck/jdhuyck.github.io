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
    { id: 'time', type: 'timeslot', label: 'Time (day, period, time)', required: true,
      help: 'Pick a day and one or more periods, and/or a start and end time. "now" fills today and the current time.',
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

  groups: [
    {
      // One row per stage of the lesson. The stage number (to match the paired
      // lesson plan) and the time it started share the Stage cell, number on top.
      id: 'notes',
      label: 'Observation notes',
      addLabel: 'new stage',
      page: 0,
      origin: { x: 36.8, y: 81.3 },
      rowHeight: 39.7,
      initialRows: 1,
      maxRows: 40,
      minRows: 1,
      fields: [
        { id: 'stage', type: 'text', label: 'Stage', auto: 'count', align: 'center',
          help: 'The paired lesson plan stage these notes are for. It counts up from the last stage: change it to skip stages you have no notes for.',
          offset: { x: 1, y: 27 }, size: { w: 28, h: 11 }, fontSize: 9 },
        { id: 'time', type: 'time', label: 'Time', auto: 'now', now: true, align: 'center',
          help: 'When this stage started. Stamped when you add a stage; use "now" or type a time to change it.',
          offset: { x: 1, y: 17 }, size: { w: 28, h: 10 }, fontSize: 8, minFontSize: 6 },
        { id: 'text', type: 'multiline', label: 'Notes', required: true,
          help: 'Focus on the impact on pupils: the trainee’s subject knowledge, the agreed area of focus and their current targets.',
          offset: { x: 3, y: 1.5 }, size: { w: 532, h: 36.7 }, fontSize: 10, minFontSize: 6 },
      ],
    },
  ],

  // Feedback and the specific focus grow to fit; later content moves down.
  flow: {
    continuation: { page: 0, from: 842, to: 770 },
    bands: [
      { page: 0, from: 386.6, to: 385, slice: [386.4, 386.1] }, // specific area of focus
      {
        // Observation notes: the printed box becomes a table with a row per stage
        // (each a 40pt strip from the foot of the box, with its bottom border).
        page: 0, group: 'notes', from: 300.5, to: 80.3,
        row: { from: 121, to: 80.3 },
        header: { from: 362.9, to: 300.5 },
        numbers: {
          left: 36, right: 575.5, w: 30, fill: [36.6, 41.5],
          header: { text: 'Stage', baseline: 304.6 }, fields: ['stage', 'time'],
        },
      },
      { page: 1, from: 653, to: 546 },                           // strengths
      { page: 1, from: 506.5, to: 400 },                         // areas for development
    ],
  },

  rules: [
    { kind: 'minChecked', prefix: 'focus.', min: 1, message: 'Tick at least one broad observation focus.' },
    { kind: 'maxChecked', prefix: 'focus.', max: 3, message: 'Tick no more than 3 broad observation focus areas.' },
    { kind: 'minChecked', prefix: 'evidence.', min: 1, message: 'Tick at least one source of evidence of pupil learning.' },
  ],

  /**
   * Forms saved before notes were split into stages kept them in one `notes`
   * box: that becomes stage 1. Stages saved before they had their own number
   * are numbered in order.
   */
  migrate(form) {
    let changed = false;
    if (!form.rows.notes && 'notes' in form.values) {
      form.rows.notes = [{ text: form.values.notes ?? '' }];
      delete form.values.notes;
      changed = true;
    }
    form.rows.notes?.forEach((row, i) => {
      if (row.stage === undefined) { row.stage = String(i + 1); changed = true; }
    });
    return changed;
  },
};
