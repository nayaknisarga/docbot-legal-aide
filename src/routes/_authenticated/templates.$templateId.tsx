import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/legal/SiteShell";
import { ClauseBadge } from "@/components/legal/ClauseBadge";
import { MessageResponse } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { decideTemplateClause, getTemplate, sendTemplateMessage } from "@/lib/legal/uploads.functions";
import { isInDraft, type Clause } from "@/lib/legal/uploads";
import { DISCLAIMER } from "@/lib/legal/defs";

export const Route = createFileRoute("/_authenticated/templates/$templateId")({
  head: () => ({
    meta: [
      { title: "Review your template — Clausewell" },
      { name: "description", content: "Add, remove and review clauses in your uploaded template with an AI assistant. Not legal advice." },
      { property: "og:title", content: "Review your template — Clausewell" },
      { property: "og:description", content: "AI-assisted clause review with approve/skip on every change." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Workspace,
});

type Data = Awaited<ReturnType<typeof getTemplate>>;

function Workspace() {
  const { templateId } = Route.useParams();
  const fetchT = useServerFn(getTemplate);
  const send = useServerFn(sendTemplateMessage);
  const decide = useServerFn(decideTemplateClause);
  const [data, setData] = useState<Data | null>(null);
  const [input, setInput] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [deciding, setDeciding] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const reload = useCallback(() => fetchT({ data: { id: templateId } }).then(setData), [fetchT, templateId]);
  useEffect(() => {
    reload().catch(() => toast.error("Couldn't load this template."));
  }, [reload]);
  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [data?.messages.length, pendingText]);

  async function submit() {
    const text = input.trim();
    if (!text || pendingText) return;
    setPendingText(text);
    setInput("");
    try {
      await send({ data: { id: templateId, text, mode } });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The assistant could not reply.");
      setInput(text);
    } finally {
      setPendingText(null);
      taRef.current?.focus();
    }
  }

  async function onDecide(c: Clause, decision: "approved" | "skipped") {
    setDeciding(c.id);
    try {
      await decide({ data: { clauseId: c.id, decision } });
      await reload();
      if (decision === "approved") toast.success(c.action === "remove" ? `Removed “${c.heading}”` : `Added “${c.heading}”`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save that.");
    } finally {
      setDeciding(null);
    }
  }

  if (!data)
    return (
      <SiteShell>
        <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      </SiteShell>
    );

  const pending = data.clauses.filter((c) => c.decision === "pending");
  const changes = data.clauses.filter((c) => c.origin === "added" || c.action === "remove");

  return (
    <SiteShell wide>
      <div className="grid lg:h-[calc(100vh-61px)] lg:grid-cols-2">
        {/* Chat */}
        <section className="flex min-h-[70vh] flex-col border-r border-border lg:min-h-0" aria-label="Assistant chat">
          <div className="border-b border-border px-6 py-4">
            <Link to="/templates" className="text-sm text-muted-foreground hover:text-foreground">← Your registered templates</Link>
            <h1 className="mt-1 truncate text-2xl text-primary">{data.name}</h1>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {data.messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" : "text-sm"}>
                {m.role === "user" ? m.text : <MessageResponse>{m.text}</MessageResponse>}
              </div>
            ))}
            {pendingText && (
              <>
                <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">{pendingText}</div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reviewing…</p>
              </>
            )}
            {changes.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Proposed changes</h2>
                {changes.map((c) => (
                  <article key={c.id} className="rounded-md border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{c.action === "remove" ? "Remove: " : "Add: "}{c.heading}</span>
                      <ClauseBadge clause={c} />
                    </div>
                    {c.note && <p className="mt-2 text-xs text-muted-foreground">{c.note} <em>Suggestion only, not legal advice.</em></p>}
                    {c.sources?.length > 0 && (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer font-medium text-primary">Sources checked ({c.sources.length})</summary>
                        <ul className="mt-2 space-y-2">
                          {c.sources.map((source) => (
                            <li key={source.url}>
                              <a className="inline-flex items-start gap-1 text-primary underline decoration-border underline-offset-2" href={source.url} target="_blank" rel="noreferrer">
                                {source.title} <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {c.decision === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" disabled={deciding === c.id || (c.origin === "added" && c.verdict === "blocked")} onClick={() => onDecide(c, "approved")}>Approve</Button>
                        <Button size="sm" variant="outline" disabled={deciding === c.id} onClick={() => onDecide(c, "skipped")}>Skip</Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-border p-4">
            {data.stage === "done" && (
              <div className="mb-2 flex gap-2" role="radiogroup" aria-label="Request type">
                {(["add", "remove"] as const).map((m) => (
                  <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} role="radio" aria-checked={mode === m} onClick={() => setMode(m)}>
                    {m === "add" ? "Add a clause" : "Remove a clause"}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                ref={taRef}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                aria-label="Message the assistant"
                placeholder={data.stage === "ask_remove" || (data.stage === "done" && mode === "remove") ? "e.g. remove the non-compete clause" : "e.g. add a confidentiality clause for 3 years"}
                className="min-h-14 text-sm"
              />
              <Button size="icon" onClick={submit} disabled={!input.trim() || !!pendingText} aria-label="Send"><Send className="h-4 w-4" /></Button>
            </div>
            {pending.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{pending.length} change{pending.length > 1 ? "s" : ""} awaiting your approval.</p>}
          </div>
        </section>

        {/* Document */}
        <section className="flex min-h-0 flex-col bg-secondary/40" aria-label="Document preview">
          <div className="border-b border-border bg-warning px-6 py-2 text-xs text-warning-foreground">{DISCLAIMER}</div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 font-serif">
              {data.clauses.map((c) => {
                const inDraft = isInDraft(c);
                const proposedAdd = c.origin === "added" && c.decision === "pending";
                if (!inDraft && !proposedAdd && !(c.action === "remove" && c.decision === "approved")) return null;
                const removed = c.action === "remove" && c.decision === "approved";
                const red = c.verdict === "blocked" && !removed;
                const cls = removed
                  ? "opacity-50 line-through"
                  : red ? "border-l-4 border-destructive bg-destructive/10"
                  : proposedAdd ? "border border-dashed border-primary/50"
                  : c.verdict === "review" ? "border-l-4 border-warning-foreground/40" : "";
                return (
                  <div key={c.id} className={`mb-4 rounded-sm p-3 ${cls}`}>
                    <div className="mb-1 flex flex-wrap items-center gap-2 font-sans"><ClauseBadge clause={c} /></div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
                    {red && c.note && (
                      <p className="mt-2 flex gap-1 font-sans text-xs text-destructive"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {c.note} — review with a lawyer.</p>
                    )}
                    {c.sources?.length > 0 && <p className="mt-2 font-sans text-xs text-muted-foreground">Based on {c.sources.length} source{c.sources.length > 1 ? "s" : ""} checked by the assistant · suggestion only.</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
