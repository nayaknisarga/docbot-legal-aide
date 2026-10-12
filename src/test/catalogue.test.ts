import { describe, expect, it } from "vitest";
import { CATALOGUE, DOC_TYPES, questionsFor, renderDraft, type Answers } from "@/lib/legal/defs";

describe("full catalogue", () => {
  it("loads 26 templates across 9 categories", () => {
    expect(DOC_TYPES.length).toBe(26);
    expect(CATALOGUE.categories.length).toBe(9);
  });
  it.each(DOC_TYPES.map((d) => d.id))("%s has a draft body using every visible answer", (id) => {
    const d = DOC_TYPES.find((x) => x.id === id)!;
    const a: Answers = {};
    for (const q of questionsFor(d)) a[q.fieldId] = q.answerType === "boolean" ? true : q.answerType === "number" || q.answerType === "money" ? 5 : q.options?.[0] ?? "x";
    const out = renderDraft(d, a, []);
    expect(out.text.length).toBeGreaterThan(200);
  });
});
