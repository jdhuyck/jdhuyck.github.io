import type { Template } from '../types';

/**
 * UH Secondary Lesson Plan 2024–25 (A4 portrait, 2 pages).
 * Coordinates measured from /public/templates/lesson-plan.pdf.
 *
 * Every box can grow: its blank area is stretched to fit the text and
 * everything below moves down. The plan table prints only the rows in use
 * (spilling onto extra pages, with the header repeated), and learning
 * outcomes are a numbered list of whatever length you need.
 */
export const lessonPlan: Template = {
  id: 'uh-lesson-plan',
  name: 'UH Secondary Lesson Plan',
  category: 'Planning',
  description: '2024–25 secondary lesson plan, with the post-lesson evaluation on page 2.',
  sourceUrl: 'templates/lesson-plan.pdf',
  pageCount: 2,
  pageSize: { width: 595, height: 842 },

  fields: [
    // ── Header row (blank area under the labels: 708 → 692) ──
    { id: 'name',      type: 'text', label: 'Name', required: true,            page: 0, rect: { x: 42,  y: 694, w: 238, h: 13 } },
    { id: 'yearGroup', type: 'text', label: 'Year group',                      page: 0, rect: { x: 289, y: 694, w: 76,  h: 13 } },
    { id: 'date',      type: 'date', label: 'Date', required: true, now: true, page: 0, rect: { x: 374, y: 694, w: 76,  h: 13 } },
    { id: 'time',      type: 'timeslot', label: 'Time (day, period, time)',
      help: 'Pick a day and one or more periods, and/or a start and end time.',
      page: 0, rect: { x: 459, y: 694, w: 92, h: 13 }, fontSize: 9 },

    { id: 'subject',  type: 'text', label: 'Subject / topic', required: true, page: 0, rect: { x: 42, y: 661.5, w: 508, h: 15 } },
    { id: 'sequence', type: 'text', label: 'Where does this lesson fit within the sequence of lessons?',
      page: 0, rect: { x: 292, y: 643.2, w: 258, h: 14 }, fontSize: 9 },

    { id: 'learningObjective', type: 'multiline', label: 'Learning objective', required: true,
      help: 'What is the overarching aim of the lesson?',
      page: 0, rect: { x: 42, y: 580, w: 231, h: 45 } },

    { id: 'inclusive', type: 'multiline', label: 'Inclusive practice (SEND / EAL / higher attainers)',
      help: 'Anticipation of adaptations and adjustments for the range of needs.',
      page: 0, rect: { x: 42, y: 530.5, w: 508, h: 30.5 } },
    { id: 'otherAdults', type: 'text', label: 'Direct support from other adults',
      page: 0, rect: { x: 186, y: 504.5, w: 364, h: 22 } },
    { id: 'resources', type: 'multiline', label: 'Resources',
      page: 0, rect: { x: 42, y: 472.5, w: 232, h: 16 } },
    { id: 'vocab', type: 'multiline', label: 'Subject specific vocabulary',
      page: 0, rect: { x: 284, y: 472.5, w: 266, h: 16 } },

    { id: 'prior', type: 'multiline', label: "Pupils' prior knowledge relating to this lesson",
      page: 0, rect: { x: 42, y: 388.5, w: 513, h: 32 } },

    // ── Page 2: lesson evaluation / reflection ────────
    { id: 'skStrengths', type: 'multiline', label: 'Subject knowledge: strengths',
      page: 1, rect: { x: 40, y: 598.5, w: 224, h: 79 } },
    { id: 'skDevelopment', type: 'multiline', label: 'Subject knowledge: areas for development',
      page: 1, rect: { x: 272, y: 598.5, w: 270, h: 79 } },
    { id: 'pupilsLearned', type: 'multiline',
      label: 'What did the pupils learn and how do you know this? Were all pupils able to access and engage in the learning?',
      page: 1, rect: { x: 40, y: 504.5, w: 502, h: 48 } },
    { id: 'ambition', type: 'multiline',
      label: 'Was the lesson suitably ambitious? Did all pupils have the opportunity to think deeply?',
      page: 1, rect: { x: 40, y: 424.5, w: 502, h: 63 } },
    { id: 'targets', type: 'multiline', label: 'How did this lesson demonstrate your progress in relation to your targets?',
      page: 1, rect: { x: 40, y: 352.5, w: 502, h: 50 } },
    { id: 'futureImpact', type: 'multiline', label: 'Future impact: how will this lesson inform future planning and practice?',
      page: 1, rect: { x: 40, y: 281.5, w: 502, h: 50 } },
  ],

  groups: [
    {
      // Numbered list in the right half of the objective box. The printed
      // "1. 2. 3." are dropped and redrawn for however many outcomes there are.
      id: 'objectives',
      label: 'Learning outcomes',
      addLabel: 'add outcome',
      page: 0,
      origin: { x: 292, y: 612 },
      rowHeight: 15,
      list: { rect: { x: 292, y: 580, w: 258, h: 45 }, numberX: 282.6 },
      initialRows: 1,
      maxRows: 12,
      minRows: 1,
      fields: [
        { id: 'text', type: 'text', label: 'Learning outcome', required: true,
          offset: { x: 0 }, size: { w: 258, h: 14 }, fontSize: 9 },
      ],
    },
    {
      id: 'plan',
      label: 'The plan for learning',
      addLabel: 'add stage',
      page: 0,
      origin: { x: 36, y: 297 },
      rowHeight: 48.75,
      initialRows: 1,
      maxRows: 40,
      minRows: 1,
      fields: [
        { id: 'timings', type: 'timerange', label: 'Timings', required: true, within: 'time',
          help: 'Start, then an end time or a duration; kept inside the lesson time.',
          offset: { x: 3, y: 2 }, size: { w: 44, h: 45 }, fontSize: 9, align: 'center' },
        { id: 'teacher', type: 'multiline', label: 'What is the teacher doing?', required: true,
          offset: { x: 53, y: 2 }, size: { w: 171, h: 45 }, fontSize: 9 },
        { id: 'pupils', type: 'multiline', label: 'What are the pupils learning?',
          offset: { x: 230, y: 2 }, size: { w: 235, h: 45 }, fontSize: 9 },
        { id: 'lo', type: 'multiselect', label: 'Related learning outcomes',
          help: 'Pick any number of the learning outcomes (or none). They colour this stage in the lesson timeline.',
          choices: { group: 'objectives', label: 'text', prefix: 'LO' },
          offset: { x: 471, y: 2 }, size: { w: 49, h: 45 }, fontSize: 9, align: 'center' },
      ],
    },
  ],

  sections: [
    { page: 0, title: 'Planning' },
    { page: 1, title: 'Reflection' },
  ],

  // On-screen lesson timeline (not exported): plan stages against the lesson time.
  timeline: { group: 'plan', timing: 'timings', label: 'teacher', outcome: 'lo', window: 'time' },

  flow: {
    continuation: { page: 0, from: 842, to: 760 },
    bands: [
      // Page 1
      { page: 0, from: 708, to: 692 },                       // name / year / date / time
      { page: 0, from: 678, to: 660 },                       // subject
      { page: 0, from: 645.5, to: 642, slice: [644.2, 643.8] }, // sequence (grows under its label)
      { page: 0, from: 626, to: 578, slice: [581, 580.5] },  // objective + outcomes (printed numbers dropped)
      { page: 0, from: 562, to: 529 },                       // inclusive practice
      { page: 0, from: 515, to: 503 },                       // other adults (grows under its label)
      { page: 0, from: 489, to: 471 },                       // resources / vocabulary
      { page: 0, from: 421, to: 387 },                       // prior knowledge
      {
        page: 0, group: 'plan', from: 346, to: 102,
        row: { from: 346, to: 297 },
        header: { from: 387, to: 346 },
        // Stage numbers, so stages can be referred to by number as well as time.
        numbers: { left: 35.5, right: 559.5, w: 30, fill: [36.4, 40.8], header: { text: 'Stage', baseline: 364.6 } },
      },
      // Page 2
      { page: 1, from: 679, to: 597 },                       // subject knowledge
      { page: 1, from: 554, to: 503 },                       // what pupils learned
      { page: 1, from: 489, to: 423 },                       // ambition
      { page: 1, from: 404, to: 351 },                       // targets
      { page: 1, from: 333, to: 280 },                       // future impact
    ],
  },

  /**
   * Forms saved before outcomes were a list stored them as lo1–lo3. (A plain
   * HH:MM in `time` is read as a timeslot start time; empty rows are left
   * alone in the editor and simply not printed.)
   */
  migrate(form) {
    const legacy = ['lo1', 'lo2', 'lo3'];
    if (form.rows.objectives || !legacy.some(k => k in form.values)) return false;
    const rows = legacy.map(k => ({ text: form.values[k] ?? '' })).filter(r => r.text.trim());
    form.rows.objectives = rows.length ? rows : [{}];
    legacy.forEach(k => delete form.values[k]);
    return true;
  },
};
