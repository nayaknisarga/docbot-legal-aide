# Implementation status

## Done
- Catalogue: `src/lib/legal/template_definitions.json` (your file) drives the grid, questions, and preview. Demo template bodies live in `template-bodies.ts` because the referenced placeholder `.md` files were not supplied.
- Template grid (`/`): grouped by category, search, All / Your documents tabs.
- Split workspace (`/d/$sessionId`): AI agent chat (left) and live preview (right) with a pinned draft-only disclaimer, DOCX/PDF export, jurisdiction guard (unsupported + warnings).
- Agent (`src/routes/api/agent.ts` -> `src/lib/legal/agent.server.ts`): tool loop with recommend_documents, get_next_question, save_answer, validate_answers, search_clauses, propose_clause, fill_template, check_consistency. All tools read/write the database; session id is bound server-side, not chosen by the model.
- Clauses stay `proposed` until the user clicks Approve (`decideClause` is the only approval path). Only approved clauses reach exports.
- AI clause drafts use a fixed JSON schema, are re-validated, retried once, then fall back to "no clause". Chat messages are shape-validated before saving.
- Tests: `src/test/legal.test.ts`.

- Upload your own template (`/templates/upload`, `/templates`, `/templates/$id`): sign-in required, original stored unchanged, Gemini reviews clauses, every add/remove needs Approve. Tests: `src/test/uploads.test.ts`.
- Uploaded-template add/remove requests now search current legal sources before the AI proposes a change, show validated source links beside proposals, and still require Approve/Skip.

## Not yet built
- User accounts and organizations. Sessions are currently addressed by an unguessable link stored in the browser.
- Admin approval of uploaded templates, reviewed internal legal source registry, audit log, AI usage quotas.
- Terms / Privacy / Disclaimer pages (need lawyer review).
