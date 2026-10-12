import { describe, expect, it } from "vitest";
import { sanitizeRecommendations } from "../lib/legal/discovery";
import { DOC_TYPES } from "../lib/legal/defs";

describe("homepage recommendations", () => {
  it("returns at most three recommended templates", () => {
    const output = sanitizeRecommendations({
      recommendations: DOC_TYPES.map((d) => ({
        templateId: d.id,
        reason: "Matches your situation",
      })),
    });
    expect(output).toHaveLength(3);
  });
  it("only recommends real catalogue templates", () => {
    expect(
      sanitizeRecommendations({
        recommendations: [
          { templateId: "invented-template", reason: "Not in catalogue" },
          { templateId: "nda-mutual", reason: "Protect shared information" },
        ],
      }),
    ).toEqual([{ templateId: "nda-mutual", reason: "Protect shared information" }]);
  });
  it("supports an honest no-match result", () => {
    expect(sanitizeRecommendations({ recommendations: [] })).toEqual([]);
  });
  it("rejects malformed and duplicate choices", () => {
    expect(sanitizeRecommendations({ recommendations: [{ templateId: "nda-mutual" }] })).toEqual(
      [],
    );
    expect(
      sanitizeRecommendations({
        recommendations: [
          { templateId: "nda-mutual", reason: "Keep information private" },
          { templateId: "nda-mutual", reason: "Duplicate" },
        ],
      }),
    ).toHaveLength(1);
  });
});
