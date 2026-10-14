export type FieldType =
  | 'text' | 'multiline' | 'date' | 'time'
  /** Day (Mon–Fri), one or more periods (P1–P6) and a start–end time. */
  | 'timeslot'
  /** Start, end and duration (e.g. a lesson stage), kept inside `within`. */
  | 'timerange'
  | 'checkbox' | 'select';

export interface Rect { x: number; y: number; w: number; h: number; }
export type Align = 'left' | 'center' | 'right';

interface FieldCommon {
  id: string;
  type: FieldType;
  label: string;
  /**
   * Preferred (maximum) font size in PDF points. Text shrinks to fit the
   * field's box, down to `minFontSize`. Default 10 (9 in repeatable rows).
   */
  fontSize?: number;
  /** Smallest size text may shrink to before it is truncated. Default 6. */
  minFontSize?: number;
  align?: Align;
  options?: string[];        // for 'select'
  placeholder?: string;
  /** Must be filled in (or ticked, for checkboxes) before export. */
  required?: boolean;
  /** Shown under the field in form mode. */
  help?: string;
  /** date/time only: offer a "today"/"now" button that fills the current date or time. */
  now?: boolean;
  /** timerange only: id of the timeslot field whose start–end it must sit inside. */
  within?: string;
}

export interface ScalarField extends FieldCommon {
  page: number;              // 0-indexed
  rect: Rect;                // PDF coords, origin bottom-left
}

/** A row-field is offset within each row of a RepeatableGroup. */
export interface RowField extends FieldCommon {
  offset: { x: number; y?: number };
  size: { w: number; h: number };
  /**
   * Filled in when a row is added: `count` is one more than the previous
   * row's number (e.g. the next stage); `now` is the current time (only when
   * a row is added by hand, not for a new form's first row). Both can be edited.
   */
  auto?: 'count' | 'now';
}

export interface RepeatableGroup {
  id: string;
  label: string;
  page: number;
  origin: { x: number; y: number };   // bottom-left of row 0's cells, PDF coords
  rowHeight: number;                  // rows stack downwards by this much
  fields: RowField[];
  initialRows?: number;               // default 3
  maxRows?: number;                   // default 20
  /** At least this many rows must have a value in a required field. */
  minRows?: number;
  /**
   * Rows share this much vertical space (PDF points, from the top of row 0).
   * Adding rows makes each one shorter and its text shrinks to fit, so a
   * variable-length list always stays inside its printed box.
   */
  area?: { height: number };
  /** Button text for adding a row, e.g. "add outcome". */
  addLabel?: string;
  /**
   * Render rows as a numbered list inside `rect` (which should span a
   * GrowBand), instead of as table rows. Numbers are drawn at `numberX`.
   * Only the first field of the group is used.
   */
  list?: { rect: Rect; numberX?: number };
}

/**
 * A region of a source page that can get taller.
 * `from`/`to` are source y coordinates (from > to). The blank area
 * [from, to+1] is redrawn by stretching a thin, text-free `slice` of the
 * source (default: the 1pt above `to + 1`), so borders and shading survive.
 * Any field whose bottom edge sits inside the blank area grows with it.
 */
export interface GrowBand {
  page: number;
  from: number;
  to: number;
  slice?: [number, number];
  /**
   * Bands with the same `table.id` are rows of one table: it is kept on one
   * page when it fits and otherwise only breaks between rows, with `header`
   * repeated at the top of the next page.
   */
  table?: { id: string; header?: { page: number; from: number; to: number } };
}

/**
 * The printed rows of a table, replaced by one copy of `row` per row in use.
 * `row` is a single printed row (with its own blank `slice`); `header` is
 * repeated at the top of continuation pages. Like a `table` of grow bands,
 * the whole table is kept on one page when it fits.
 */
export interface RowsBand {
  page: number;
  group: string;
  from: number;
  to: number;
  row: { from: number; to: number; slice?: [number, number] };
  header?: { from: number; to: number };
  /**
   * Number the rows (1, 2, 3…) in a column added at the table's left edge.
   * The table, from its left border `left` to `right`, is narrowed by `w` to
   * make room, so it stays inside the printed margins. The new column is
   * drawn by stretching `fill`, a text-free x range just inside the left
   * border, so the header's shading and the row lines carry across.
   * `header` labels the column, on the source header's text baseline.
   * With `fields`, those row fields sit in the column instead of an automatic
   * number (e.g. an editable stage number with its time beneath): their
   * `offset.x` is from `left`, they aren't narrowed and they don't grow.
   */
  numbers?: {
    left: number; right: number; w: number; fill: [number, number];
    header?: { text: string; baseline: number };
    fields?: string[];
  };
}

/**
 * How a template reflows. Without a flow, every field keeps its printed
 * size and shrinks its text to fit.
 */
export interface Flow {
  bands: Array<GrowBand | RowsBand>;
  /** Band copied to the top of overflow pages (e.g. the logo strip). */
  continuation?: { page: number; from: number; to: number };
  /** Lowest content on each source page, to avoid copying trailing whitespace. */
  bottoms?: Record<number, number>;
  /**
   * Source pages that carry straight on from the previous one (e.g. a table
   * Word split across pages), mapped to where their content starts. The strip
   * above it (a repeated logo) is skipped and there's no page break: content
   * flows on and only breaks where it runs out of room. Pages not listed
   * always start a new page (e.g. a lesson plan's reflection page).
   */
  joins?: Record<number, number>;
  /** Text shrinks to this size before a field grows instead. Default 8pt. */
  readable?: number;
  /** Bottom margin on output pages. Default 28pt. */
  marginBottom?: number;
}

/**
 * A table with labelled rows and columns (e.g. one column per case pupil).
 * Each cell is an ordinary field in `fields` with the id `${id}.${row}.${column}`;
 * the matrix only tells form view to lay them out as a grid.
 */
export interface Matrix {
  id: string;
  label: string;
  columns: Array<{ id: string; label: string }>;
  rows: Array<{ id: string; label: string; help?: string }>;
}

/** Cross-field checks run before export. */
export type Rule =
  | { kind: 'maxChecked'; prefix: string; max: number; message?: string }
  | { kind: 'minChecked'; prefix: string; min: number; message?: string }
  | { kind: 'oneOf'; fields: string[]; message?: string };

export interface Template {
  id: string;
  name: string;
  /** Sidebar heading the template is listed under, e.g. "Planning". */
  category?: string;
  description?: string;
  /** Path to the blank PDF, relative to the site root (put files in /public/templates). */
  sourceUrl: string;
  pageCount: number;
  pageSize: { width: number; height: number };   // PDF points, per page
  fields: ScalarField[];
  groups?: RepeatableGroup[];
  matrices?: Matrix[];
  /**
   * Titled parts, each starting on a source page (e.g. a lesson plan's
   * planning and reflection pages), shown as headings in form view. Without
   * sections, form view is one continuous form.
   */
  sections?: Array<{ page: number; title: string }>;
  rules?: Rule[];
  /** Reflow rules: which bands grow and which tables repeat rows. */
  flow?: Flow;
  /**
   * Show an on-screen timeline of a group's rows (not exported): each row's
   * `timing` (a timerange field) becomes a block labelled by `label`.
   */
  timeline?: { group: string; timing: string; label: string; outcome?: string; window?: string };
  /** Upgrade a form saved with an older version of this template. Return true if changed. */
  migrate?: (form: FilledForm) => boolean;
}

export interface FilledForm {
  id: string;
  templateId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  values: Record<string, string>;
  rows: Record<string, Array<Record<string, string>>>;
}

export interface ValidationIssue {
  /** Field ids (or group row ids like `plan.0.teacher`) to highlight. */
  fieldIds: string[];
  message: string;
}
