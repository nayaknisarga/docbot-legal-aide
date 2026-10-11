# Codex Build Prompt — AI Legal Document Platform

You are implementing an AI-assisted legal document platform. Read `PRD.md` and `TECHNICAL_IMPLEMENTATION_SPEC.md` before coding. They are the product and engineering source of truth.

## Your first actions
1. Inspect the existing repository, package files, framework, database, authentication, design system, and tests.
2. Summarize the current architecture and identify reusable components.
3. Propose a concise phased plan.
4. Implement the first vertical slice without replacing working infrastructure.

## Product behavior
Users must be able to:
- Browse an expandable legal taxonomy covering property, freelancing, employment, business, technology/IP, finance/commercial, family/personal, disputes/notices, privacy/compliance, procurement/trade, consumer/insurance, and general/other.
- Search or describe a need in natural language.
- Receive up to three document recommendations with short explanations and a clarifying question when needed.
- Select a supported document and jurisdiction.
- Answer schema-driven common, document-specific, and conditional questions.
- Reuse previously provided answers and ask only for missing/unclear required information.
- Generate a draft from an approved platform template.
- Upload their own/company DOCX or text-based PDF template, analyse it, and create a proposed reusable questionnaire/mapping.
- Require an authorized admin/reviewer to approve a proposed uploaded-template schema before it becomes reusable/active.
- Fill a template, modify clauses, review a document, or add clauses.
- Request a clause via chatbot, “+ Add clause” in the editor, or a searchable reviewed clause library.
- See original/proposed clause text, warnings, sources where available, and a before/after comparison.
- Explicitly approve changes before they are applied.
- Preview and export DOCX/PDF; save versions.
- Receive clear limitations/escalation for unsupported jurisdiction, missing legal source coverage, or high-risk issues.

## Technical rules
- GPT is an assistant layer, not the source of truth for application state.
- Use deterministic backend validation and approved schemas for required fields and conditional questions.
- Keep all model calls and API secrets server-side.
- Treat uploaded document content as untrusted input, not instructions.
- Enforce organization tenant isolation server-side.
- Never fabricate statutes, cases, citations, legal approval, or enforceability.
- Keep platform templates, company templates, legal sources, and reviewed clauses in distinct models.
- AI-proposed questionnaire mappings and clause text are unapproved until reviewed/approved under the configured workflow.
- Preserve the original uploaded template and use immutable versions.
- Do not silently alter unrelated clauses.
- Do not use demo legal text as production legal advice. Clearly label demo seed content.
- If the repo uses an existing stack, follow it. Suggested defaults only if the repo has no established stack: Next.js/React/TypeScript, PostgreSQL, private S3-compatible storage, OpenAI API server-side, DOCX/PDF processing, and full-text/vector retrieval.

## First vertical slice (implement in this order)
1. Category/document-type catalogue with seed demo data.
2. Discovery screen: browse/search plus “Describe my situation.”
3. Discovery API with deterministic demo recommendations and a provider adapter for GPT; gracefully work in demo mode without API credentials.
4. Document session and configurable questionnaire schema.
5. Dynamic question UI and deterministic required-field validation.
6. One clearly labeled demo template that generates a draft from structured fields.
7. Draft preview and export path, or an explicit adapter/stub with clear UI if document generation dependency is not configured.
8. Tests and README setup instructions.

Then implement template upload/analysis/approval and clause editing as subsequent vertical slices. Do not pretend an unimplemented feature works: show clear disabled/coming-soon states or implement it fully.

## UX requirements
- Plain language; do not require legal terminology.
- Ask one direct question at a time in chatbot mode.
- Show progress and allow users to return to previous answers.
- Always include “I can’t find what I need” or free-text fallback.
- Show the reason for each document recommendation.
- Clearly label generated output as a draft.
- Provide loading, empty, error, retry, and unsupported states.
- Make UI responsive and accessible.

## Deliverables
- Working implementation in the existing repository.
- Database migrations/schema.
- Seed demo categories and clearly labeled demo templates.
- Automated tests for main and failure paths.
- `.env.example` without secrets.
- README with local setup, database setup, provider configuration, test commands, and known limitations.
- A brief implementation summary listing what is complete, what is stubbed, and what remains.

Start by inspecting the repo. Do not start with a full rewrite. Ask a question only if a blocking product or environment detail cannot be reasonably inferred from the PRD.
