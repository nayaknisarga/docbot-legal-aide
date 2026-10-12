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
