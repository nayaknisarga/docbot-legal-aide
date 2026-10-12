import raw from "./template_definitions.json";
import { TEMPLATE_BODIES } from "./template-bodies";

/** Pure, deterministic catalogue + questionnaire logic. Safe on client and server. */

export type AnswerType = "text" | "long_text" | "number" | "money" | "date" | "boolean" | "select" | "multiselect" | "party";
export type AnswerValue = string | number | boolean | string[];
export type Answers = Record<string, AnswerValue | undefined>;

export interface Question {
  fieldId: string;
  label: string;
  helpText?: string;
  answerType: AnswerType;
  required: boolean;
  options?: string[];
  default?: AnswerValue;
  visibleWhen?: { fieldId: string; equals: AnswerValue };
  mapsTo?: string;
  sensitivity?: string;
  validation?: { notBefore?: string };
  common?: boolean;
}

export interface DocType {
  id: string;
  name: string;
  shortDescription: string;
  categories: string[];
  jurisdiction: string[];
  riskLevel: "low" | "medium" | "high";
  placeholderTemplate: string | null;
  jurisdictionWarnings?: Record<string, string>;
  usesCommonQuestions: string[];
  questions: Question[];
}

interface Catalogue {
  disclaimer: string;
  jurisdictionsSupported: string[];
  commonQuestions: Question[];
  categories: { id: string; name: string }[];
  documentTypes: DocType[];
}

export const CATALOGUE = raw as unknown as Catalogue;
export const DISCLAIMER = CATALOGUE.disclaimer;
export const CATEGORIES = CATALOGUE.categories;
export const DOC_TYPES = CATALOGUE.documentTypes;
export const COMMON_FIELD_IDS = new Set(CATALOGUE.commonQuestions.map((q) => q.fieldId));

export const getDocType = (id: string) => DOC_TYPES.find((d) => d.id === id);

/** Full ordered questionnaire: common questions first, then the template's own. */
export function questionsFor(doc: DocType): Question[] {
  const common = doc.usesCommonQuestions
    .map((id) => CATALOGUE.commonQuestions.find((q) => q.fieldId === id))
    .filter((q): q is Question => !!q)
    .map((q) => ({ ...q, common: true }));
  return [...common, ...doc.questions];
}

export function isEmpty(v: AnswerValue | undefined) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);
}

export function isVisible(q: Question, answers: Answers) {
  return !q.visibleWhen || answers[q.visibleWhen.fieldId] === q.visibleWhen.equals;
}

export const visibleQuestions = (doc: DocType, answers: Answers) => questionsFor(doc).filter((q) => isVisible(q, answers));

/** Next unanswered required question (then optional), skipping what's already known. */
export function nextQuestion(doc: DocType, answers: Answers): Question | null {
  const vis = visibleQuestions(doc, answers);
  return vis.find((q) => q.required && isEmpty(answers[q.fieldId])) ?? vis.find((q) => !q.required && answers[q.fieldId] === undefined) ?? null;
}

const JUR_CODES: Record<string, string> = { India: "IN", "US - Delaware": "US", "US - California": "US", "United Kingdom": "GB" };
export const jurisdictionCode = (label: AnswerValue | undefined) => (typeof label === "string" ? JUR_CODES[label] ?? null : null);

export type Coerced = { ok: true; value: AnswerValue } | { ok: false; error: string };

/** Deterministically coerce + validate one answer. Model/user input is never trusted. */
export function coerceAnswer(q: Question, input: unknown, today = new Date()): Coerced {
  const s = typeof input === "string" ? input.trim() : input;
  if (s === "" || s === null || s === undefined) return { ok: false, error: "A value is required." };
  switch (q.answerType) {
    case "number":
    case "money": {
      const n = typeof s === "number" ? s : Number(String(s).replace(/[,\s₹$£€]|INR|USD/gi, ""));
      if (!Number.isFinite(n)) return { ok: false, error: "Must be a number." };
      if (n < 0) return { ok: false, error: "Must not be negative." };
      return { ok: true, value: n };
    }
    case "boolean": {
      if (typeof s === "boolean") return { ok: true, value: s };
      const t = String(s).toLowerCase();
      if (["yes", "true", "y"].includes(t)) return { ok: true, value: true };
      if (["no", "false", "n"].includes(t)) return { ok: true, value: false };
      return { ok: false, error: "Must be yes or no." };
    }
    case "date": {
      const str = String(s);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(str) || Number.isNaN(Date.parse(str))) return { ok: false, error: "Use a date in YYYY-MM-DD format." };
      if (q.validation?.notBefore === "today" && str < today.toISOString().slice(0, 10)) return { ok: false, error: "Date cannot be in the past." };
      return { ok: true, value: str };
    }
    case "select": {
      const match = q.options?.find((o) => o.toLowerCase() === String(s).toLowerCase());
      return match ? { ok: true, value: match } : { ok: false, error: `Must be one of: ${q.options?.join(", ")}` };
    }
    case "multiselect": {
      const arr = Array.isArray(s) ? s.map(String) : String(s).split(",").map((x) => x.trim());
      const bad = arr.filter((x) => !q.options?.includes(x));
      return bad.length ? { ok: false, error: `Invalid options: ${bad.join(", ")}` } : { ok: true, value: arr };
    }
    default: {
      const str = String(s).slice(0, 4000);
      if (str.length < 2) return { ok: false, error: "Too short." };
      if (/email/i.test(q.fieldId) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return { ok: false, error: "Must be a valid email." };
      return { ok: true, value: str };
    }
  }
}

export interface Validation {
  missing: string[];
  invalid: { fieldId: string; error: string }[];
  conflicts: string[];
  jurisdiction: { code: string | null; supported: boolean; warning: string | null };
  ok: boolean;
}

export function validateAll(doc: DocType, answers: Answers, today = new Date()): Validation {
  const missing: string[] = [];
  const invalid: Validation["invalid"] = [];
  for (const q of visibleQuestions(doc, answers)) {
    const v = answers[q.fieldId];
    if (isEmpty(v)) { if (q.required) missing.push(q.fieldId); continue; }
    const c = coerceAnswer(q, v, today);
    if (!c.ok) invalid.push({ fieldId: q.fieldId, error: c.error });
  }
  const conflicts: string[] = [];
  if (!isEmpty(answers["party_a_name"]) && String(answers["party_a_name"]).trim().toLowerCase() === String(answers["party_b_name"] ?? "").trim().toLowerCase())
    conflicts.push("The two parties cannot be the same person or company.");
  if (typeof answers["survival_years"] === "number" && answers["survival_years"] > 10) conflicts.push("Confidentiality longer than 10 years is unusual — please confirm.");
  if (typeof answers["start_date"] === "string" && typeof answers["effective_date"] === "string" && answers["start_date"] < answers["effective_date"])
    conflicts.push("Start date is before the letter's effective date.");
  const code = jurisdictionCode(answers["jurisdiction"]);
  const supported = !!code && doc.jurisdiction.includes(code) && CATALOGUE.jurisdictionsSupported.includes(code);
  const warning = (code && doc.jurisdictionWarnings?.[code]) ?? null;
  return { missing, invalid, conflicts, jurisdiction: { code, supported, warning }, ok: !missing.length && !invalid.length && !conflicts.length && supported };
}

function fmt(q: Question, v: AnswerValue) {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "number") return q.answerType === "money" ? v.toLocaleString("en-IN") : String(v);
  return v;
}

export interface ClauseForRender { id: string; title: string; body: string; status: "proposed" | "approved" | "rejected" }

export type Segment = { kind: "text"; text: string } | { kind: "missing"; token: string; label: string } | { kind: "value"; text: string; fieldId: string };

/**
 * Renders the template into segments so the preview can highlight what's filled and what's missing.
 * Supports {{token}} (matching a question's mapsTo) and {{#if fieldId}}…{{/if}} / {{#if fieldId=Value}}…{{/if}}.
 */
export function renderSegments(doc: DocType, answers: Answers): Segment[] {
  const body = TEMPLATE_BODIES[doc.id] ?? genericBody(doc);
  const qs = visibleQuestions(doc, answers);
  const byToken = new Map<string, Question>();
  for (const q of questionsFor(doc)) if (q.mapsTo) byToken.set(q.mapsTo.replace(/[{}]/g, ""), q);
  const visibleIds = new Set(qs.map((q) => q.fieldId));
  const withIfs = body.replace(/\{\{#if ([a-z_]+)(?:=([^}]+))?\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, key: string, eq: string | undefined, inner: string) => {
    const v = answers[key];
    const on = eq === undefined ? v === true : String(v) === eq;
    return on ? inner : "";
  });
  const out: Segment[] = [];
  let last = 0;
  for (const m of withIfs.matchAll(/\{\{([a-z_]+)\}\}/g)) {
    out.push({ kind: "text", text: withIfs.slice(last, m.index) });
    const token = m[1]!;
    const q = byToken.get(token);
    const v = q && visibleIds.has(q.fieldId) ? answers[q.fieldId] : undefined;
    if (q && !isEmpty(v)) out.push({ kind: "value", text: fmt(q, v!), fieldId: q.fieldId });
    else out.push({ kind: "missing", token, label: q?.label ?? token.replace(/_/g, " ") });
    last = (m.index ?? 0) + m[0].length;
  }
  out.push({ kind: "text", text: withIfs.slice(last) });
  return out;
}

/** Final plain-text draft. Only APPROVED clauses are included; the disclaimer is always injected. */
export function renderDraft(doc: DocType, answers: Answers, clauses: ClauseForRender[]) {
  const segs = renderSegments(doc, answers);
  const leftovers = segs.filter((s) => s.kind === "missing").map((s) => (s as { token: string }).token);
  let text = segs.map((s) => (s.kind === "missing" ? `[${s.label.toUpperCase()}]` : s.text)).join("").replace(/\n{3,}/g, "\n\n").trim();
  const approved = clauses.filter((c) => c.status === "approved");
  if (approved.length) text += "\n\nADDITIONAL CLAUSES\n\n" + approved.map((c, i) => `A${i + 1}. ${c.title.toUpperCase()}\n${c.body}`).join("\n\n");
  return { text: `${DISCLAIMER}\n\n${text}`, leftovers };
}

/** Deterministic keyword ranking used by the agent's recommend_documents tool. */
export function rankDocTypes(need: string, jurisdictionCodeFilter: string | null, limit = 3) {
  const tokens = need.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const KW: Record<string, string[]> = {
    "nda-mutual": ["nda", "confidential", "secret", "share", "partner", "pitch", "idea", "disclosure"],
    "independent-contractor": ["freelance", "freelancer", "contractor", "consultant", "project", "hire", "gig", "developer", "designer"],
    "employment-offer": ["employee", "offer", "job", "hire", "hiring", "salary", "join", "staff"],
    "non-compete": ["compete", "competitor", "competition", "noncompete", "restrict", "leave"],
    "terms-of-service": ["website", "app", "terms", "service", "users", "platform", "saas"],
  };
  return DOC_TYPES.map((d) => {
    const hay = [...(KW[d.id] ?? []), ...d.name.toLowerCase().split(/\W+/), ...d.shortDescription.toLowerCase().split(/\W+/)];
    const hits = tokens.filter((t) => hay.some((h) => h === t || (t.length > 4 && h.startsWith(t.slice(0, 5)))));
    return { d, hits };
  })
    .filter((x) => x.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length)
    .slice(0, limit)
    .map(({ d, hits }) => ({
      id: d.id,
      name: d.name,
      reason: `Matches "${[...new Set(hits)].slice(0, 3).join(", ")}" — ${d.shortDescription}`,
      supportedInJurisdiction: jurisdictionCodeFilter ? d.jurisdiction.includes(jurisdictionCodeFilter) : null,
      warning: jurisdictionCodeFilter ? d.jurisdictionWarnings?.[jurisdictionCodeFilter] ?? null : null,
    }));
}

/** Deterministic consistency checks across the template and approved clauses. */
export function consistencyIssues(doc: DocType, answers: Answers, clauses: (ClauseForRender & { tags?: string[] })[]) {
  const issues: string[] = [];
  const code = jurisdictionCode(answers["jurisdiction"]);
  const approved = clauses.filter((c) => c.status === "approved");
  if (code && doc.jurisdictionWarnings?.[code]) issues.push(doc.jurisdictionWarnings[code]!);
  if (code === "IN" && approved.some((c) => /non-?compet/i.test(c.title + c.body)))
    issues.push("A non-compete style clause is approved but the governing law is India, where post-employment non-competes are generally unenforceable.");
  const dispute = approved.filter((c) => /arbitration|dispute/i.test(c.title));
  if (dispute.length > 1) issues.push("More than one dispute-resolution clause is approved; they may conflict.");
  for (const c of approved) {
    if (code === "IN" && /\bstate\b|delaware|california/i.test(c.body)) issues.push(`"${c.title}" refers to US states but governing law is India.`);
    if (code === "US" && /\bIndia\b/.test(c.body)) issues.push(`"${c.title}" refers to India but governing law is in the US.`);
    if (/\{\{[a-z_]+\}\}/.test(c.body)) issues.push(`"${c.title}" still contains an unfilled placeholder.`);
  }
  if (answers["has_confidentiality"] === false && approved.some((c) => /confidential/i.test(c.title)))
    issues.push("A confidentiality clause is approved but you answered 'no' to including confidentiality.");
  return issues;
}

/** Structured fallback body for catalogue templates without a hand-written body; built only from the template's own questions. */
export function genericBody(doc: DocType): string {
  const all = questionsFor(doc);
  const has = new Set(all.map((q) => q.fieldId));
  const own = all.filter((q) => q.mapsTo && !["jurisdiction", "effective_date"].includes(q.fieldId) && !q.fieldId.startsWith("party_"));
  const sections = own
    .map((q, i) => {
      const line = `${i + 1}. ${q.label.replace(/\?$/, "").toUpperCase()}\n${q.mapsTo}`;
      return q.visibleWhen && q.visibleWhen.equals === true ? `{{#if ${q.visibleWhen.fieldId}}}${line}\n\n{{/if}}` : `${line}\n\n`;
    })
    .join("");
  const party = (k: "a" | "b", role: string) =>
    has.has(`party_${k}_name`) ? `{{party_${k}_name}}${has.has(`party_${k}_address`) ? `, of {{party_${k}_address}}` : ""} ("${role}")` : "";
  const ps = [party("a", "Party A"), party("b", "Party B")].filter(Boolean);
  const parties = ps.length ? `BETWEEN\n${ps.join(", and\n")}.\n\n` : "";
  const sg = (["a", "b"] as const).filter((k) => has.has(`party_${k}_signatory`)).map((k) => `Party ${k.toUpperCase()}: {{party_${k}_signatory}}`);
  const signs = sg.length ? `SIGNATURES\n${sg.join("\n")}` : "SIGNATURE\n______________________";
  return `${doc.name.toUpperCase()}

This ${doc.name} is made effective {{effective_date}} and is governed by the laws of {{jurisdiction}}.

${parties}${sections}${own.length + 1}. GENERAL
This document records the details provided by the parties. Any change must be made in writing and signed by the parties. If any provision is held unenforceable, the remaining provisions continue in effect.

${signs}
`;
}
