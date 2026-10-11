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
}

/**
 * The printed rows of a table, replaced by one copy of `row` per row in use.
 * `row` is a single printed row (with its own blank `slice`); `header` is
 * repeated at the top of continuation pages.
 */
export interface RowsBand {
  page: number;
  group: string;
  from: number;
  to: number;
  row: { from: number; to: number; slice?: [number, number] };
  header?: { from: number; to: number };
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
  /** Text shrinks to this size before a field grows instead. Default 8pt. */
  readable?: number;
  /** Bottom margin on output pages. Default 28pt. */
  marginBottom?: number;
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
