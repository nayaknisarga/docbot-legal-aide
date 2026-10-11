import type { Answers, DocumentType } from "./types";
import { getJurisdiction } from "./catalog";
import { pruneHidden, validateSession } from "./questionnaire";

export const DEMO_DISCLAIMER =
  "DEMO TEMPLATE — NOT REVIEWED BY A LAWYER. This draft is for information only, is not legal advice, and its enforceability has not been assessed.";

function fmt(v: Answers[string]) {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString("en");
  return v ?? "";
}

/** Deterministic template rendering: {{field}}, {{#if field}}…{{/if}}, {{#if field=value}}…{{/if}}. */
export function renderTemplate(body: string, values: Answers) {
  const withIfs = body.replace(/\{\{#if ([a-z_]+)(?:=([^}]+))?\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, key: string, eq: string | undefined, inner: string) => {
    const v = values[key];
    const on = eq === undefined ? v === true || (typeof v === "string" && v.trim() !== "") : String(v) === eq;
    return on ? inner : "";
  });
  return withIfs
    .replace(/\{\{([a-z_]+)\}\}/g, (_m, key: string) => {
      const v = values[key];
      return v === undefined || v === "" ? `[${key.replace(/_/g, " ").toUpperCase()}]` : String(fmt(v));
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export class GenerationError extends Error {}

export function generateDraft(doc: DocumentType, answers: Answers, jurisdiction: string) {
  const v = validateSession(doc, answers, jurisdiction);
  if (!v.ok) throw new GenerationError("Some required information is missing or invalid.");
  const j = getJurisdiction(jurisdiction)!;
  const values = { ...pruneHidden(doc, answers), jurisdiction_name: j.name };
  return {
    title: doc.template.title,
    body: renderTemplate(doc.template.body, values),
    templateVersion: doc.template.version,
    reviewStatus: doc.template.reviewStatus,
    disclaimer: doc.template.reviewStatus === "approved" ? null : DEMO_DISCLAIMER,
    riskNote: doc.riskNote ?? null,
    jurisdictionNote: j.note,
  };
}
