import { describe, expect, it } from "vitest";
import { getDocType, questionsFor, renderDraft, type Answers } from "@/lib/legal/defs";

const common: Answers = {
  jurisdiction: "India", effective_date: "2026-11-01",
  party_a_name: "Acme Pvt Ltd", party_a_address: "Bengaluru", party_a_signatory: "A. Rao, CEO",
  party_b_name: "Sam Dev", party_b_address: "Mysuru", party_b_signatory: "Sam Dev",
};

const perTemplate: Record<string, Answers> = {
  "nda-mutual": { purpose: "Pilot project", term_years: 2, survival_years: 3 },
  "independent-contractor": { services_description: "Build app", fee_amount: 1000, payment_schedule: "Monthly", creates_ip: true, ip_ownership: "Client owns everything on payment", has_confidentiality: true, survival_years: 2 },
  "employment-offer": { employee_name: "N S", job_title: "Engineer", start_date: "2026-12-01", salary: "12,00,000", employment_type: "Full-time", probation_months: 3, nonsolicit_months: 6 },
  "non-compete": { restricted_activity: "Competing software", geographic_scope: "India", duration_months: 6 },
  "terms-of-service": { company_name: "Acme", website_url: "https://acme.com", service_description: "SaaS", has_accounts: true, has_payments: true, refund_policy: "7 days", collects_personal_data: true, contact_email: "legal@acme.com" },
};

describe("template bodies", () => {
  it.each(Object.keys(perTemplate))("renders %s with no leftover placeholders", (id) => {
    const d = getDocType(id)!;
    const answers = { ...common, ...perTemplate[id] };
    if (id === "non-compete") answers.jurisdiction = "US - Delaware"; // IN non-compete is unsupported
    const out = renderDraft(d, answers, []);
    expect(out.leftovers).toEqual([]);
    expect(out.text.length).toBeGreaterThan(400);
  });
});
