import { describe, expect, it } from "vitest";
import { getDocumentType } from "@/lib/legal/catalog";
import { validateSession, visibleFields, prefillFromProfile, pruneHidden } from "@/lib/legal/questionnaire";
import { generateDraft, renderTemplate, GenerationError } from "@/lib/legal/render";
import { rankDocuments, sanitizeRecommendations } from "@/lib/legal/discovery";

const freelance = getDocumentType("freelance-services-agreement")!;
const base = {
  your_name: "Asha Rao", your_address: "Bengaluru", client_name: "Acme Ltd", services: "Design a marketing website",
  start_date: "2026-01-01", end_date: "2026-02-01", currency: "INR", fee_type: "Fixed fee", fee_amount: 50000,
  payment_days: 15, ip_owner: "Client after full payment",
};

describe("questionnaire", () => {
  it("shows invoice frequency only for hourly fees", () => {
    expect(visibleFields(freelance, base).some((f) => f.id === "invoice_frequency")).toBe(false);
    expect(visibleFields(freelance, { ...base, fee_type: "Hourly" }).some((f) => f.id === "invoice_frequency")).toBe(true);
  });
  it("requires deposit amount when deposit is required", () => {
    const v = validateSession(freelance, { ...base, deposit_required: true }, "IN");
    expect(v.missing).toContain("deposit_amount");
    expect(v.ok).toBe(false);
  });
  it("rejects end date before start date", () => {
    const v = validateSession(freelance, { ...base, end_date: "2025-12-01" }, "IN");
    expect(v.crossErrors).toContain("Completion date must be after the start date.");
  });
  it("blocks unsupported jurisdictions", () => {
    expect(validateSession(freelance, base, "OTHER").ok).toBe(false);
    expect(validateSession(freelance, base, "IN").ok).toBe(true);
  });
  it("enforces numeric bounds", () => {
    expect(validateSession(freelance, { ...base, payment_days: 500 }, "IN").fieldErrors["payment_days"]).toBe("Must be at most 120.");
  });
  it("reuses profile answers without overwriting", () => {
    const out = prefillFromProfile(freelance, { your_name: "Kept" }, { your_name: "Old", your_address: "Mysuru" });
    expect(out["your_name"]).toBe("Kept");
    expect(out["your_address"]).toBe("Mysuru");
  });
  it("drops hidden answers", () => {
    expect(pruneHidden(freelance, { ...base, deposit_required: false, deposit_amount: 10 })["deposit_amount"]).toBeUndefined();
  });
});

describe("generation", () => {
  it("renders conditionals and placeholders", () => {
    expect(renderTemplate("A{{#if x}}B{{/if}}{{#if y=Z}}C{{/if}} {{n}}", { x: true, y: "Z" })).toBe("ABC [N]");
  });
  it("generates a draft with demo disclaimer", () => {
    const d = generateDraft(freelance, base, "IN");
    expect(d.body).toContain("fixed fee of INR 50,000");
    expect(d.body).not.toContain("per hour");
    expect(d.disclaimer).toMatch(/NOT REVIEWED BY A LAWYER/);
  });
  it("refuses to generate with missing info", () => {
    expect(() => generateDraft(freelance, { your_name: "x" }, "IN")).toThrow(GenerationError);
  });
});

describe("discovery", () => {
  it("ranks the demand letter for unpaid invoices", () => {
    expect(rankDocuments("client owes me money for an unpaid invoice")[0]?.slug).toBe("payment-demand-letter");
  });
  it("returns at most three", () => {
    expect(rankDocuments("client project website data privacy confidential rent").length).toBeLessThanOrEqual(3);
  });
  it("drops non-catalog and duplicate model recommendations", () => {
    const r = sanitizeRecommendations([{ slug: "fake", reason: "" }, { slug: "mutual-nda", reason: "a" }, { slug: "mutual-nda", reason: "b" }]);
    expect(r).toEqual([{ slug: "mutual-nda", reason: "a" }]);
  });
});
