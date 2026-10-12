import { describe, expect, it } from "vitest";
import { clauseBadge, draftClauses, normalizeVerdict, sanitizeWording, splitClauses, validRemovalTargets, type Clause } from "@/lib/legal/uploads";

const c = (o: Partial<Clause>): Clause => ({ id: "x", position: 1, heading: "H", body: "B", origin: "original", action: "keep", verdict: "allowed", decision: "none", note: "", ...o });

describe("uploaded templates", () => {
  it("unsure or reasonless verdicts become review", () => {
    expect(normalizeVerdict("maybe", "").verdict).toBe("review");
    expect(normalizeVerdict("blocked", "").verdict).toBe("review");
    expect(normalizeVerdict("blocked", "Unlawful").verdict).toBe("blocked");
  });
  it("never claims legal approval or guaranteed enforceability", () => {
    const out = sanitizeWording("This is legally approved and guaranteed to be enforceable. It is enforceable.");
    expect(out).not.toMatch(/legally approved|guarantee|is enforceable/i);
  });
  it("splits numbered clauses without changing text", () => {
    const parts = splitClauses("1. Parties\nA and B.\n2. Term\nTwo years.");
    expect(parts).toEqual([{ heading: "1. Parties", body: "1. Parties\nA and B." }, { heading: "2. Term", body: "2. Term\nTwo years." }]);
  });
  it("removal targets only existing clauses", () => {
    const a = [c({ id: "a" }), c({ id: "b" })];
    expect(validRemovalTargets([2, 2, 9], a).map((x) => x.id)).toEqual(["b"]);
  });
  it("only approved additions and non-removed originals are in the draft", () => {
    const list = [c({ id: "o" }), c({ id: "r", action: "remove", decision: "approved" }), c({ id: "p", origin: "added", action: "add", decision: "pending" }), c({ id: "y", origin: "added", action: "add", decision: "approved" })];
    expect(draftClauses(list).map((x) => x.id)).toEqual(["o", "y"]);
  });
  it("badges", () => {
    expect(clauseBadge(c({ origin: "added", decision: "approved" }))?.label).toBe("✓ Added");
    expect(clauseBadge(c({ origin: "added", decision: "pending", verdict: "blocked", note: "x" }))?.tone).toBe("danger");
    expect(clauseBadge(c({ origin: "added", decision: "pending", verdict: "review" }))?.label).toBe("◑ Can be added — review");
  });
});
