import type { Category, DocumentType, FieldDefinition, Jurisdiction } from "./types";

/**
 * DEMO SEED CONTENT. None of these templates have been reviewed by a lawyer.
 * Production-approved content must be loaded separately with reviewStatus "approved".
 */

export const CATEGORIES: Category[] = [
  { slug: "property", name: "Property", description: "Renting, leasing and selling property", children: ["Residential lease", "Commercial lease", "Sale agreement", "Notice to vacate"] },
  { slug: "freelancing", name: "Freelancing", description: "Working with clients as an independent", children: ["Service agreement", "Statement of work", "Invoice terms"] },
  { slug: "employment", name: "Employment", description: "Hiring and working relationships", children: ["Offer letter", "Employment contract", "Resignation letter"] },
  { slug: "business", name: "Business", description: "Founders, partners and companies", children: ["NDA", "Partnership deed", "Shareholder agreement"] },
  { slug: "technology-ip", name: "Technology & IP", description: "Software, licences and ownership of work", children: ["NDA", "IP assignment", "Software licence"] },
  { slug: "finance-commercial", name: "Finance & Commercial", description: "Loans, supply and commercial deals", children: ["Loan agreement", "Supply agreement"] },
  { slug: "family-personal", name: "Family & Personal", description: "Personal and family arrangements", children: ["Affidavit", "Power of attorney", "Will"] },
  { slug: "disputes-notices", name: "Disputes & Notices", description: "Demand letters and formal notices", children: ["Payment demand", "Legal notice"] },
  { slug: "privacy-compliance", name: "Privacy & Compliance", description: "Policies for websites and apps", children: ["Privacy notice", "Terms of use", "Cookie policy"] },
  { slug: "procurement-trade", name: "Procurement & Trade", description: "Buying, selling and import/export", children: ["Purchase order terms", "Distribution agreement"] },
  { slug: "consumer-insurance", name: "Consumer & Insurance", description: "Complaints and claims", children: ["Consumer complaint", "Insurance claim letter"] },
  { slug: "general", name: "General / Other", description: "Anything else", children: ["General agreement", "Letter"] },
];

export const JURISDICTIONS: Jurisdiction[] = [
  { code: "IN", name: "India", support: "limited", note: "Demo template only. No reviewed Indian legal sources are loaded." },
  { code: "US", name: "United States (general)", support: "limited", note: "Demo template only. State law varies and is not covered." },
  { code: "GB", name: "United Kingdom (England & Wales)", support: "limited", note: "Demo template only. No reviewed UK legal sources are loaded." },
  { code: "OTHER", name: "Other / not listed", support: "unsupported", note: "We don't cover this jurisdiction yet. Please consult a local lawyer." },
];

const ALL_J = ["IN", "US", "GB"];

const you: FieldDefinition[] = [
  { id: "your_name", label: "Your full name (or company name)", type: "text", required: true, group: "common", reusable: true, validation: { minLength: 2 } },
  { id: "your_address", label: "Your address", type: "textarea", required: true, group: "common", reusable: true },
  { id: "your_email", label: "Your email", type: "email", required: false, group: "common", reusable: true },
];

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    slug: "mutual-nda",
    name: "Mutual Non-Disclosure Agreement",
    description: "Both sides agree to keep shared confidential information private.",
    categories: ["business", "technology-ip"],
    keywords: ["nda", "confidential", "confidentiality", "secret", "non-disclosure", "idea", "share", "pitch", "investor", "partner", "discuss"],
    riskLevel: "low",
    jurisdictions: ALL_J,
    template: {
      version: 1,
      reviewStatus: "demo_unreviewed",
      title: "MUTUAL NON-DISCLOSURE AGREEMENT",
      body: `This Mutual Non-Disclosure Agreement ("Agreement") is made on {{effective_date}} between {{your_name}}, of {{your_address}} ("Party A"), and {{other_party_name}}, of {{other_party_address}} ("Party B").

1. PURPOSE
The parties wish to share confidential information for the purpose of: {{purpose}}.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by one party to the other, whether oral, written or electronic, that is marked confidential or would reasonably be understood to be confidential.

3. OBLIGATIONS
Each party shall use the other's Confidential Information only for the Purpose, and shall not disclose it to any third party except to its employees or advisers who need to know it and are bound by similar obligations.

4. TERM
The obligations in this Agreement continue for {{term_years}} year(s) from the date of this Agreement.
{{#if include_non_solicit}}
5. NON-SOLICITATION
For the term of this Agreement, neither party shall solicit the employees of the other party.
{{/if}}
GOVERNING LAW
This Agreement is governed by the laws of {{jurisdiction_name}}.

Signed: ____________________  {{your_name}}

Signed: ____________________  {{other_party_name}}`,
    },
    fields: [
      ...you,
      { id: "other_party_name", label: "Other party's name", type: "text", required: true, group: "specific" },
      { id: "other_party_address", label: "Other party's address", type: "textarea", required: true, group: "specific" },
      { id: "effective_date", label: "Effective date", type: "date", required: true, group: "specific" },
      { id: "purpose", label: "Why are you sharing information?", help: "e.g. evaluating a possible partnership", type: "textarea", required: true, group: "specific", validation: { minLength: 10 } },
      { id: "term_years", label: "How many years should confidentiality last?", type: "number", required: true, group: "specific", validation: { min: 1, max: 10 } },
      { id: "include_non_solicit", label: "Stop each side from poaching the other's employees?", type: "boolean", required: false, group: "specific" },
    ],
    crossChecks: [{ kind: "notEqual", field: "other_party_name", other: "your_name", message: "The other party must be different from you." }],
  },
  {
    slug: "freelance-services-agreement",
    name: "Freelance Services Agreement",
    description: "Sets out the work, payment and ownership between a freelancer and a client.",
    categories: ["freelancing", "technology-ip"],
    keywords: ["freelance", "freelancer", "client", "contractor", "project", "design", "developer", "services", "gig", "consulting", "consultant", "website", "work"],
    riskLevel: "medium",
    jurisdictions: ALL_J,
    template: {
      version: 1,
      reviewStatus: "demo_unreviewed",
      title: "FREELANCE SERVICES AGREEMENT",
      body: `This Agreement is made on {{start_date}} between {{client_name}} ("Client") and {{your_name}}, of {{your_address}} ("Freelancer").

1. SERVICES
The Freelancer will provide the following services: {{services}}.

2. TIMELINE
Work begins on {{start_date}} and is expected to be completed by {{end_date}}.

3. FEES
{{#if fee_type=Fixed fee}}The Client will pay a fixed fee of {{currency}} {{fee_amount}} for the Services.{{/if}}{{#if fee_type=Hourly}}The Client will pay {{currency}} {{fee_amount}} per hour, invoiced {{invoice_frequency}}.{{/if}}
Invoices are payable within {{payment_days}} days of receipt.
{{#if deposit_required}}
4. DEPOSIT
The Client will pay a non-refundable deposit of {{currency}} {{deposit_amount}} before work begins.
{{/if}}
INTELLECTUAL PROPERTY
{{#if ip_owner=Client after full payment}}Ownership of the deliverables transfers to the Client once all fees are paid in full.{{/if}}{{#if ip_owner=Freelancer keeps ownership (licence to client)}}The Freelancer keeps ownership of the deliverables and grants the Client a non-exclusive licence to use them.{{/if}}

INDEPENDENT CONTRACTOR
The Freelancer is an independent contractor and not an employee of the Client.

GOVERNING LAW
This Agreement is governed by the laws of {{jurisdiction_name}}.

Signed: ____________________  {{client_name}}

Signed: ____________________  {{your_name}}`,
    },
    fields: [
      ...you,
      { id: "client_name", label: "Client's name", type: "text", required: true, group: "specific" },
      { id: "services", label: "What work will you do?", type: "textarea", required: true, group: "specific", validation: { minLength: 10 } },
      { id: "start_date", label: "Start date", type: "date", required: true, group: "specific" },
      { id: "end_date", label: "Expected completion date", type: "date", required: true, group: "specific" },
      { id: "currency", label: "Currency", type: "select", required: true, group: "specific", options: ["INR", "USD", "GBP", "EUR"] },
      { id: "fee_type", label: "How will you charge?", type: "select", required: true, group: "specific", options: ["Fixed fee", "Hourly"] },
      { id: "fee_amount", label: "Amount (fixed total or hourly rate)", type: "number", required: true, group: "specific", validation: { min: 1 } },
      { id: "invoice_frequency", label: "How often will you invoice?", type: "select", required: true, group: "conditional", options: ["weekly", "monthly"], showIf: { field: "fee_type", equals: "Hourly" } },
      { id: "payment_days", label: "Days the client has to pay an invoice", type: "number", required: true, group: "specific", validation: { min: 1, max: 120 } },
      { id: "deposit_required", label: "Require a deposit up front?", type: "boolean", required: false, group: "specific" },
      { id: "deposit_amount", label: "Deposit amount", type: "number", required: true, group: "conditional", showIf: { field: "deposit_required", equals: true }, validation: { min: 1 } },
      { id: "ip_owner", label: "Who owns the finished work?", type: "select", required: true, group: "specific", options: ["Client after full payment", "Freelancer keeps ownership (licence to client)"] },
    ],
    crossChecks: [{ kind: "dateAfter", field: "end_date", after: "start_date", message: "Completion date must be after the start date." }],
  },
  {
    slug: "residential-lease",
    name: "Residential Lease Agreement",
    description: "Rent a home or flat to a tenant for a fixed period.",
    categories: ["property"],
    keywords: ["rent", "lease", "tenant", "landlord", "flat", "apartment", "house", "property", "renting", "rental", "room"],
    riskLevel: "high",
    riskNote: "Tenancy law is heavily regulated and varies locally (registration, stamp duty, deposit caps, eviction rules). Have a local lawyer review before signing.",
    jurisdictions: ALL_J,
    template: {
      version: 1,
      reviewStatus: "demo_unreviewed",
      title: "RESIDENTIAL LEASE AGREEMENT",
      body: `This Lease is made on {{start_date}} between {{your_name}}, of {{your_address}} ("Landlord"), and {{tenant_name}} ("Tenant").

1. PROPERTY
The Landlord lets to the Tenant the property at: {{property_address}}.

2. TERM
The lease runs for {{term_months}} months starting {{start_date}}.

3. RENT
The Tenant will pay rent of {{currency}} {{monthly_rent}} per month, due on day {{rent_due_day}} of each month.

4. SECURITY DEPOSIT
The Tenant will pay a security deposit of {{currency}} {{deposit}}, refundable at the end of the lease less any lawful deductions.
{{#if furnished}}
5. FURNISHINGS
The property is let furnished. An inventory will be signed by both parties at the start of the lease.
{{/if}}
{{#if pets_allowed}}
PETS
The Tenant may keep pets at the property, and is responsible for any damage they cause.
{{/if}}
GOVERNING LAW
This Lease is governed by the laws of {{jurisdiction_name}}.

Signed: ____________________  {{your_name}} (Landlord)

Signed: ____________________  {{tenant_name}} (Tenant)`,
    },
    fields: [
      ...you,
      { id: "tenant_name", label: "Tenant's full name", type: "text", required: true, group: "specific" },
      { id: "property_address", label: "Address of the property being rented", type: "textarea", required: true, group: "specific" },
      { id: "start_date", label: "Lease start date", type: "date", required: true, group: "specific" },
      { id: "term_months", label: "Length of lease (months)", type: "number", required: true, group: "specific", validation: { min: 1, max: 120 } },
      { id: "currency", label: "Currency", type: "select", required: true, group: "specific", options: ["INR", "USD", "GBP", "EUR"] },
      { id: "monthly_rent", label: "Monthly rent", type: "number", required: true, group: "specific", validation: { min: 1 } },
      { id: "rent_due_day", label: "Day of month rent is due", type: "number", required: true, group: "specific", validation: { min: 1, max: 28 } },
      { id: "deposit", label: "Security deposit", type: "number", required: true, group: "specific", validation: { min: 0 } },
      { id: "furnished", label: "Is the property furnished?", type: "boolean", required: false, group: "specific" },
      { id: "pets_allowed", label: "Are pets allowed?", type: "boolean", required: false, group: "specific" },
    ],
    crossChecks: [{ kind: "notEqual", field: "tenant_name", other: "your_name", message: "Tenant must be different from the landlord." }],
  },
  {
    slug: "payment-demand-letter",
    name: "Payment Demand Letter",
    description: "Formally ask someone to pay money they owe you before taking further action.",
    categories: ["disputes-notices", "freelancing", "finance-commercial"],
    keywords: ["owe", "owes", "unpaid", "payment", "demand", "invoice", "overdue", "recover", "money", "debt", "pay", "notice", "dues"],
    riskLevel: "medium",
    riskNote: "If you plan to go to court, check local limitation periods and notice requirements first.",
    jurisdictions: ALL_J,
    template: {
      version: 1,
      reviewStatus: "demo_unreviewed",
      title: "DEMAND FOR PAYMENT",
      body: `{{letter_date}}

From: {{your_name}}
{{your_address}}

To: {{debtor_name}}
{{debtor_address}}

Dear {{debtor_name}},

RE: OUTSTANDING PAYMENT OF {{currency}} {{amount_owed}}

You owe me {{currency}} {{amount_owed}} in respect of {{reason}}. This amount was due on {{due_date}} and remains unpaid.

I request that you pay the full amount within {{deadline_days}} days of the date of this letter.
{{#if mention_next_steps}}
If payment is not received by then, I may take further steps to recover the amount, which may include seeking legal advice.
{{/if}}
Yours sincerely,

{{your_name}}`,
    },
    fields: [
      ...you,
      { id: "debtor_name", label: "Who owes you money?", type: "text", required: true, group: "specific" },
      { id: "debtor_address", label: "Their address", type: "textarea", required: true, group: "specific" },
      { id: "currency", label: "Currency", type: "select", required: true, group: "specific", options: ["INR", "USD", "GBP", "EUR"] },
      { id: "amount_owed", label: "Amount owed", type: "number", required: true, group: "specific", validation: { min: 1 } },
      { id: "reason", label: "What is the payment for?", type: "textarea", required: true, group: "specific" },
      { id: "due_date", label: "When was it due?", type: "date", required: true, group: "specific" },
      { id: "letter_date", label: "Date of this letter", type: "date", required: true, group: "specific" },
      { id: "deadline_days", label: "Days to pay", type: "number", required: true, group: "specific", validation: { min: 1, max: 60 } },
      { id: "mention_next_steps", label: "Mention that you may take further steps?", type: "boolean", required: false, group: "specific" },
    ],
    crossChecks: [{ kind: "dateAfter", field: "letter_date", after: "due_date", message: "The letter date should be after the payment due date." }],
  },
  {
    slug: "employment-offer-letter",
    name: "Employment Offer Letter",
    description: "Offer a job to a candidate with role, pay and start date.",
    categories: ["employment"],
    keywords: ["hire", "hiring", "offer", "job", "employee", "candidate", "salary", "employment", "recruit", "staff", "join"],
    riskLevel: "medium",
    jurisdictions: ALL_J,
    template: {
      version: 1,
      reviewStatus: "demo_unreviewed",
      title: "OFFER OF EMPLOYMENT",
      body: `{{offer_date}}

Dear {{candidate_name}},

{{your_name}} is pleased to offer you the position of {{job_title}}.

START DATE: {{start_date}}
EMPLOYMENT TYPE: {{employment_type}}
SALARY: {{currency}} {{annual_salary}} per year, paid monthly.
{{#if probation}}
PROBATION: Your employment is subject to a probation period of {{probation_months}} months.
{{/if}}
This offer is subject to the terms of a formal employment contract. Please confirm your acceptance by {{accept_by}}.

Sincerely,

{{your_name}}
{{your_address}}`,
    },
    fields: [
      ...you,
      { id: "candidate_name", label: "Candidate's name", type: "text", required: true, group: "specific" },
      { id: "job_title", label: "Job title", type: "text", required: true, group: "specific" },
      { id: "employment_type", label: "Employment type", type: "select", required: true, group: "specific", options: ["Full-time", "Part-time", "Fixed-term"] },
      { id: "currency", label: "Currency", type: "select", required: true, group: "specific", options: ["INR", "USD", "GBP", "EUR"] },
      { id: "annual_salary", label: "Annual salary", type: "number", required: true, group: "specific", validation: { min: 1 } },
      { id: "offer_date", label: "Date of offer", type: "date", required: true, group: "specific" },
      { id: "start_date", label: "Start date", type: "date", required: true, group: "specific" },
      { id: "accept_by", label: "Accept by", type: "date", required: true, group: "specific" },
      { id: "probation", label: "Include a probation period?", type: "boolean", required: false, group: "specific" },
      { id: "probation_months", label: "Probation length (months)", type: "number", required: true, group: "conditional", showIf: { field: "probation", equals: true }, validation: { min: 1, max: 12 } },
    ],
    crossChecks: [
      { kind: "dateAfter", field: "start_date", after: "offer_date", message: "Start date must be after the offer date." },
      { kind: "dateAfter", field: "accept_by", after: "offer_date", message: "Acceptance deadline must be after the offer date." },
    ],
  },
  {
    slug: "website-privacy-notice",
    name: "Website Privacy Notice",
    description: "Tell visitors what personal data your website or app collects and why.",
    categories: ["privacy-compliance", "technology-ip"],
    keywords: ["privacy", "policy", "website", "app", "data", "gdpr", "cookies", "personal", "users", "collect", "dpdp"],
    riskLevel: "medium",
    riskNote: "Data protection laws (GDPR, DPDP Act, CCPA) impose specific disclosures. This demo notice does not ensure compliance.",
    jurisdictions: ALL_J,
    template: {
      version: 1,
      reviewStatus: "demo_unreviewed",
      title: "PRIVACY NOTICE",
      body: `Last updated: {{effective_date}}

{{your_name}} ("we") operates {{site_name}}. This notice explains how we handle personal information.

1. WHAT WE COLLECT
{{data_collected}}

2. WHY WE USE IT
{{purposes}}
{{#if uses_cookies}}
3. COOKIES
We use cookies and similar technologies to operate and improve {{site_name}}.
{{/if}}
{{#if shares_third_parties}}
SHARING
We share personal information with: {{third_parties}}.
{{/if}}
YOUR CHOICES
You can contact us at {{contact_email}} to ask about, correct or delete your information.`,
    },
    fields: [
      ...you,
      { id: "site_name", label: "Website or app name", type: "text", required: true, group: "specific" },
      { id: "effective_date", label: "Effective date", type: "date", required: true, group: "specific" },
      { id: "data_collected", label: "What personal data do you collect?", type: "textarea", required: true, group: "specific" },
      { id: "purposes", label: "Why do you collect it?", type: "textarea", required: true, group: "specific" },
      { id: "contact_email", label: "Privacy contact email", type: "email", required: true, group: "specific" },
      { id: "uses_cookies", label: "Do you use cookies?", type: "boolean", required: false, group: "specific" },
      { id: "shares_third_parties", label: "Do you share data with third parties?", type: "boolean", required: false, group: "specific" },
      { id: "third_parties", label: "Who do you share it with?", type: "textarea", required: true, group: "conditional", showIf: { field: "shares_third_parties", equals: true } },
    ],
  },
];

export function getDocumentType(slug: string) {
  return DOCUMENT_TYPES.find((d) => d.slug === slug);
}
export function getJurisdiction(code: string) {
  return JURISDICTIONS.find((j) => j.code === code);
}
export function documentsInCategory(slug: string) {
  return DOCUMENT_TYPES.filter((d) => d.categories.includes(slug));
}
