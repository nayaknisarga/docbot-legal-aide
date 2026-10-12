<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Legal platform domain logic lives in `src/lib/legal/` (catalog, questionnaire validation, rendering, discovery) as pure, tested functions; AI is only an assistant layer whose output is sanitized against the catalog — keeps state deterministic per the PRD.
- AI calls run only server-side (server functions or `src/routes/api/agent.ts`); agent tools are bound to the session server-side and can only propose clauses — approval is a separate user-only server function.
- Homepage discovery streams through a separate read-only TanStack server route and validates template choices against the catalogue; this prevents discovery from modifying document sessions.
- Compose homepage chat with AI Elements and AI SDK UI messages; this preserves compatible streaming, tool states, and markdown rendering.
- Uploaded templates are owned per signed-in account (row-level security + private storage folder per user); the AI only reviews deterministically split clauses and proposes adds/removals, and `decideTemplateClause` is the only path that applies a change — keeps original text unchanged and the user in control.
- Uploaded-template clause changes research current legal sources server-side and persist only validated source URLs with proposals; source context never bypasses explicit user approval.
- Saved-document display names are validated browser-local aliases, separate from template wording and server session data — renaming must never alter legal document contents.
