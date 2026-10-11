# Implementation status

## Slice 1 (done)
- Discovery: 12-category expandable taxonomy, keyword search (`src/lib/legal/discovery.ts`).
- Assistant (`/assistant`): server-side AI call (Lovable AI Gateway, `LOVABLE_API_KEY`), strict JSON schema, max 3 catalog-only recommendations, clarifying question, out-of-scope escalation, deterministic keyword fallback when AI fails.
- Questionnaire (`/documents/$slug`): schema-driven common/specific/conditional fields, deterministic field + cross-field validation, jurisdiction support checks, answer reuse (profile in browser).
- Generation: deterministic template rendering, versions saved, DOCX export, PDF via print. All templates are DEMO and labelled "not reviewed by a lawyer".
- Tests: `src/test/legal.test.ts`.

## Not yet built
- Accounts, organizations, roles, server-side tenant isolation (drafts currently live in browser storage only).
- Database tables per spec section 4 (requires enabling Lovable Cloud).
- Template upload (DOCX/PDF), AI analysis, admin approval workflow.
- Clause library, "+ Add clause", AI clause proposals, before/after diff, approval/apply flow.
- Legal source registry and citation retrieval.
- Rich editor and audit log.
