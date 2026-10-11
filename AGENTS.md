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
- AI calls run only in server functions (`*.functions.ts`) with a keyword fallback — secrets stay server-side and the app works if AI fails.
