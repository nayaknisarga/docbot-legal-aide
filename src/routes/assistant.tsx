import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Gavel, Loader2 } from "lucide-react";
import { SiteShell, RiskBadge } from "@/components/legal/SiteShell";
import { askAssistant, type AssistantResult, type ChatTurn } from "@/lib/legal/assistant.functions";
import { getDocumentType } from "@/lib/legal/catalog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/assistant")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: () => ({
    meta: [
      { title: "Document assistant — Clausewell" },
      { name: "description", content: "Describe your situation and get up to three document recommendations." },
      { property: "og:title", content: "Document assistant — Clausewell" },
      { property: "og:description", content: "Describe your situation and get up to three document recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPage,
});

type Msg = ChatTurn & { result?: AssistantResult };

function AssistantPage() {
  const { q } = Route.useSearch();
  const ask = useServerFn(askAssistant);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState(q ?? "");
  const [busy, setBusy] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { ta.current?.focus(); }, [busy]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const result = await ask({ data: { history: next.map(({ role, content }) => ({ role, content })) } });
      const content = [result.reply, result.clarifyingQuestion].filter(Boolean).join(" ");
      setMsgs([...next, { role: "assistant", content, result }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-3xl flex-col">
        <h1 className="text-3xl text-primary">Tell us what's going on</h1>
        <p className="mt-1 text-sm text-muted-foreground">Plain language is fine. The assistant suggests documents — it doesn't give legal advice.</p>

        <div className="mt-8 min-h-[300px] space-y-6">
          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {["I'm renting out my flat", "A client owes me ₹50,000", "I'm hiring my first employee", "I want to pitch an idea to a partner"].map((s) => (
                <button key={s} onClick={() => setInput(s)} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-accent">{s}</button>
              ))}
            </div>
          )}
          {msgs.map((m, i) => m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[80%] rounded-lg bg-primary px-4 py-2.5 text-primary-foreground">{m.content}</div>
          ) : (
            <div key={i} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><Gavel className="h-4 w-4" /></div>
              <div className="flex-1 space-y-3">
                <p>{m.content}</p>
                {m.result?.outOfScope && <p className="rounded-md bg-warning p-3 text-sm text-warning-foreground">This may need a lawyer. We don't support this situation yet.</p>}
                {m.result?.recommendations.map((r) => {
                  const d = getDocumentType(r.slug)!;
                  return (
                    <Link key={r.slug} to="/documents/$slug" params={{ slug: r.slug }} className="block rounded-md border border-border bg-card p-4 hover:border-accent">
                      <div className="flex items-center gap-2"><span className="font-serif text-lg">{d.name}</span><RiskBadge level={d.riskLevel} /></div>
                      <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
                      <span className="mt-2 inline-block text-sm text-accent">Start this document →</span>
                    </Link>
                  );
                })}
                {m.result?.source === "fallback" && <p className="text-xs text-muted-foreground">AI unavailable ({m.result.error}); showing keyword matches.</p>}
              </div>
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>}
          <div ref={end} />
        </div>

        <div className="sticky bottom-4 mt-6 rounded-lg border border-border bg-card p-2">
          <Textarea ref={ta} value={input} onChange={(e) => setInput(e.target.value)} rows={2} placeholder="Describe your situation…" className="resize-none border-0 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <div className="flex justify-end"><Button size="icon" onClick={send} disabled={busy || !input.trim()} aria-label="Send"><ArrowUp className="h-4 w-4" /></Button></div>
        </div>
      </div>
    </SiteShell>
  );
}
