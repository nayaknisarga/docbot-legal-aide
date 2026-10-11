/**
 * DEMO template bodies (not lawyer-reviewed). The catalogue references placeholder
 * files (e.g. 01-mutual-general.md) that were not supplied, so these stand in.
 * Tokens match each question's `mapsTo`; {{#if fieldId}} blocks follow boolean answers.
 */
export const TEMPLATE_BODIES: Record<string, string> = {
  "nda-mutual": `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (this "Agreement") is made and entered into as of {{date}} (the "Effective Date"), by and between {{party_a_name}}, having its registered office at {{party_a_address}} ("Party A"), and {{party_b_name}}, having its registered office at {{party_b_address}} ("Party B") (each a "Party" and together, the "Parties").

1. PURPOSE
The Parties wish to explore, evaluate and/or pursue the following business relationship: {{purpose}} (the "Purpose"). Each Party may disclose certain Confidential Information to the other in connection with the Purpose.

2. DEFINITION OF CONFIDENTIAL INFORMATION
For purposes of this Agreement, "Confidential Information" means any non-public information, whether disclosed orally, in writing, or in any other form, that is designated as confidential or that, given the nature of the information and the circumstances of disclosure, a reasonable person would understand to be confidential, including without limitation business plans, technical data, financial information, product designs, customer and supplier lists, and know-how. Confidential Information does not include information that: (a) is or becomes publicly available through no breach of this Agreement; (b) was lawfully in the recipient's possession prior to disclosure; (c) is received from a third party free of any obligation of confidence; or (d) is independently developed without use of or reference to the disclosing Party's Confidential Information.

3. OBLIGATIONS OF THE PARTIES
Each Party shall: (a) use the other Party's Confidential Information solely for the Purpose; (b) not disclose such Confidential Information to any third party without the prior written consent of the disclosing Party; (c) protect the Confidential Information using at least the same degree of care it applies to its own confidential information, and in no event less than reasonable care; and (d) limit access to Confidential Information to those of its employees, officers, and professional advisers who have a need to know it for the Purpose and who are bound by confidentiality obligations no less protective than those set out in this Agreement. Each Party shall remain liable for any breach of this Agreement by its personnel.

4. TERM AND SURVIVAL
This Agreement shall commence on the Effective Date and remain in force for a period of {{term}} year(s) unless terminated earlier by either Party upon written notice to the other. The obligations of confidentiality with respect to any Confidential Information disclosed under this Agreement shall survive the expiration or earlier termination of this Agreement for a period of {{survival}} year(s).

5. NO LICENCE OR OTHER RIGHTS
Nothing in this Agreement grants either Party any licence, assignment, or other rights of any kind in or to the other Party's Confidential Information or intellectual property.

6. RETURN OF MATERIALS
Upon the written request of the disclosing Party, the receiving Party shall promptly return or destroy all Confidential Information of the disclosing Party in its possession or control, except for one copy retained solely as required by applicable law or for archival purposes.

7. NO WARRANTY
All Confidential Information is provided "as is". Neither Party makes any representation or warranty, express or implied, as to the accuracy or completeness of the Confidential Information it discloses.

8. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of {{jurisdiction}}, and the Parties submit to the exclusive jurisdiction of the courts of {{jurisdiction}} in respect of any dispute arising out of or in connection with this Agreement.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

For and on behalf of {{party_a_name}}:  ____________________  {{party_a_signatory}}
For and on behalf of {{party_b_name}}:  ____________________  {{party_b_signatory}}`,

  "independent-contractor": `INDEPENDENT CONTRACTOR AGREEMENT

This Independent Contractor Agreement (this "Agreement") is made and entered into as of {{date}} (the "Effective Date"), by and between {{party_a_name}}, having its registered office at {{party_a_address}} (the "Client"), and {{party_b_name}}, of {{party_b_address}} (the "Contractor").

1. SERVICES
The Client hereby engages the Contractor, and the Contractor hereby agrees to perform, the following services: {{project}} (the "Services"). The Contractor shall perform the Services in a professional and workmanlike manner, consistent with generally accepted industry standards.

2. INDEPENDENT CONTRACTOR STATUS
The Contractor is an independent contractor and not an employee, agent, partner, or joint venturer of the Client. Nothing in this Agreement shall be construed as creating an employment relationship. The Contractor shall be solely responsible for all taxes, statutory contributions, insurance, and other obligations arising from the compensation paid under this Agreement, and is not entitled to any employee benefits from the Client.

3. FEES AND PAYMENT
The Client shall pay the Contractor a fee of {{fee}} for the Services (the "Fee"), payable as follows: {{payment_schedule}}. The Client shall pay each invoice within the period stated in the invoice or, absent such a statement, within thirty (30) days of receipt.

4. SUBCONTRACTING
The Contractor shall not subcontract any of the Services without the Client's prior written consent. The Contractor remains fully responsible for the acts and omissions of any approved subcontractor.

5. TERMINATION
Either Party may terminate this Agreement upon written notice to the other. The Client shall pay the Contractor for Services properly performed up to the effective date of termination.

{{#if creates_ip}}
6. INTELLECTUAL PROPERTY
Ownership of all deliverables and intellectual property created by the Contractor in the course of performing the Services shall be governed as follows: {{ip_terms}}. To the extent required to give effect to the foregoing, the Contractor shall execute such further documents as the Client may reasonably request.
{{/if}}
{{#if has_confidentiality}}
7. CONFIDENTIALITY
The Contractor shall hold in strict confidence all confidential information of the Client disclosed in connection with this Agreement, shall use it only for the purpose of performing the Services, and shall not disclose it to any third party. This obligation survives the termination or expiry of this Agreement for a period of {{survival}} year(s).
{{/if}}
8. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of {{jurisdiction}}, and the Parties submit to the exclusive jurisdiction of the courts of {{jurisdiction}}.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

For and on behalf of the Client:      ____________________  {{party_a_signatory}}
The Contractor:                        ____________________  {{party_b_signatory}}`,

  "employment-offer": `OFFER OF EMPLOYMENT

Date: {{date}}

Dear {{employee_name}},

We are pleased to confirm our offer of employment to you. {{party_a_name}} (the "Company") is pleased to offer you the position of {{job_title}} on a {{employment_type}} basis, with your employment commencing on {{start_date}} (the "Start Date").

1. COMPENSATION
Your annual compensation will be {{salary}}, payable in accordance with the Company's standard payroll practices and subject to applicable deductions and withholdings.

2. PROBATIONARY PERIOD
Your employment will be subject to a probationary period of {{probation}} month(s), during which the Company will assess your suitability for the role. Employment during or after the probationary period remains at the Company's discretion and subject to continued satisfactory performance.

3. NON-SOLICITATION
For a period of {{nonsolicit}} month(s) following the termination of your employment for any reason, you agree not to directly or indirectly solicit, entice away, or seek to entice away any employee, officer, or client of the Company with whom you dealt during your employment.

4. CONDITIONS OF OFFER
This offer is contingent upon execution of a formal employment contract, satisfactory completion of any background checks reasonably required by the Company, and your eligibility to work in the applicable jurisdiction.

5. GOVERNING LAW
This offer and the terms of your employment shall be governed by the laws of {{jurisdiction}}.

6. ACCEPTANCE
This offer will remain open for a period of seven (7) days from the date of this letter unless withdrawn earlier by the Company. If the terms are acceptable to you, please indicate your acceptance by signing and returning this letter.

We look forward to welcoming you to the Company.

Sincerely,

____________________  {{party_a_signatory}}
for and on behalf of {{party_a_name}}

Accepted and agreed:

____________________  {{employee_name}}`,

  "non-compete": `NON-COMPETITION AGREEMENT

This Non-Competition Agreement (this "Agreement") is made and entered into as of {{date}} (the "Effective Date"), by and between {{party_a_name}} (the "Company"), and {{party_b_name}} (the "Restricted Party").

1. RESTRICTED ACTIVITY
During the Restricted Period, the Restricted Party shall not, directly or indirectly, whether for the Restricted Party's own account or on behalf of any other person or entity, engage in the following activity: {{restricted_activity}}.

2. SCOPE AND DURATION
The restrictions set out in this Agreement apply within the following geographic area: {{geo_scope}}, and shall remain in force for a period of {{duration}} month(s) from the Effective Date (the "Restricted Period").

3. CONSIDERATION
The Company's provision of access to confidential information, client relationships, and/or other business interests constitutes sufficient and adequate consideration for the covenants set out in this Agreement.

4. ACKNOWLEDGEMENT
The Restricted Party acknowledges that the covenants in this Agreement are reasonable in scope, geography, and duration for the protection of the Company's legitimate business interests, and that any breach will cause the Company irreparable harm for which monetary damages would be an inadequate remedy.

5. REMEDIES
In the event of any actual or threatened breach of this Agreement, the Company shall be entitled to seek injunctive relief in addition to any other remedies available at law or in equity.

6. SEVERABILITY
If any provision of this Agreement is held to be invalid or unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.

7. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of {{jurisdiction}}, and the Parties submit to the exclusive jurisdiction of the courts of {{jurisdiction}}.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

For and on behalf of the Company:  ____________________  {{party_a_name}}
The Restricted Party:               ____________________  {{party_b_name}}`,

  "terms-of-service": `TERMS OF SERVICE

Effective date: {{date}}

These Terms of Service (these "Terms") govern your access to and use of {{website_url}} (the "Service"), operated by {{company_name}} ("we", "us", or "our"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.

1. THE SERVICE
We provide the following service: {{service_description}}. We may modify, suspend, or discontinue any part of the Service at any time, with or without notice, and shall not be liable to you for doing so.

2. ELIGIBILITY
You represent that you have the legal capacity to enter into these Terms and that your use of the Service complies with all applicable laws and regulations.

{{#if has_accounts}}
3. ACCOUNTS
You may be required to register an account to access certain features of the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us promptly of any unauthorised use of your account.
{{/if}}
{{#if has_payments}}
4. FEES, PAYMENTS AND REFUNDS
Any applicable fees will be presented to you before you complete a purchase. Our refund policy is as follows: {{refund_policy}}.
{{/if}}
{{#if collects_personal_data}}
5. PERSONAL DATA AND PRIVACY
We collect and process personal data as described in our Privacy Policy, which forms part of these Terms. You consent to such collection, use, and processing by using the Service.
{{/if}}
6. ACCEPTABLE USE
You agree not to: (a) use the Service for any unlawful purpose; (b) interfere with or disrupt the operation of the Service; (c) attempt to gain unauthorised access to any part of the Service or related systems; or (d) use the Service to infringe the rights of any third party.

7. INTELLECTUAL PROPERTY
All content, trademarks, software, and other intellectual property comprising or made available through the Service are owned by us or our licensors and are protected by applicable intellectual property laws. No rights are granted to you other than those expressly stated in these Terms.

8. DISCLAIMER OF WARRANTIES
The Service is provided "as is" and "as available", without warranties of any kind, whether express or implied, including any implied warranties of merchantability, fitness for a particular purpose, or non-infringement.

9. LIMITATION OF LIABILITY
To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising out of or in connection with your use of the Service.

10. TERMINATION
We may suspend or terminate your access to the Service at any time for actual or suspected breach of these Terms, and these Terms will terminate automatically if you cease to use the Service, except for provisions which by their nature survive termination.

11. CHANGES TO THESE TERMS
We may update these Terms from time to time. The current version will always be posted on the Service, and continued use of the Service after changes take effect constitutes acceptance of the updated Terms.

12. GOVERNING LAW
These Terms shall be governed by and construed in accordance with the laws of {{jurisdiction}}.

13. CONTACT
Legal notices and questions regarding these Terms may be directed to: {{contact_email}}`,
};
