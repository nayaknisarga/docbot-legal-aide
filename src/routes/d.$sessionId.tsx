import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, Check, CheckCircle2, Download, Gavel, Loader2, Printer, Square, Wrench, X } from "lucide-react";
import { toast } from "sonner";
import { SiteShell, RiskBadge } from "@/components/legal/SiteShell";
import { DISCLAIMER, getDocType, renderDraft, renderSegments, validateAll, visibleQuestions, isEmpty } from "@/lib/legal/defs";
import { decideClause, getSession } from "@/lib/legal/sessions.functions";
import { rememberCommonAnswers, rememberSession } from "@/lib/legal/local";
import { exportDocx } from "@/lib/legal/export";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/d/$sessionId")({
  head: () => ({
    meta: [
      { title: "Drafting — Clausewell" },
      { name: "description", content: "Answer the agent's questions and watch your legal draft fill in live." },
      { property: "og:title", content: "Drafting — Clausewell" },
      { property: "og:description", content: "Answer the agent's questions and watch your legal draft fill in live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DraftPage,
});

type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>;

function DraftPage() {
  const { sessionId } = Route.useParams();
  const fetchSession = useServerFn(getSession);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["session", sessionId], queryFn: () => fetchSession({ data: { id: sessionId } }) });

  if (isLoading) return <SiteShell><p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading document…</p></SiteShell>;
  if (error) return <SiteShell><p className="text-destructive">Couldn't load this document. <button className="underline" onClick={() => refetch()}>Retry</button></p></SiteShell>;
  if (!data) return <SiteShell><p>Document not found. <Link to="/" className="text-accent underline">Back to templates</Link></p></SiteShell>;
  return <Workspace key={sessionId} session={data} />;
}

const TOOL_LABEL: Record<string, string> = {
  recommend_documents: "Finding documents", get_next_question: "Checking next question", save_answer: "Saving answer",
  validate_answers: "Validating answers", search_clauses: "Searching clause library", propose_clause: "Drafting a proposed clause",
  fill_template: "Filling the template", check_consistency: "Checking consistency",
};

function Workspace({ session }: { session: SessionData }) {
  const doc = getDocType(session.templateId)!;
  const qc = useQueryClient();
  const decide = useServerFn(decideClause);
  const [input, setInput] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const kicked = useRef(false);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/agent", body: { sessionId: session.id } }), [session.id]);
  const { messages, sendMessage, status, stop } = useChat({
    id: session.id,
    messages: session.messages as UIMessage[],
    transport,
    onError: (e) => toast.error(e.message || "The agent hit an error."),
    onFinish: () => qc.invalidateQueries({ queryKey: ["session", session.id] }),
  });
  const busy = status === "submitted" || status === "streaming";

  // Refresh the live preview whenever a tool finishes.
  const toolDone = messages.flatMap((m) => m.parts).filter((p) => p.type.startsWith("tool-") && (p as { state?: string }).state === "output-available").length;
  useEffect(() => { if (toolDone) qc.invalidateQueries({ queryKey: ["session", session.id] }); }, [toolDone, qc, session.id]);
  useEffect(() => { rememberSession(session.id); rememberCommonAnswers(session.answers); }, [session.id, session.answers]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, status]);
  useEffect(() => { if (!busy) ta.current?.focus(); }, [busy]);
  useEffect(() => {
    if (!kicked.current && messages.length === 0) { kicked.current = true; sendMessage({ text: "Hi, let's start." }); }
  }, [messages.length, sendMessage]);

  function send() {
    const t = input.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  async function onDecide(clauseId: string, decision: "approved" | "rejected") {
    try {
      await decide({ data: { sessionId: session.id, clauseId, decision } });
      await qc.invalidateQueries({ queryKey: ["session", session.id] });
      toast.success(decision === "approved" ? "Clause approved and added to your draft" : "Clause rejected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update clause");
    }
  }

  const answers = session.answers;
  const v = validateAll(doc, answers);
  const vis = visibleQuestions(doc, answers).filter((q) => q.required);
  const done = vis.filter((q) => !isEmpty(answers[q.fieldId])).length;
  const segs = renderSegments(doc, answers);
  const approved = session.clauses.filter((c) => c.status === "approved");
  const proposed = session.clauses.filter((c) => c.status === "proposed");

  return (
    <SiteShell wide>
      <div className="grid h-[calc(100vh-61px)] lg:grid-cols-[minmax(360px,440px)_1fr] print:block print:h-auto">
        {/* LEFT: agent chat */}
        <section className="flex min-h-0 flex-col border-r border-border print:hidden">
          <div className="border-b border-border px-5 py-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Templates</Link>
            <div className="mt-1 flex items-center gap-2"><h1 className="truncate text-lg">{doc.name}</h1><RiskBadge level={doc.riskLevel} /></div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${vis.length ? (done / vis.length) * 100 : 0}%` }} /></div>
              {done}/{vis.length}
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((m) => <ChatMessage key={m.id} m={m} />)}
            {status === "submitted" && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Agent is thinking…</div>}
            <div ref={end} />
          </div>
          <div className="border-t border-border p-3">
            <div className="rounded-lg border border-border bg-card p-2">
              <Textarea ref={ta} value={input} onChange={(e) => setInput(e.target.value)} rows={2} placeholder="Answer, or ask for a clause…" aria-label="Message the agent"
                className="resize-none border-0 shadow-none focus-visible:ring-0" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-muted-foreground">The agent only proposes — you approve.</span>
                {busy ? <Button size="icon" variant="outline" onClick={() => stop()} aria-label="Stop"><Square className="h-3.5 w-3.5" /></Button>
                  : <Button size="icon" onClick={send} disabled={!input.trim()} aria-label="Send"><ArrowUp className="h-4 w-4" /></Button>}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: live preview */}
        <section className="min-h-0 overflow-y-auto bg-muted/40 print:overflow-visible print:bg-transparent">
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-warning/95 px-6 py-2 text-xs text-warning-foreground backdrop-blur print:hidden">
            <span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" /> DRAFT ONLY — {DISCLAIMER}</span>
            <span className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { const d = renderDraft(doc, answers, session.clauses); exportDocx(doc.name, d.text, null, doc.id); }}><Download className="h-3.5 w-3.5" /> DOCX</Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> PDF</Button>
            </span>
          </div>
          <div className="mx-auto max-w-3xl space-y-4 px-6 py-8">
            {v.jurisdiction.code && !v.jurisdiction.supported && <Banner tone="danger">UNSUPPORTED: {answers["jurisdiction"] as string} isn't supported for this template ({doc.jurisdiction.join(", ")} only). A draft can't be generated — please consult a local lawyer.</Banner>}
            {v.jurisdiction.warning && <Banner tone="warn">{v.jurisdiction.warning}</Banner>}
            {session.drafts.length > 0 && <p className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Draft v{session.drafts.at(-1)!.version} saved by the agent.</p>}

            <article id="print-area" className="doc-paper rounded-sm px-10 py-12 md:px-14">
              <p className="mb-8 border-l-2 border-accent pl-3 font-sans text-xs italic text-accent">{DISCLAIMER}</p>
              <div className="whitespace-pre-wrap leading-relaxed">
                {segs.map((s, i) => s.kind === "text" ? <span key={i}>{s.text}</span>
                  : s.kind === "value" ? <mark key={i} className="rounded-sm bg-accent/10 px-0.5 text-foreground">{s.text}</mark>
                  : <span key={i} className="rounded-sm border border-dashed border-muted-foreground/50 px-1 font-sans text-xs text-muted-foreground print:border-0">[{s.label}]</span>)}
              </div>
              {(approved.length > 0 || proposed.length > 0) && (
                <div className="mt-8 space-y-5">
                  <h3 className="font-semibold tracking-wide">ADDITIONAL CLAUSES</h3>
                  {approved.map((c, i) => (
                    <div key={c.id}><p className="font-semibold">A{i + 1}. {c.title.toUpperCase()} <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 font-sans text-[10px] font-normal text-secondary-foreground print:hidden">user-approved</span></p><p className="whitespace-pre-wrap">{c.body}</p></div>
                  ))}
                  {proposed.map((c) => (
                    <div key={c.id} className="rounded-md border border-dashed border-accent/60 bg-accent/5 p-4 print:hidden">
                      <p className="font-sans text-[11px] uppercase tracking-wider text-accent">Proposed by {c.source === "agent" ? "agent (AI-drafted)" : "agent from clause library"} — not in your document yet</p>
                      <p className="mt-1 font-semibold">{c.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{c.body}</p>
                      {c.warnings.length > 0 && <ul className="mt-2 list-disc pl-5 font-sans text-xs text-warning-foreground">{c.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
                      <div className="mt-3 flex gap-2 font-sans">
                        <Button size="sm" onClick={() => onDecide(c.id, "approved")}><Check className="h-3.5 w-3.5" /> Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => onDecide(c.id, "rejected")}><X className="h-3.5 w-3.5" /> Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
            {session.clauses.some((c) => c.status === "rejected") && (
              <p className="text-xs text-muted-foreground">Rejected: {session.clauses.filter((c) => c.status === "rejected").map((c) => c.title).join(", ")}</p>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}

function Banner({ tone, children }: { tone: "warn" | "danger"; children: React.ReactNode }) {
  return <p className={`flex gap-2 rounded-md p-3 text-sm ${tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-warning text-warning-foreground"}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{children}</p>;
}

function ChatMessage({ m }: { m: UIMessage }) {
  if (m.role === "user") {
    const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return <div className="ml-auto max-w-[85%] rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground">{text}</div>;
  }
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><Gavel className="h-3.5 w-3.5" /></div>
      <div className="min-w-0 flex-1 space-y-2 text-sm">
        {m.parts.map((p, i) => {
          if (p.type === "text") return <div key={i} className="prose prose-sm max-w-none [&_p]:my-1"><ReactMarkdown>{p.text}</ReactMarkdown></div>;
          if (p.type === "reasoning") return p.text ? <details key={i} className="text-xs text-muted-foreground"><summary className="cursor-pointer">Thinking</summary><p className="mt-1 whitespace-pre-wrap">{p.text}</p></details> : null;
          if (p.type.startsWith("tool-")) {
            const name = p.type.slice(5);
            const state = (p as { state?: string }).state;
            const running = state === "input-streaming" || state === "input-available";
            const failed = state === "output-error";
            return (
              <div key={i} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${failed ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"}`}>
                {running ? <Loader2 className="h-3 w-3 animate-spin" /> : failed ? <X className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                {TOOL_LABEL[name] ?? name}{running ? "…" : failed ? " failed" : ""}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
