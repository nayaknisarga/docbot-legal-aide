import type { Answers, DocumentType, FieldDefinition } from "./types";
import { getJurisdiction } from "./catalog";

export function isEmpty(v: Answers[string]) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

export function isVisible(field: FieldDefinition, answers: Answers) {
  if (!field.showIf) return true;
  const v = answers[field.showIf.field];
  return v === field.showIf.equals;
}

export function visibleFields(doc: DocumentType, answers: Answers) {
  return doc.fields.filter((f) => isVisible(f, answers));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateField(field: FieldDefinition, value: Answers[string]): string | null {
  if (isEmpty(value)) return field.required ? "This is required." : null;
  const v = field.validation ?? {};
  switch (field.type) {
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n)) return "Enter a number.";
      if (v.min !== undefined && n < v.min) return `Must be at least ${v.min}.`;
      if (v.max !== undefined && n > v.max) return `Must be at most ${v.max}.`;
      return null;
    }
    case "email":
      return EMAIL.test(String(value)) ? null : "Enter a valid email.";
    case "date":
      return Number.isNaN(Date.parse(String(value))) ? "Enter a valid date." : null;
    case "select":
      return field.options?.includes(String(value)) ? null : "Choose one of the options.";
    case "boolean":
      return typeof value === "boolean" ? null : "Choose yes or no.";
    default:
      if (v.minLength && String(value).trim().length < v.minLength) return `Please give at least ${v.minLength} characters.`;
      return null;
  }
}

export interface ValidationResult {
  fieldErrors: Record<string, string>;
  crossErrors: string[];
  missing: string[];
  jurisdictionError: string | null;
  ok: boolean;
}

export function validateSession(doc: DocumentType, answers: Answers, jurisdiction: string | undefined): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const missing: string[] = [];
  for (const f of visibleFields(doc, answers)) {
    const err = validateField(f, answers[f.id]);
    if (err) fieldErrors[f.id] = err;
    if (f.required && isEmpty(answers[f.id])) missing.push(f.id);
  }
  const crossErrors: string[] = [];
  for (const c of doc.crossChecks ?? []) {
    if (c.kind === "dateAfter") {
      const a = answers[c.field], b = answers[c.after];
      if (!isEmpty(a) && !isEmpty(b) && Date.parse(String(a)) <= Date.parse(String(b))) crossErrors.push(c.message);
    } else if (c.kind === "notEqual") {
      const a = answers[c.field], b = answers[c.other];
      if (!isEmpty(a) && !isEmpty(b) && String(a).trim().toLowerCase() === String(b).trim().toLowerCase()) crossErrors.push(c.message);
    }
  }
  let jurisdictionError: string | null = null;
  const j = jurisdiction ? getJurisdiction(jurisdiction) : undefined;
  if (!j) jurisdictionError = "Choose a jurisdiction.";
  else if (j.support === "unsupported" || !doc.jurisdictions.includes(j.code)) jurisdictionError = j.note || "This jurisdiction is not supported for this document.";
  return { fieldErrors, crossErrors, missing, jurisdictionError, ok: Object.keys(fieldErrors).length === 0 && crossErrors.length === 0 && !jurisdictionError };
}

/** Prefill reusable answers from the saved profile; never overwrites existing answers. */
export function prefillFromProfile(doc: DocumentType, answers: Answers, profile: Answers): Answers {
  const out = { ...answers };
  for (const f of doc.fields) if (f.reusable && isEmpty(out[f.id]) && !isEmpty(profile[f.id])) out[f.id] = profile[f.id];
  return out;
}

/** Drop answers for fields hidden by conditions so they never reach the draft. */
export function pruneHidden(doc: DocumentType, answers: Answers): Answers {
  const out: Answers = {};
  for (const f of visibleFields(doc, answers)) if (answers[f.id] !== undefined) out[f.id] = answers[f.id];
  return out;
}
