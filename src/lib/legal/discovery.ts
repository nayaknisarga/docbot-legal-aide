import { DOCUMENT_TYPES, getDocumentType } from "./catalog";

export interface Recommendation {
  slug: string;
  reason: string;
}

const STOP = new Set(["i", "a", "the", "to", "and", "my", "me", "for", "of", "need", "want", "is", "with", "an", "in", "on", "who", "it"]);

export function tokenize(text: string) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t));
}

/** Deterministic keyword ranking; used for search and as the assistant fallback. */
export function rankDocuments(query: string, limit = 3): Recommendation[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  return DOCUMENT_TYPES.map((d) => {
    const hay = [...d.keywords, ...tokenize(d.name), ...tokenize(d.description)];
    const hits = tokens.filter((t) => hay.some((k) => k === t || (t.length > 3 && k.startsWith(t))));
    return { d, score: hits.length, hits };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => ({ slug: x.d.slug, reason: `Matches: ${x.hits.slice(0, 3).join(", ")}` }));
}

/** Keep only catalog documents, deduplicated, max 3 — never trust model output for state. */
export function sanitizeRecommendations(recs: unknown): Recommendation[] {
  if (!Array.isArray(recs)) return [];
  const seen = new Set<string>();
  const out: Recommendation[] = [];
  for (const r of recs) {
    if (!r || typeof r !== "object") continue;
    const slug = String((r as Record<string, unknown>)["slug"] ?? "");
    if (!getDocumentType(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, reason: String((r as Record<string, unknown>)["reason"] ?? "").slice(0, 240) });
    if (out.length === 3) break;
  }
  return out;
}
