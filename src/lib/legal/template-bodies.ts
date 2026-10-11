/**
 * DEMO template bodies (not lawyer-reviewed). The catalogue references placeholder
 * files (e.g. 01-mutual-general.md) that were not supplied, so these stand in.
 * Tokens match each question's `mapsTo`; {{#if fieldId}} blocks follow boolean answers.
 */
export const TEMPLATE_BODIES: Record<string, string> = {
  "nda-mutual": `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement is made on {{date}} between {{party_a_name}}, of {{party_a_address}} ("Party A"), and {{party_b_name}}, of {{party_b_address}} ("Party B").

1. PURPOSE
The parties wish to share confidential information solely for: {{purpose}} (the "Purpose").

2. CONFIDENTIAL INFORMATION
"Confidential Information" means non-public information disclosed by one party to the other that is marked confidential or would reasonably be understood to be confidential.

3. OBLIGATIONS
Each party shall use the other's Confidential Information only for the Purpose and shall not disclose it except to personnel and advisers who need to know it and are bound by similar duties.

4. TERM
This Agreement lasts {{term}} year(s). Confidentiality obligations survive for {{survival}} year(s) after it ends.

5. GOVERNING LAW
This Agreement is governed by the laws of {{jurisdiction}}.

Signed for Party A: ____________________  {{party_a_signatory}}
Signed for Party B: ____________________  {{party_b_signatory}}`,

  "independent-contractor": `INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is made on {{date}} between {{party_a_name}}, of {{party_a_address}} ("Client"), and {{party_b_name}}, of {{party_b_address}} ("Contractor").

1. SERVICES
The Contractor will perform: {{project}}.

2. FEES
The Client will pay {{fee}}, payable as follows: {{payment_schedule}}.

3. INDEPENDENT CONTRACTOR
The Contractor is not an employee of the Client and is responsible for their own taxes.
{{#if creates_ip}}
4. INTELLECTUAL PROPERTY
{{ip_terms}}.
{{/if}}{{#if has_confidentiality}}
5. CONFIDENTIALITY
The Contractor shall keep the Client's confidential information private during the engagement and for {{survival}} year(s) after it ends.
{{/if}}
GOVERNING LAW
This Agreement is governed by the laws of {{jurisdiction}}.

Signed for Client: ____________________  {{party_a_signatory}}
Signed for Contractor: ____________________  {{party_b_signatory}}`,

  "employment-offer": `OFFER OF EMPLOYMENT

Date: {{date}}

Dear {{employee_name}},

{{party_a_name}} is pleased to offer you the position of {{job_title}} ({{employment_type}}), starting on {{start_date}}.

COMPENSATION: {{salary}} per year.
PROBATION: {{probation}} month(s).
NON-SOLICITATION: For {{nonsolicit}} month(s) after leaving, you agree not to solicit the company's employees or clients.

This offer is subject to a formal employment contract and is governed by the laws of {{jurisdiction}}.

Sincerely,
{{party_a_signatory}}
for {{party_a_name}}`,

  "non-compete": `NON-COMPETITION AGREEMENT

This Agreement is made on {{date}} between {{party_a_name}} (the "Company") and {{party_b_name}} (the "Restricted Party").

1. RESTRICTION
The Restricted Party shall not engage in the following activity: {{restricted_activity}}.

2. SCOPE
This restriction applies within {{geo_scope}} for {{duration}} month(s).

3. GOVERNING LAW
This Agreement is governed by the laws of {{jurisdiction}}.

Signed: ____________________  {{party_a_name}}
Signed: ____________________  {{party_b_name}}`,

  "terms-of-service": `TERMS OF SERVICE

Effective date: {{date}}

These Terms govern your use of {{website_url}}, operated by {{company_name}} ("we").

1. THE SERVICE
{{service_description}}
{{#if has_accounts}}
2. ACCOUNTS
You are responsible for keeping your account credentials secure and for all activity under your account.
{{/if}}{{#if has_payments}}
3. PAYMENTS AND REFUNDS
Fees are shown before purchase. Refund policy: {{refund_policy}}
{{/if}}{{#if collects_personal_data}}
4. PERSONAL DATA
We collect and use personal data as described in our Privacy Policy.
{{/if}}
GOVERNING LAW
These Terms are governed by the laws of {{jurisdiction}}.

CONTACT
Legal notices: {{contact_email}}`,
};
