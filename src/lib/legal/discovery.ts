import { z } from "zod";
import { getDocType } from "./defs";

export const RecommendationInput = z.object({
  recommendations: z.array(z.object({ templateId: z.string(), reason: z.string() })),
});

/** AI choices are data: never accept an unknown template or more than three results. */
export function sanitizeRecommendations(input: unknown) {
  const parsed = RecommendationInput.safeParse(input);
  if (!parsed.success) return [];
  const seen = new Set<string>();
  return parsed.data.recommendations
    .flatMap(({ templateId, reason }) => {
      const doc = getDocType(templateId);
      if (!doc || seen.has(templateId) || !reason.trim()) return [];
      seen.add(templateId);
      return [{ templateId, reason: reason.trim().replace(/\s+/g, " ").slice(0, 240) }];
    })
    .slice(0, 3);
}
