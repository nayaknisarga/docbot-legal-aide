import { z } from "zod";

/** Pure, tested logic for user-uploaded templates. AI output is always passed through these guards. */

export type Verdict = "allowed" | "review" | "blocked";
export type LegalSource = { title: string; url: string; excerpt: string };
export type Clause = {
  id: string;
  position: number;
  heading: string;
  body: string;
  origin: "original" | "added";
  action: "keep" | "add" | "remove";
  verdict: Verdict;
  decision: "none" | "pending" | "approved" | "skipped";
  note: string;
  sources: LegalSource[];
};
export type ChatMessage = { role: "assistant" | "user"; text: string };

export const MAX_TEXT = 60000;
export const MAX_CLAUSES = 80;

/** Unsure or malformed verdicts become "review" — never guess green or red. */
export function normalizeVerdict(
  verdict: unknown,
  note: unknown,
): { verdict: Verdict; note: string } {
  const n = typeof note === "string" ? sanitizeWording(note).slice(0, 300) : "";
  if (verdict === "allowed") return { verdict: "allowed", note: n };
  if (verdict === "blocked" && n) return { verdict: "blocked", note: n };
  return {
    verdict: "review",
    note: n || "Flagged for legal review — the assistant could not assess this confidently.",
  };
}

/** Removes approval/guarantee language. Statuses are suggestions, not legal advice. */
export function sanitizeWording(text: string): string {
  return text
    .replace(/\blegally\s+(approved|valid|binding|compliant|sound)\b/gi, "flagged for legal review")
    .replace(/\b(lawyer|attorney)[-\s]approved\b/gi, "not lawyer-reviewed")
    .replace(/\bguarantee(d|s)?\b(\s+to\s+be)?/gi, "may be")
    .replace(/\b(fully|definitely|certainly|always)\s+enforceable\b/gi, "likely allowed")
    .replace(/\bis\s+enforceable\b/gi, "is likely allowed")
    .replace(/\bwill\s+be\s+enforceable\b/gi, "may be enforceable");
}

const HEADING = /^(\d+(\.\d+)*[.)]?\s+\S|(section|article|clause|schedule)\s+[\dIVX]+)/i;
function isCapsHeading(line: string) {
  return (
    line.length >= 3 &&
    line.length < 80 &&
    /[A-Z]/.test(line) &&
    line === line.toUpperCase() &&
    /^[A-Z0-9 .,&()'’:-]+$/.test(line)
  );
}

/** Deterministic clause split. The AI never rewrites original text — it only reviews these pieces. */
export function splitClauses(raw: string): { heading: string; body: string }[] {
  const text = raw.replace(/\r\n?/g, "\n").slice(0, MAX_TEXT);
  const lines = text.split("\n").map((l) => l.trim());
  const hasHeadings = lines.some((l) => HEADING.test(l) || isCapsHeading(l));
  const groups: string[][] = [];
  let cur: string[] = [];
  const flush = () => {
    if (cur.join("").trim()) groups.push(cur);
    cur = [];
  };
  for (const line of lines) {
    if (!line) {
      if (!hasHeadings) flush();
      continue;
    }
    if (hasHeadings && (HEADING.test(line) || isCapsHeading(line))) flush();
    cur.push(line);
  }
  flush();
  const out = groups.map((g) => {
    const first = g[0] ?? "";
    const heading = first.length <= 100 ? first : first.split(/\s+/).slice(0, 8).join(" ") + "…";
    return { heading, body: g.join("\n") };
  });
  if (out.length <= MAX_CLAUSES) return out;
  const head = out.slice(0, MAX_CLAUSES - 1);
  const rest = out.slice(MAX_CLAUSES - 1);
  head.push({ heading: rest[0]!.heading, body: rest.map((c) => c.body).join("\n\n") });
  return head;
}

/** Parses model JSON (optionally fenced) against a schema; null when malformed. */
export function parseModelJson<S extends z.ZodTypeAny>(
  text: string,
  schema: S,
): z.output<S> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const r = schema.safeParse(JSON.parse(m[0]));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export const ReviewSchema = z.object({
  summary: z.string(),
  reviews: z.array(
    z.object({ index: z.number(), verdict: z.string(), note: z.string().optional().default("") }),
  ),
});
export const AdditionSchema = z.object({
  reply: z.string().optional().default(""),
  clauses: z.array(
    z.object({
      heading: z.string(),
      body: z.string(),
      verdict: z.string(),
      note: z.string().optional().default(""),
    }),
  ),
});
export const RemovalSchema = z.object({
  reply: z.string().optional().default(""),
  indexes: z.array(z.number()),
});

const JurisdictionView = z.object({
  verdict: z.string(),
  explanation: z.string().optional().default(""),
});
export const LegalQuestionSchema = z.object({
  answer: z.string().optional().default(""),
  india: JurisdictionView,
  us: JurisdictionView,
  clarifying_question: z.string().optional().default(""),
});

const VERDICT_LABEL: Record<Verdict, string> = {
  allowed: "✓ Likely allowed",
  review: "◑ Flagged for legal review",
  blocked: "✕ May be unenforceable or unlawful",
};

/** Turns a validated India/US answer into safe chat text. Unknown verdicts become "review". */
export function formatLegalAnswer(
  a: z.output<typeof LegalQuestionSchema>,
  sources: LegalSource[],
): string {
  if (a.clarifying_question.trim()) return sanitizeWording(a.clarifying_question.trim());
  const line = (name: string, v: { verdict: string; explanation: string }) =>
    `**${name}: ${VERDICT_LABEL[normalizeVerdict(v.verdict, v.explanation).verdict]}**\n${v.explanation || "No clear answer from the sources — check with a lawyer."}`;
  const parts = [
    a.answer.trim(),
    line("India", a.india),
    line("United States", a.us),
    sources.length
      ? `Sources checked:\n${sources.map((s, i) => `${i + 1}. [${s.title}](${s.url})`).join("\n")}`
      : "No reliable sources were found, so this answer is cautious.",
    "_Suggestion only, not legal advice._",
  ].filter(Boolean);
  return sanitizeWording(parts.join("\n\n"));
}

/** Research results are untrusted data. Keep only valid public HTTP(S) links and compact excerpts. */
export function sanitizeResearchSources(input: unknown): LegalSource[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      if (typeof row["url"] !== "string") return [];
      let url: URL;
      try {
        url = new URL(row["url"]);
      } catch {
        return [];
      }
      if (!["http:", "https:"].includes(url.protocol) || seen.has(url.href)) return [];
      seen.add(url.href);
      const excerpts = Array.isArray(row["excerpts"]) ? row["excerpts"] : [];
      const excerpt = excerpts
        .filter((v): v is string => typeof v === "string")
        .join(" ")
        .replace(/\s+/g, " ")
        .slice(0, 700);
      const title =
        typeof row["title"] === "string" && row["title"].trim()
          ? row["title"].trim().slice(0, 180)
          : url.hostname;
      return [{ title, url: url.href, excerpt }];
    })
    .slice(0, 5);
}

/** Keeps only removal targets that exist and are currently in the draft. */
export function validRemovalTargets(indexes: number[], active: Clause[]): Clause[] {
  const seen = new Set<string>();
  const out: Clause[] = [];
  for (const i of indexes) {
    const c = active[i - 1];
    if (c && !seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out.slice(0, 10);
}

/** A clause is in the current draft only if original-and-not-removed, or added-and-approved. */
export function isInDraft(c: Clause): boolean {
  if (c.origin === "original") return !(c.action === "remove" && c.decision === "approved");
  return c.decision === "approved";
}

export function draftClauses(clauses: Clause[]): Clause[] {
  return [...clauses].filter(isInDraft).sort((a, b) => a.position - b.position);
}

export type BadgeTone = "success" | "warning" | "danger" | "neutral";
export function clauseBadge(c: Clause): { label: string; tone: BadgeTone } | null {
  if (c.action === "remove") {
    if (c.decision === "approved") return { label: "Removed", tone: "neutral" };
    if (c.decision === "pending") return { label: "Removal proposed", tone: "neutral" };
  }
  if (c.origin === "added") {
    if (c.decision === "skipped") return { label: "Skipped", tone: "neutral" };
    if (c.verdict === "blocked") return { label: "✕ Cannot be added", tone: "danger" };
    if (c.decision === "approved")
      return c.verdict === "review"
        ? { label: "◑ Added — review", tone: "warning" }
        : { label: "✓ Added", tone: "success" };
    if (c.verdict === "review") return { label: "◑ Can be added — review", tone: "warning" };
    return { label: "Likely allowed · awaiting approval", tone: "neutral" };
  }
  if (c.verdict === "blocked") return { label: "⚠ May be unenforceable", tone: "danger" };
  if (c.verdict === "review") return { label: "◑ Flagged for review", tone: "warning" };
  return null;
}
