import type { FilledForm } from './types';

const NS = 'form-editor';
const idxKey = () => `${NS}:index`;
const formKey = (id: string) => `${NS}:form:${id}`;

const uid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export class FormStore {
  list(): FilledForm[] {
    return this.readIndex()
      .map(id => this.get(id))
      .filter((f): f is FilledForm => !!f)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  listByTemplate(templateId: string): FilledForm[] {
    return this.list().filter(f => f.templateId === templateId);
  }

  get(id: string): FilledForm | null {
    const raw = localStorage.getItem(formKey(id));
    if (!raw) return null;
    try { return JSON.parse(raw) as FilledForm; } catch { return null; }
  }

  create(templateId: string, name: string): FilledForm {
    const now = Date.now();
    const form: FilledForm = {
      id: uid(),
      templateId,
      name,
      createdAt: now,
      updatedAt: now,
      values: {},
      rows: {},
    };
    this.save(form);
    return form;
  }

  save(form: FilledForm): void {
    form.updatedAt = Date.now();
    localStorage.setItem(formKey(form.id), JSON.stringify(form));
    const idx = this.readIndex();
    if (!idx.includes(form.id)) {
      idx.push(form.id);
      localStorage.setItem(idxKey(), JSON.stringify(idx));
    }
  }

  delete(id: string): void {
    localStorage.removeItem(formKey(id));
    localStorage.setItem(
      idxKey(),
      JSON.stringify(this.readIndex().filter(x => x !== id)),
    );
  }

  private readIndex(): string[] {
    try { return JSON.parse(localStorage.getItem(idxKey()) ?? '[]'); }
    catch { return []; }
  }
}
