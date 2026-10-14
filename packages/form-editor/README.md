# form-editor

Fill in PDF templates (lesson plans, trainee observation forms…) in the browser and export a finished PDF. It's built into the root app at `/forms`.

- **Folders:** templates are listed like folders. Open one to see only its saved forms, start a new one, or rename and delete forms. The breadcrumbs (`~/forms / template / form`) are clickable, and clicking the form name renames it.
- **pdf view** shows the pages exactly as they'll be exported, and they reflow as you type:
  - Text shrinks to fit until it reaches a readable size (8pt). After that the **box grows** and everything below moves down, onto a new page if needed.
  - **Tables print only the rows you use.** Add and remove rows with the **+** / **×** buttons in the left margin.
  - **Tables stay on one page.** If a table won't fit in the space left, the whole table moves to the next page. A table taller than a page breaks only between rows, never inside one, and its header is repeated on the next page.
  - **Pages:** templates with distinct pages (e.g. the lesson plan's planning and reflection pages) always start each one on a new page. Where Word split one table across printed pages (e.g. the Case Pupil Context Record), the pages are joined and the content flows on.
  - **Lists** (e.g. learning outcomes) are numbered for however many items you add.
  - If a box can't grow any further on its page, the rest of its text continues in a box below, shown read-only and edited in the original box.
- **Stage numbers** (lesson plan and trainee observation): *The plan for learning* and the observation's *Observation notes* have a **Stage** column on the left numbering each stage (1, 2, 3…), so an observation's stages line up with the paired lesson plan's, and you can refer to a stage by number as well as by its timing. A stage keeps its number even if an empty stage before it isn't printed, and numbering carries on when a table continues onto another page.
  - While observing, press **+ new stage** (under the table in pdf view, or at the end of the notes in form view) to start the next stage's notes. The cursor moves straight to the new row's notes. Each stage prints as its own row of the notes table.
  - Each observation stage has its own **Stage** number and **Time**, printed together in the Stage cell (time beneath the number). A new stage is numbered one after the highest so far and stamped with the current time; change the number to skip lesson-plan stages you have no notes for, and use **now** or type a time (e.g. `915` → `09:15`) to change the time.
  - Observations saved before stages existed open with their notes as stage 1; stages saved before they had their own number are numbered in order.
- **Lesson timeline** (lesson plan only, on screen, never exported): each stage of *The plan for learning* is a block across the lesson's time, labelled with its stage number, coloured by its related learning outcome. Unplanned time is hatched and overlapping stages are flagged. Click a stage to jump to its timing; use **hide** to collapse it. Other templates can opt in with `timeline: { group, timing, label, outcome, window }`.
- **form view** is a plain responsive form with the same fields, which suits phones. It isn't split by printed page: it's one continuous form, or one section per titled part of the template (e.g. *Planning* and *Reflection*). Tables with labelled rows and columns are shown row by row, with a box per column.
- **:export** checks the form first: required fields, minimum rows and tick-box rules. If anything fails, it lists the problems and highlights the fields. Once the form passes, it builds the PDF from the same layout:
  - **flattened**: text drawn into the page.
  - **fillable**: real PDF form fields at the same positions, pre-filled, with auto font size.

Saved forms live in the browser's `localStorage`. Export a PDF to keep a copy.

### Time fields

- `time`: a single timestamp, with a **now** button.
- `timerange` (e.g. the plan's **Timings**): a start, an end and a duration in minutes. Fill in the end or the duration and the other follows. With `within: 'time'`, times are kept inside the lesson's start–end, and each stage offers to start where the previous one ended. Prints as `10:50 – 11:05 (15 min)`. Export is blocked if a stage falls outside the lesson or ends before it starts.
- `timeslot`: a day (Mon–Fri), one or more periods (P1–P6, e.g. P3 + P4 for a double), and a start–end time; **now** fills today and the current time. It prints as e.g. `Tue · P3–P4 · 10:50–12:30`, or `Tue P3–4 10:50–12:30` if that doesn't fit its box. Every template with a lesson time uses it: the lesson plan, the trainee observation (beside the date) and the FoPs (just above the date on the *Date/Time* line). A time saved as a plain `hh:mm` before is read as the start time. Fill in your bell times in `src/timeslot.ts` (`PERIOD_TIMES`) and picking periods sets the times automatically.

## Templates

| Template | File | Notes |
|----------|------|-------|
| UH Secondary Lesson Plan | `lesson-plan.pdf` | Variable learning outcomes; page 2 evaluation |
| Trainee Observation Form | `trainee-observation.pdf` | UH LOF 2024–25; max 3 focus areas; date + time share the Date cell; notes are a numbered row per stage |
| FoP: Assessment, Behaviour Management, Curriculum & Subject Knowledge, Pedagogy (Adaptive Practice / Cognitive Science / Dialogic Practice & Literacy / EAL / Planning & Sequencing) | `fop-*.pdf` | Built from one layout table in `src/templates/fops.ts` |
| FoP: Behaviour Management (Routines) | `fop-routines.pdf` | Row-per-routine table; no date/time on the printed form |
| Case Pupil Context Record (PRP1) | `case-pupil-context.pdf` | A4 landscape; case pupil matrix (5 labelled rows × pupils A–C), split across 2 printed pages and joined |

The FoP PDFs were converted from the UH `.doc` originals with LibreOffice (`soffice --headless --convert-to pdf`). Field positions match those PDFs. If you replace one with a Word export, page breaks may move: check it in **measure** mode and update `fops.ts`.

## Adding a template

1. **Add the blank PDF** to `public/templates/` at the repo root, e.g. `public/templates/lesson-plan.pdf`.
2. **Describe the fields** in `src/templates/<name>.ts`. Copy `lesson-plan.ts` as a starting point:

   ```ts
   export const myTemplate: Template = {
     id: 'my-template',
     name: 'My Template',
     sourceUrl: 'templates/my-template.pdf',
     pageCount: 1,
     pageSize: { width: 595, height: 842 },   // A4 portrait, in points
     fields: [
       { id: 'name', type: 'text', label: 'Name', required: true,
         page: 0, rect: { x: 60, y: 760, w: 220, h: 16 } },
       { id: 'notes', type: 'multiline', label: 'Notes', fontSize: 10, minFontSize: 6,
         page: 0, rect: { x: 60, y: 120, w: 480, h: 260 } },
     ],
     rules: [
       { kind: 'maxChecked', prefix: 'focus.', max: 3 },
     ],
   };
   ```

   Coordinates are **PDF points from the bottom-left** of the page.
3. **Register it** in `src/templates/index.ts`.
4. **Measure the boxes.** Run `npm run dev`, open a form, switch to **measure** (dev only) and drag over each box on the PDF. The tool copies a ready-made field definition to your clipboard and outlines existing fields so you can check alignment.

### Field options

| Option | Meaning |
|--------|---------|
| `type` | `text`, `multiline`, `date`, `time`, `checkbox`, `select` (with `options`) |
| `required` | Must be filled (or ticked) before export |
| `fontSize` / `minFontSize` | Preferred and smallest sizes for auto-fit (pt) |
| `align` | `left`, `center`, `right` |
| `help`, `placeholder` | Hints shown in form view |
| `type` `timeslot` / `timerange` | Lesson time, or a stage's start/end/duration (see *Time fields*) |
| `within` | `timerange` only: the timeslot field it must sit inside |
| `now` | `date`/`time` only: adds a **today**/**now** button that fills in the current date or time (it can still be typed) |

Repeatable rows (e.g. learning outcomes or a lesson timeline) use `groups`. A row field with `auto: 'count'` is filled with the next number when a row is added, and `auto: 'now'` with the current time (only for rows added by hand). Each group has an `origin` (bottom-left of row 0), a `rowHeight`, per-row `fields` with offsets, and optional `initialRows`, `maxRows`, `minRows` and `addLabel`. Rows can be added and removed in both views; in pdf view the **+** and **×** buttons appear when you hover over or tab into the group.

If you change a template's fields, add a `migrate(form)` function to upgrade forms saved with the old layout (see `lesson-plan.ts`).

### Reflow (`flow`)

Without a `flow`, every field keeps its printed size. With one, the template is cut into horizontal bands:

```ts
flow: {
  continuation: { page: 0, from: 842, to: 760 },   // copied to the top of overflow pages (logo strip)
  bands: [
    { page: 0, from: 678, to: 660 },               // a box that grows: blank area [from, to+1]
    { page: 0, group: 'plan', from: 346, to: 102,  // a table: printed rows replaced by rows in use
      row: { from: 346, to: 297 }, header: { from: 387, to: 346 } },
  ],
}
```

- **Grow band:** `from` is just under the box's label, `to` is its bottom border line. The blank area is redrawn by stretching a thin text-free `slice` (default: just above the border). If the prompts run right down to the border, pick a clean `slice` elsewhere on the page.
- **Fields:** a field grows when its bottom edge lies inside the blank area.
- **Rows whose labels run down to the border:** use a zero-height band just above the border (`to: from - 1`) with a `slice` taken from a clean strip elsewhere in the row (e.g. between the label's last two lines). The extra space is inserted under the label text.
- **Tables:** give each row's grow band the same `table: { id, header }`. The table is kept on one page when it fits; otherwise it only breaks between rows, with `header` (`{ page, from, to }`) repeated above the first row on the new page. A rows band (`group`) is always treated as a table.
- **Rows sized independently of the printed box:** a rows band's `row` can be any strip of the printed table, e.g. a 40pt strip at the foot of one big box with its bottom border (the observation's notes). Each row in use is a copy of it, so the box becomes a table. In pdf view, tables also get a labelled add button (e.g. **+ new stage**) under their last row.
- **Numbered rows:** add `numbers: { left, right, w, fill, header }` to a rows band to number its rows in a new column at the table's left edge (see `lesson-plan.ts`). The table, from its left border `left` to its right border `right`, is narrowed by `w` to make room, so it stays inside the printed margins. The column is drawn by stretching `fill`, a text-free x range just inside the left border, so header shading and row lines carry across. `header: { text, baseline }` labels the column on the header's text baseline. With `fields: ['stage', 'time']`, those row fields sit in the column instead of an automatic number: their `offset.x` is from `left`, and they keep their printed size rather than growing.
- **Joined pages:** `joins: { 1: 522.7 }` says source page 2 carries straight on from page 1, starting at y = 522.7 (just under its repeated logo). There's no page break; content only moves to a new page when it runs out of room. Pages that aren't joined always start a new page.
- **Lists:** a group with `list: { rect, numberX }` is drawn as a numbered list inside a grow band.
- **Measuring:** check bands in **measure** mode. Coordinates are PDF points from the bottom-left, and `from` is greater than `to`.

### Sections and matrices

- `sections: [{ page: 0, title: 'Planning' }, { page: 1, title: 'Reflection' }]` gives form view a titled section starting at each page. Without `sections`, form view is one continuous form.
- `matrices` describes a table with labelled rows and columns (see `case-pupil-context.ts`):

  ```ts
  matrices: [{ id: 'pupils', label: 'Case pupils',
    columns: [{ id: 'a', label: 'Case Pupil A' }, …],
    rows: [{ id: 'rationale', label: 'Rationale for case pupil selection', help: '…' }, …] }],
  ```

  Each cell is an ordinary field in `fields` with the id `pupils.rationale.a` (`matrix.row.column`), so it's positioned, validated and exported like any other field. The matrix only tells form view to lay the cells out as a grid, shown where its first cell is declared.

### Rules

| Rule | Example |
|------|---------|
| `maxChecked` / `minChecked` | `{ kind: 'maxChecked', prefix: 'focus.chk.', max: 3 }` |
| `oneOf` | `{ kind: 'oneOf', fields: ['email', 'phone'] }` |
