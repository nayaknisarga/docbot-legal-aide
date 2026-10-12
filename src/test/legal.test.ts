import { describe, expect, it } from "vitest";
import { coerceAnswer, consistencyIssues, getDocType, nextQuestion, questionsFor, rankDocTypes, renderDraft, validateAll, DISCLAIMER, type Answers } from "@/lib/legal/defs";

const contractor = getDocType("independent-contractor")!;
const nda = getDocType("nda-mutual")!;
const base: Answers = {
  jurisdiction: "India", effective_date: "2026-11-01", party_a_name: "Acme Pvt Ltd", party_a_address: "Bengaluru", party_a_signatory: "A. Rao, CEO",
  party_b_name: "Sam Dev", party_b_address: "Mysuru", party_b_signatory: "Sam Dev",
};

describe("catalogue", () => {
  it("loads templates from template_definitions.json", () => {
    expect(questionsFor(nda)[0]?.fieldId).toBe("jurisdiction");
    expect(getDocType("terms-of-service")).toBeDefined();
  });
});

describe("questionnaire", () => {
  it("asks common questions first, then the template's own", () => {
    expect(nextQuestion(contractor, {})?.fieldId).toBe("jurisdiction");
    expect(nextQuestion(contractor, base)?.fieldId).toBe("services_description");
  });
  it("hides ip_ownership unless creates_ip is yes", () => {
    const a = { ...base, services_description: "Build app", fee_amount: 1000, payment_schedule: "Monthly", creates_ip: false, has_confidentiality: false };
    expect(validateAll(contractor, a).missing).not.toContain("ip_ownership");
    expect(validateAll(contractor, { ...a, creates_ip: true }).missing).toContain("ip_ownership");
  });
  it("rejects select values outside the options", () => {
    const q = questionsFor(contractor).find((x) => x.fieldId === "payment_schedule")!;
    expect(coerceAnswer(q, "whenever").ok).toBe(false);
    expect(coerceAnswer(q, "monthly")).toEqual({ ok: true, value: "Monthly" });
  });
  it("blocks past start dates on offer letters", () => {
    const q = questionsFor(getDocType("employment-offer")!).find((x) => x.fieldId === "start_date")!;
    expect(coerceAnswer(q, "2020-01-01", new Date("2026-10-11")).ok).toBe(false);
  });
  it("flags identical parties as a conflict", () => {
    expect(validateAll(nda, { ...base, party_b_name: "acme pvt ltd" }).conflicts.length).toBe(1);
  });
});

describe("jurisdiction guard", () => {
  it("marks non-compete under Indian law unsupported with the s.27 warning", () => {
    const v = validateAll(getDocType("non-compete")!, { jurisdiction: "India" });
    expect(v.jurisdiction.supported).toBe(false);
    expect(v.jurisdiction.warning).toMatch(/s\.27|Section 27/);
  });
  it("marks UK unsupported everywhere", () => {
    expect(validateAll(nda, { jurisdiction: "United Kingdom" }).jurisdiction.supported).toBe(false);
  });
});

describe("draft generation", () => {
  const full = { ...base, purpose: "Exploring a pilot", term_years: 2, survival_years: 3 };
  it("always injects the disclaimer and fills tokens", () => {
    const d = renderDraft(nda, full, []);
    expect(d.text.startsWith(DISCLAIMER)).toBe(true);
    expect(d.text).toContain("Exploring a pilot");
    expect(d.leftovers).toEqual([]);
  });
  it("includes only APPROVED clauses, never proposed ones", () => {
    const d = renderDraft(nda, full, [
      { id: "1", title: "Proposed one", body: "PPP", status: "proposed" },
      { id: "2", title: "Approved one", body: "AAA", status: "approved" },
    ]);
    expect(d.text).toContain("AAA");
    expect(d.text).not.toContain("PPP");
  });
  it("reports leftover placeholders when answers are missing", () => {
    expect(renderDraft(nda, base, []).leftovers).toContain("purpose");
  });
});

describe("agent helpers", () => {
  it("recommends at most 3 documents", () => {
    const r = rankDocTypes("hire a freelance developer for my website app", "IN");
    expect(r.length).toBeLessThanOrEqual(3);
    expect(r[0]?.id).toBe("independent-contractor");
  });
  it("flags an approved non-compete under Indian law", () => {
    const issues = consistencyIssues(nda, { jurisdiction: "India" }, [{ id: "x", title: "Non-compete", body: "No competing", status: "approved" }]);
    expect(issues.some((i) => /India/.test(i))).toBe(true);
  });
});
