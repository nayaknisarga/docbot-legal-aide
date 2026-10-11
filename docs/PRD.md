# Product Requirements Document (PRD)
## AI Legal Document Platform — Chatbot, Template Intelligence & Clause Library

**Document status:** Product/engineering draft for implementation planning  
**Version:** 1.0  
**Audience:** Product, design, engineering, QA, security, and legal-content reviewers  
**Primary purpose:** Provide a build-ready specification that can be supplied to Codex as implementation context.

---

## 1. Product vision

Build a guided, AI-assisted legal document platform that helps individuals, freelancers, founders, property owners, employees, and small businesses discover, prepare, review, and manage legal-document drafts without needing to understand legal terminology or begin with a lawyer-written prompt.

The platform supports four entry paths that converge on one document workflow:

1. Browse categories and select a document type.
2. Describe a situation in a chatbot and receive document recommendations.
3. Upload a user's or company's own template and reuse its format.
4. Start from a saved template or previous draft.

The platform must not be merely a general-purpose chatbot. Its differentiation is structured intake, reusable templates, conditional questions, reliable validation, traceable legal knowledge, company-specific template management, clause-level editing, change comparison, and controlled document generation.

**Core principle:** GPT helps interpret and communicate; the application owns workflow state, approved templates, deterministic validation, permissions, document versions, and legal-review status.

## 2. Problem statement

Users often do not know:
- Which legal document matches their situation.
- Which information a document requires.
- Whether an existing company template can be reused.
- Which clauses are missing or conflict with the rest of a document.
- Whether a legal explanation applies to their jurisdiction.
- When a situation is too risky or complex for self-service drafting.

Companies also have existing document formats, standard clauses, and internal policies. Recreating each template and questionnaire manually is expensive and does not scale.

## 3. Goals

### 3.1 Product goals
- Help users discover suitable documents from plain-language descriptions or category browsing.
- Support platform-owned and user/company-uploaded templates.
- Generate proposed questionnaires from uploaded templates, with admin approval before reusable production use.
- Ask only relevant questions and avoid asking for information already known.
- Validate missing fields, inconsistent answers, and unsupported/high-risk cases.
- Let users add, modify, or review clauses through chat, the editor, or a clause library.
- Generate editable DOCX and PDF drafts while preserving source-template structure as far as technically possible.
- Explain clauses in plain language and show changes before applying them.
- Maintain template versions, source references, audit events, and access boundaries.
- Clearly distinguish a generated draft from a lawyer-reviewed or legally approved document.

### 3.2 Non-goals for the initial MVP
- Guaranteeing enforceability or legal outcomes.
- Replacing lawyers or providing representation in court.
- Automatically filing documents with courts, regulators, or government bodies.
- Supporting every jurisdiction or every document type on day one.
- Automatically executing signatures without an explicit integration and user consent.
- Automatically changing unrelated clauses without user approval.
- Treating arbitrary uploaded files as trusted instructions to the AI.
- Allowing AI to invent legal citations or claim a legal rule is verified without a source record.

## 4. Target users and personas

1. **Individual:** Needs a basic authorization letter, declaration, or personal document.
2. **Freelancer/consultant:** Needs client contracts, scope-of-work, payment terms, confidentiality, and IP provisions.
3. **Founder/small-business owner:** Needs NDAs, vendor agreements, founder documents, and standard commercial terms.
4. **Property user:** Needs supported rental/lease or property-related documents.
5. **Employee/employer/HR:** Needs employment and contractor documents.
6. **Company admin:** Uploads and manages company-specific templates and approves questionnaire mappings.
7. **Legal-content reviewer:** Reviews legal sources, clause text, jurisdiction rules, and template versions.
8. **Platform admin:** Manages catalogue, user access, quality, and operational settings.

## 5. Product principles

- Plain-language first; users need not know legal document names.
- No forced category match: always provide “Describe my situation” and “I can’t find what I need.”
- Ask one clear question at a time in chat when possible.
- Use structured, schema-driven forms for repeatable required fields.
- Reuse known answers and ask only for missing or ambiguous information.
- Show up to three document recommendations with reasons and limitations.
- Separate law/source content, reviewed clauses, document templates, and company-private templates.
- Treat legal knowledge as jurisdiction- and date-sensitive.
- Require explicit user approval before applying clause changes.
- Default to preserving the original uploaded template and highlighting edits.
- Do not imply that an AI-generated document is legally approved.
- Escalate urgent, high-risk, unsupported, or ambiguous legal situations.

## 6. Taxonomy and document discovery

### 6.1 Category hierarchy
Use an extensible many-to-many taxonomy. A document may belong to multiple domains.

Starter domains:
1. Real estate & property
2. Freelancing & professional services
3. Employment & HR
4. Business & corporate
5. Technology, intellectual property & digital business
6. Finance, sales & commercial transactions
7. Family, personal & estate
8. Disputes, claims & legal notices
9. Privacy, data protection & compliance
10. Procurement, supply chain & international trade
11. Consumer & insurance
12. General documents & other needs

Each category has subcategories, and each document type has tags, supported jurisdictions, eligibility rules, risk level, required inputs, templates, and alternate names.

### 6.2 Discovery paths
- Browse: category → subcategory → document type.
- Search: keyword or semantic search across catalogue.
- Chat: free-text description → intent extraction → up to three ranked recommendations.
- Upload: parse template → identify structure/document type → offer supported actions.
- Unknown need: collect a short description, suggest supported alternatives, or flag that no supported document currently exists.

### 6.3 Recommendation logic
GPT may classify the user’s need and propose candidate types. The backend must rank candidates using:
- Intent match
- User-selected category
- Jurisdiction support
- Party/transaction context
- Template availability
- Eligibility and risk rules

Ask a clarifying question when the top candidates are too close or key facts are missing. Always show that recommendations are suggestions, not definitive legal conclusions.

## 7. Main user journey

1. User enters platform.
2. User chooses browse, search, chatbot, upload, or saved document.
3. Platform collects/infers the objective and relevant context.
4. Platform recommends/loads document type or identifies uploaded-template mode.
5. User confirms document type and jurisdiction.
6. System loads the correct template specification.
7. System merges previously known answers with intake fields.
8. System asks only missing/ambiguous questions using common, document-specific, and conditional rules.
9. Backend validates required fields and consistency.
10. Risk engine determines: ready to draft, more information needed, or professional review/unsupported path.
11. System generates a draft using an approved template and structured field mapping.
12. User reviews the draft, asks about clauses, adds/edits/removes proposed clauses, and compares changes.
13. User explicitly approves edits.
14. User exports DOCX/PDF or saves the draft.
15. Platform retains permitted version history and audit events according to retention settings.

## 8. User-uploaded and company templates

### 8.1 Supported actions
For uploaded templates, user can:
- Fill placeholders and blanks.
- Modify specified clauses.
- Review for potential gaps or risks.
- Add a clause.
- Create a reusable workflow from the template.
- Compare the original and revised document.

### 8.2 First-time template onboarding
1. Upload DOCX or supported PDF.
2. Store original securely and calculate checksum/version metadata.
3. Parse text, headings, tables, placeholders, and available structural information.
4. Use GPT to propose document type, section map, candidate fields, and candidate questions.
5. Generate a proposed template schema with field-to-document mappings.
6. Admin reviews fields, conditional rules, and legal content.
7. Qualified reviewer approves legal text and jurisdiction-specific rules where applicable.
8. Save as a reusable template version.
9. For future generations, load the approved schema and ask only missing information.

### 8.3 Important behavior
- AI-generated questionnaire is a proposal, not automatically approved.
- A template is not legally validated merely because a company uploaded it.
- Keep original immutable; edits create new versions.
- Preserve layout where possible; warn users when exact fidelity is not supported.
- Extracted file content is untrusted data. Never follow instructions embedded in a document that attempt to override system rules, expose data, or call tools.
- Enforce organization-level isolation for private company templates.
- A company template can contain fixed clauses, editable fields, optional clauses, and conditional clauses; do not turn every clause into a question.

## 9. Dynamic questionnaire engine

Use three question layers:
1. Common fields where applicable: parties, jurisdiction, purpose, dates, signatory details.
2. Document-specific fields: e.g. rent/deposit for lease; deliverables/fees for services.
3. Conditional fields: displayed only when conditions are met.

Each field definition should include:
- `field_id`
- `label`
- `help_text`
- `answer_type`
- `required`
- `options` (if applicable)
- `validation`
- `visibility_condition`
- `source_question` (if inferred from existing content)
- `document_mapping`
- `sensitivity`
- `review_status`

The system must:
- Reuse answers from current session and user-provided documents where allowed.
- Track source and confidence for extracted answers.
- Ask users to confirm low-confidence extracted values.
- Identify missing, inconsistent, and conflicting fields.
- Avoid silently guessing legally material terms.
- Support one-question-at-a-time chat and a structured form view.
- Allow “I don’t know” where safe; then explain implications or escalate.

## 10. Add/change clause workflow

Provide three entry points:
1. Chat command, e.g. “Add a clause that prevents the vendor from sharing source code.”
2. Document editor action: “+ Add clause.”
3. Searchable clause library.

Workflow:
1. Determine intended protection and likely section.
2. Ask for missing jurisdiction/context and necessary terms.
3. Retrieve compatible reviewed clause options, where available.
4. Explain options and trade-offs in plain language.
5. Draft or adapt proposed text.
6. Check consistency with existing clauses and template policies.
7. Show original vs proposed text and affected sections.
8. Require explicit user approval.
9. Apply only approved changes; keep version history and change log.
10. Re-run relevant validation checks.

Never silently edit unrelated clauses. If no reviewed clause exists, label AI-generated wording as proposed/unreviewed and trigger appropriate risk warnings. User-supplied wording may be inserted as requested, but still flag obvious conflicts and preserve user control.

## 11. Legal knowledge base and retrieval

Use retrieval-augmented generation (RAG), not model memory alone.

Separate repositories:
A. **Legal sources:** official legislation, regulations, relevant judgments, and authorized legal sources.
B. **Reviewed clause library:** clause text, alternatives, purpose, conditions, explanation, jurisdiction, source, reviewer, version, and status.
C. **Template library:** document structure, schema, field mapping, questionnaire, template version, supported jurisdiction.
D. **Company-private library:** organization-owned templates, clauses, policies, and approved variations.

For each legal source record, store:
- Jurisdiction and geographic scope
- Source title/type and issuing authority
- Official URL or source identifier
- Relevant section/paragraph
- Publication/effective dates and status where available
- Retrieval date
- Review status and reviewer
- Permitted usage/licensing metadata
- Supersedes/superseded-by relationship when known

Retrieval process:
1. Identify user intent and jurisdiction.
2. Search approved sources and relevant clause/template metadata.
3. Filter by jurisdiction, status, document type, and effective date.
4. Return grounded snippets and source metadata.
5. Generate explanation with citations to retrieved records.
6. If source coverage is insufficient, say so and escalate rather than fabricate.

No claim that the repository contains “all law.” The knowledge base must disclose coverage gaps and stale/unknown status.

## 12. Validation and risk escalation

Validation classes:
- Required-field checks
- Data-type and format checks
- Date/amount/party consistency
- Cross-field contradiction checks
- Template compatibility checks
- Jurisdiction support checks
- Clause compatibility checks
- Source freshness and coverage checks
- Legal-review triggers

Outcomes:
1. `READY_FOR_DRAFT`: required fields complete and supported validation passed.
2. `NEEDS_INFORMATION`: missing or contradictory fields; ask follow-up questions.
3. `REVIEW_RECOMMENDED`: high-risk, complex, or legally uncertain matter; offer qualified professional review.
4. `UNSUPPORTED`: jurisdiction/document/transaction outside supported coverage; explain limitation and do not fabricate a template.

Risk flags are not a legal verdict. Do not promise enforceability.

## 13. Draft review, editing, and export

- Preview draft before export.
- Clause-level editing and “ask about this clause.”
- Original/revised comparison.
- Change tracking and version history.
- Clear labels for AI-generated, user-supplied, platform-reviewed, and company-approved content.
- Export DOCX and PDF.
- Warn if formatting could not be preserved exactly.
- Store generated output and audit events under retention policy.
- Export should never remove required disclaimers or status labels.
- Future phase may integrate e-signature provider; no signature is executed without explicit consent.

## 14. Admin and legal-content management

Admin console should support:
- Category/subcategory/document catalogue management.
- Template upload, versioning, and activation/retirement.
- Question schema editor.
- Conditional logic editor.
- Field-to-document mapping editor.
- Clause library and alternative clauses.
- Source registry and freshness status.
- Review/approval workflow.
- Supported-jurisdiction matrix.
- Risk-rule configuration.
- Organization template permissions.
- Generation failure reports and user feedback.
- Audit logs.

Legal content changes must have reviewer, timestamp, version, and reason. Only authorized roles can approve legal content.

## 15. Security, privacy, and compliance requirements

- Tenant isolation for company templates and documents.
- Authentication and role-based access control.
- Encrypt data in transit and at rest.
- Secure upload handling, MIME validation, file-size limits, malware scanning where available, and safe parser isolation.
- Do not use uploaded document text as instructions to the model.
- Minimize personal/sensitive data collection.
- Define data retention, deletion, export, and access policies.
- Keep secrets/API keys server-side.
- Log access and document mutations without unnecessarily logging sensitive full text.
- Avoid sending unnecessary personal data to the model.
- Explain how uploaded data is used and retained.
- Build consent and permissions for shared documents.
- Review applicable privacy laws and provider terms before launch.

## 16. Proposed technical architecture

Suggested default stack, subject to project repository constraints:
- Frontend: Next.js + React + TypeScript.
- API/backend: Next.js server routes or a separate TypeScript service.
- Database: PostgreSQL.
- ORM/migrations: Prisma or the repository’s established equivalent.
- File storage: S3-compatible private object storage.
- AI: OpenAI API, called only server-side.
- Retrieval: PostgreSQL full-text + vector search (e.g. pgvector) initially.
- Document parsing: DOCX parser and PDF text extraction; OCR as a later capability for scanned PDFs.
- DOCX output: template-aware DOCX generation preserving structure as far as possible.
- PDF output: render from generated DOCX or a controlled HTML-to-PDF service.
- Authentication: established provider or secure existing application auth.
- Observability: structured logs, request IDs, error tracking, generation metrics.

Before adding dependencies, inspect the existing repository and reuse its stack, conventions, authentication, database, and UI components. Do not replace working infrastructure without reason.

## 17. Core data entities

- `User`
- `Organization`
- `OrganizationMembership`
- `Category`
- `DocumentType`
- `Jurisdiction`
- `Template`
- `TemplateVersion`
- `TemplateSchema`
- `QuestionDefinition`
- `ConditionalRule`
- `FieldMapping`
- `Clause`
- `ClauseVersion`
- `LegalSource`
- `SourceChunk`
- `DocumentSession`
- `Answer`
- `GeneratedDocument`
- `DocumentVersion`
- `ClauseChange`
- `ValidationIssue`
- `ReviewRequest`
- `AuditEvent`

Every organization-owned record must include tenant ownership or an equivalent access-control relationship. Avoid duplicating a template for each category; use many-to-many category relationships.

## 18. API capability outline

Exact routes may be adjusted to existing project conventions.

- `GET /api/categories`
- `GET /api/document-types?categoryId=...`
- `POST /api/discovery/recommend`
- `POST /api/templates/upload`
- `POST /api/templates/:id/analyze`
- `POST /api/templates/:id/proposed-schema`
- `POST /api/templates/:id/approve`
- `GET /api/templates`
- `POST /api/document-sessions`
- `POST /api/document-sessions/:id/answers`
- `POST /api/document-sessions/:id/validate`
- `POST /api/document-sessions/:id/generate`
- `POST /api/documents/:id/clauses/propose`
- `POST /api/documents/:id/clauses/apply`
- `POST /api/documents/:id/compare`
- `GET /api/documents/:id/export?format=docx|pdf`
- `POST /api/knowledge/search`
- Admin routes for sources, clauses, categories, template versions, and approvals.

All routes require validation, authorization, rate limits where appropriate, and tenant checks.

## 19. MVP scope and phases

### Phase 1 — Core discovery and platform templates
- Category catalogue and search
- Chatbot-led intent discovery
- Up to three recommendations and confirmation
- Configurable jurisdiction abstraction
- Schema-driven questions
- Missing-field and consistency validation
- A small, legally reviewed starter template set
- Draft preview and DOCX/PDF export
- Clear limitations and escalation

### Phase 2 — User/company templates
- DOCX/PDF upload and parsing
- Candidate section/field/question extraction
- Admin review and approval of generated schema
- Field mappings and conditional questions
- Reusable company templates with tenant isolation
- Fill/modify/review/add-clause modes

### Phase 3 — Clause intelligence and knowledge retrieval
- Reviewed clause library
- Source registry and RAG search
- Clause explanation and source citations
- Clause conflict checks
- Before/after diff and explicit approval
- Legal-content admin console

### Phase 4 — Document lifecycle
- Collaboration and approvals
- E-signature integration
- Renewal reminders
- Advanced company policies and bulk generation
- Additional jurisdictions and categories after legal review

## 20. Success metrics

- Document recommendation acceptance rate
- Questionnaire completion rate
- Percentage of questions avoided by reusing known answers
- Successful draft generation rate
- Missing-field detection precision
- User correction rate after generation
- Template upload/parse success rate
- Percentage of uploaded templates successfully converted to approved reusable workflows
- Clause change approval rate
- Unsupported/risk escalation rate
- User-reported incorrect legal content rate
- Export success rate
- Time from user start to first draft
- Security/privacy incidents (target: zero)

## 21. Acceptance criteria

MVP is acceptable when:
1. Users can browse categories and search document types.
2. Users can describe a need and receive up to three grounded candidate document types.
3. Users can confirm a document type and jurisdiction.
4. The app loads a template schema and asks only required/relevant questions.
5. Existing known answers are reused with confirmation where extraction confidence is low.
6. Contradictions and missing required fields block generation until resolved or escalated.
7. A generated draft is clearly labeled as a draft and is not represented as legally approved.
8. Users can preview, edit, and export DOCX/PDF.
9. A user can request a clause through chat or the editor and must approve it before insertion.
10. An uploaded template remains private and is not shared across organizations.
11. AI-proposed template questions/mappings require admin approval before reuse.
12. Source-based legal explanations show available source metadata and disclose coverage limitations.
13. Unsupported/high-risk cases follow configured escalation rather than fabricating legal answers.
14. Critical flows have automated tests and error states.

## 22. Open product decisions

Keep these configurable; do not hardcode:
- Initial jurisdiction(s) to launch
- Initial list of reviewed templates
- Whether unauthenticated users may preview a draft
- File size/type limits
- Retention periods
- Professional review referral model
- Pricing/usage limits
- Which e-signature provider to integrate
- Whether PDF OCR is in MVP or phase 2

Recommended implementation assumption: build a jurisdiction-aware foundation, seed only explicitly reviewed initial content, and enable one launch jurisdiction at a time through configuration.

## 23. Final implementation rule

Inspect the existing codebase first. Implement in small, testable vertical slices. Never fabricate legal sources, legal approval, template coverage, or successful exports. Use seed/demo content clearly labeled as demo, and keep production legal content separate from unreviewed examples.
