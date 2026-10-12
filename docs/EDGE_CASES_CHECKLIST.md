# Edge-Case & Gap Checklist — AI Legal Document Platform

Companion to PRD.md + TECHNICAL_IMPLEMENTATION_SPEC.md + CODEX_BUILD_PROMPT.md.
Items marked **[NEW]** are not covered (or only vaguely covered) in the current pack.
Severity: 🔴 critical · 🟠 high · 🟡 medium.

---

## 0. Meta / spec-consistency issues (fix before building)

- 🔴 **[NEW] No codebase in the pack.** The zip contains only docs. The build prompt's "inspect existing codebase / preserve working code" has nothing to act on. → Decide greenfield vs. point at a real repo, and say which explicitly.
- 🔴 **[NEW] Two contradictory build prompts.** "Fully functional, publicly deployable, not a UI prototype, greenfield" vs. "preserve existing working code, incremental." Merge into one.
- 🟠 **[NEW] Provider lock-in wording.** Spec hardcodes "OpenAI API" but you're also using Claude. Keep the adapter provider-agnostic (`LLM_PROVIDER` env: openai | anthropic | demo).
- 🟡 **[NEW] API outline mismatch.** PRD §18 says `/clauses/apply`; Spec §6 says `/clauses/:changeId/approve`. Reconcile to one contract.
- 🟡 **[NEW] `jurisdiction_id` nullable on clauses/templates.** For a legal product, replace nullable with an explicit `is_jurisdiction_agnostic` boolean so "no jurisdiction set" is never confused with "valid everywhere."

## 1. Legal / domain risk (highest real-world exposure)

- 🔴 **[NEW] Unauthorized Practice of Law (UPL).** Add: "not a law firm / not legal advice" notice; disclaimer injected at BOTH generation and export; ToS with liability waiver; the disclaimer cannot be stripped from exports.
- 🔴 **[NEW] Execution/validity requirements per jurisdiction.** Many docs are invalid unexecuted: witnesses, notarization, and (India) **stamp duty + registration** for leases/agreements. Risk engine must surface these, not just "READY_FOR_DRAFT."
- 🔴 **[NEW] Clause enforceability flips by jurisdiction.** e.g. non-compete/non-solicit largely unenforceable in India (Contract Act s.27) but fine in US. Hard-gate clause library by jurisdiction; never surface a mismatched-jurisdiction clause.
- 🔴 **[NEW] Counterparty PII consent.** You store a third party's personal data without their consent (DPDP Act 2023 / GDPR). Minimize, document lawful basis, support deletion.
- 🟠 **[NEW] Governing-law vs user-location mismatch.** User in Bangalore drafting a California NDA — capture both; frame limitations accordingly.
- 🟠 **[NEW] Dangerous/illegal intent.** Discovery must refuse + escalate (not just "unsupported") for requests to defraud, evade law, suppress reporting, etc.
- 🟡 **[NEW] Party capacity.** Minor / legally incapable party can't contract — at least a soft flag.
- 🟡 **[NEW] Legal-hold / retention on deletion.** Generated contracts may have value to the counterparty; define what deletion actually removes.

## 2. AI / LLM behavior

- 🔴 **[NEW] Prompt injection via answer fields** (not just uploads). Sanitize/serialize all user text as data; never place it in the system role.
- 🔴 Prompt injection via uploaded docs (covered — keep: delimited data channel, output-schema validation, no tool exposure to doc content).
- 🔴 **[NEW] Hallucinated placeholders/mappings.** Verify every AI-proposed `{{placeholder}}` exists in extracted text; handle 0 or multiple occurrences; reject mappings to nonexistent tokens.
- 🔴 **[NEW] Malformed / schema-violating model output.** JSON-schema-validate every response; repair-retry with a hard cap; fall back to deterministic path; never persist unvalidated AI output.
- 🟠 **[NEW] Per-user AI spend cap + quota.** Cap tokens/requests/uploads per user per period; separate anonymous vs. verified limits.
- 🟠 **[NEW] Provider outage at runtime** (429/500/timeout) distinct from "no API key." Circuit-breaker + user-visible retry; queue long jobs.
- 🟠 **[NEW] Context-window overflow on large uploads.** Chunk for analysis, not only for retrieval; cap pages; summarize-then-map.
- 🟠 **[NEW] Cross-template answer reuse mis-mapping.** "Reuse known answers" needs a canonical field ontology, or it drops a landlord name into a vendor-name field. Match on semantic key, not raw field_id.
- 🟡 **[NEW] Streaming cancellation / navigation away.** Mid-generation abort → clean up orphaned jobs; idempotent resume.
- 🟡 **[NEW] Non-determinism in tests.** Pin a seed/temperature=0 path or stub the provider in CI so tests are reproducible.

## 3. Document generation & file handling

- 🟠 **[NEW] Placeholder split across Word runs.** `{{client_name}}` fragments into separate XML runs — naive replace fails silently. Normalize runs first (or use docxtpl/Jinja with run-merge).
- 🟠 **[NEW] Placeholders in headers, footers, text boxes, tables.** python-docx skips these by default — iterate all story parts.
- 🔴 **[NEW] Unfilled-token guard before export.** Scan output for leftover `{{…}}` / blanks and block export or warn.
- 🟠 DOCX→PDF fidelity: headless LibreOffice + fonts (incl. Devanagari/non-Latin) or output is garbled; warn when layout not preserved. (partly covered)
- 🟠 **[NEW] DOCX zip-bomb / OLE / remote-relationship injection.** DOCX is a zip — enforce decompression limits; strip external relationships and OLE objects, not only macros.
- 🟡 **[NEW] Encoding / RTL / emoji** in party names breaking renderer.
- 🟡 **[NEW] Concurrent edits to one draft** (two org members) → optimistic locking + version-conflict UI.
- 🟡 Scanned/image-only PDF detection + OCR gate (covered — keep).

## 4. Multi-tenant / auth / access

- 🔴 **[NEW] RAG/vector search tenant filtering.** Retrieval must filter by active org or it leaks another tenant's private clause/source. Classic leak.
- 🔴 IDOR on every `:id` route (covered — keep). Add: signed export URLs expire, are single-use, and are re-authorized server-side (not just unguessable).
- 🟠 **[NEW] User in multiple orgs** → explicit "active org" context; every query scoped to it; org switcher.
- 🟠 **[NEW] Self-approval prevention.** Uploader ≠ approver for template/clause/source approval (segregation of duties).
- 🟡 **[NEW] Leaving / deleting an org** → ownership transfer or archival of templates & docs; no orphans.
- 🟡 **[NEW] Personal vs org session** (`organization_id` nullable) — define default and switching rules.

## 5. Questionnaire & validation logic

- 🟠 **[NEW] Variable number of parties** (>2). Don't hardcode partyA/partyB; support a dynamic party list and map to repeated template blocks.
- 🟠 **[NEW] Circular visibility conditions** → cycle detection at schema-validation time.
- 🟡 **[NEW] Dangling condition** referencing a removed/renamed field.
- 🟡 **[NEW] "I don't know" on a required, mapped field** → defined behavior (block, placeholder-with-flag, or escalate), never silent.
- 🟡 Date consistency: end-before-start (covered); add start-in-past, auto-renewal math, term outliving a party, date timezones.
- 🟡 **[NEW] Amount/currency:** currency vs jurisdiction mismatch, negatives, zero, Indian lakh/crore formatting.
- 🟡 **[NEW] Same entity chosen as both parties.**

## 6. Discovery / recommendation

- 🟡 **[NEW] All candidates low-confidence** → show "none of these may fit" instead of forcing three.
- 🟡 **[NEW] Ambiguous jurisdiction in free text** ("I'm in Bangalore, client in US") → clarifying question before recommending.
- 🟡 Zero matches / "I can't find what I need" (covered — keep).

## 7. Public deployment & ops (you want a live URL)

- 🔴 **[NEW] Own ToS + Privacy Policy + disclaimer pages** live before launch. (A legal-doc site without these is the first thing flagged.)
- 🔴 **[NEW] Abuse surface of public signup:** email verification + captcha before any AI call; upload malware/content scanning; moderation on free-text (illegal/CSAM in uploads).
- 🟠 **[NEW] Secrets manager** in prod (not `.env` baked into the image); rotate keys.
- 🟠 **[NEW] Backups / disaster recovery** for high-value legal docs; tested restore.
- 🟠 **[NEW] Observability** (Sentry + request IDs + AI metrics) that logs WITHOUT storing full doc text / PII.
- 🟡 **[NEW] Idempotency keys** on generate/export (double-click = double doc + double AI charge).
- 🟡 Accessibility (WCAG) + possible multi-language UI for India.

## 8. Lifecycle-state gaps

- 🟡 **[NEW] Clause change:** add a post-apply re-validation-failed → rollback state.
- 🟡 **[NEW] Draft mutability:** state clearly that each approved clause change creates a NEW immutable `generated_document` version (don't mutate in place).
- 🟡 **[NEW] Template retire while drafts in flight:** policy for existing sessions using a now-retired version.

---

### Suggested build order change
Add a **Phase 0** before the current Phase 1:
foundation + auth + tenancy + **legal/disclaimer pages** + provider adapter + idempotency + a stubbed generation path. Ship nothing public until Phase 0's disclaimer/ToS/abuse-control items exist.
