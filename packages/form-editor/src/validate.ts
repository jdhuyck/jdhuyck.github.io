import type { FilledForm, Template, ValidationIssue } from './types';
import { boundsFor, parseTimerange, rangeProblems } from './timerange';

const filled = (v: string | undefined, type: string) =>
  type === 'checkbox' ? v === 'true' : !!v && v.trim().length > 0;

/** Everything that must be fixed before a form can be exported. */
export function validateForm(template: Template, form: FilledForm): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const f of template.fields) {
    if (f.required && !filled(form.values[f.id], f.type)) {
      issues.push({ fieldIds: [f.id], message: `“${f.label}” is required.` });
    }
  }

  for (const g of template.groups ?? []) {
    const rows = form.rows[g.id] ?? [];
    const requiredFields = g.fields.filter(rf => rf.required);

    // A row with anything in it must have all its required cells.
    rows.forEach((row, i) => {
      const touched = g.fields.some(rf => filled(row[rf.id], rf.type));
      if (!touched) return;
      for (const rf of requiredFields) {
        if (!filled(row[rf.id], rf.type)) {
          issues.push({ fieldIds: [`${g.id}.${i}.${rf.id}`], message: `${g.label}, row ${i + 1}: “${rf.label}” is required.` });
        }
      }
    });

    if (g.minRows) {
      const complete = rows.filter(row =>
        requiredFields.length
          ? requiredFields.every(rf => filled(row[rf.id], rf.type))
          : g.fields.some(rf => filled(row[rf.id], rf.type)),
      ).length;
      if (complete < g.minRows) {
        issues.push({
          fieldIds: rows.length ? g.fields.map(rf => `${g.id}.0.${rf.id}`) : [],
          message: `${g.label} needs at least ${g.minRows} completed row${g.minRows === 1 ? '' : 's'} (has ${complete}).`,
        });
      }
    }
  }

  // Time ranges must sit inside their lesson window and end after they start.
  for (const f of template.fields) {
    if (f.type !== 'timerange') continue;
    for (const p of rangeProblems(parseTimerange(form.values[f.id]), boundsFor(form, f))) {
      issues.push({ fieldIds: [f.id], message: `“${f.label}” ${p}.` });
    }
  }
  for (const g of template.groups ?? []) {
    for (const rf of g.fields.filter(f => f.type === 'timerange')) {
      (form.rows[g.id] ?? []).forEach((row, i) => {
        for (const p of rangeProblems(parseTimerange(row[rf.id]), boundsFor(form, rf, g, i))) {
          issues.push({ fieldIds: [`${g.id}.${i}.${rf.id}`], message: `${g.label}, row ${i + 1}: ${rf.label.toLowerCase()} ${p}.` });
        }
      });
    }
  }

  for (const r of template.rules ?? []) {
    if (r.kind === 'maxChecked' || r.kind === 'minChecked') {
      const ids = template.fields.filter(f => f.type === 'checkbox' && f.id.startsWith(r.prefix)).map(f => f.id);
      const checked = ids.filter(id => form.values[id] === 'true');
      if (r.kind === 'maxChecked' && checked.length > r.max) {
        issues.push({ fieldIds: checked, message: r.message ?? `Tick no more than ${r.max} (${checked.length} ticked).` });
      }
      if (r.kind === 'minChecked' && checked.length < r.min) {
        issues.push({ fieldIds: ids, message: r.message ?? `Tick at least ${r.min} (${checked.length} ticked).` });
      }
    } else if (r.kind === 'oneOf') {
      const fields = template.fields.filter(f => r.fields.includes(f.id));
      if (!fields.some(f => filled(form.values[f.id], f.type))) {
        issues.push({ fieldIds: r.fields, message: r.message ?? `Fill in one of: ${fields.map(f => f.label).join(', ')}.` });
      }
    }
  }

  return issues;
}
