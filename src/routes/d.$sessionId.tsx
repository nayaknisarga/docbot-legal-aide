import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, Check, CheckCircle2, Download, Gavel, Loader2, Printer, Save, Square, Wrench, X } from "lucide-react";
import { toast } from "sonner";
import { SiteShell, RiskBadge } from "@/components/legal/SiteShell";
import { DISCLAIMER, getDocType, nextQuestion, renderDraft, renderSegments, validateAll, visibleQuestions, isEmpty, type Answers, type DocType } from "@/lib/legal/defs";
import { decideClause, getSession, saveAnswers, saveDraftVersion } from "@/lib/legal/sessions.functions";
import { rememberCommonAnswers, rememberSession } from "@/lib/legal/local";
import { exportDocx } from "@/lib/legal/export";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/d/$sessionId")({
  head: () => ({
    meta: [
      { title: "Drafting your document — Clausewell" },
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

function welcomeMessage(sessionId: string, doc: DocType, answers: Answers): UIMessage {
  const q = nextQuestion(doc, answers);
  const reused = Object.keys(answers).length > 0;
  const text = `Let's fill in your **${doc.name}**. I'll ask a few quick questions — answer in the box below and the draft updates on the right.${reused ? " I've reused answers you gave before." : ""}\n\n${q ? `First: **${q.label}**${q.options ? `\n\nOptions: ${q.options.join(" · ")}` : ""}${q.helpText ? `\n\n_${q.helpText}_` : ""}` : "Everything is already answered — review your draft on the right."}`;
  return { id: `welcome-${sessionId}`, role: "assistant", parts: [{ type: "text", text }] };
}

function Workspace({ session }: { session: SessionData }) {
  const doc = getDocType(session.templateId)!;
  const qc = useQueryClient();
  const decide = useServerFn(decideClause);
  const saveDraft = useServerFn(saveDraftVersion);
  const [input, setInput] = useState("");
  const [formMode, setFormMode] = useState(false);
  const [mobilePane, setMobilePane] = useState<"questions" | "draft">("questions");
  const [downloaded, setDownloaded] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  const initial = useMemo(() => {
    const stored = JSON.parse(session.messagesJson) as UIMessage[];
    return stored.length ? stored : [welcomeMessage(session.id, doc, session.answers)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/agent", body: { sessionId: session.id } }), [session.id]);
  const { messages, sendMessage, status, stop } = useChat({
    id: session.id,
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message || "The agent hit an error."),
    onFinish: () => qc.invalidateQueries({ queryKey: ["session", session.id] }),
  });
  const busy = status === "submitted" || status === "streaming";

  const toolDone = messages.flatMap((m) => m.parts).filter((p) => p.type.startsWith("tool-") && (p as { state?: string }).state === "output-available").length;
  useEffect(() => { if (toolDone) qc.invalidateQueries({ queryKey: ["session", session.id] }); }, [toolDone, qc, session.id]);
  useEffect(() => { rememberSession(session.id); rememberCommonAnswers(session.answers); }, [session.id, session.answers]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, status]);
  useEffect(() => { if (!busy && !formMode) ta.current?.focus(); }, [busy, formMode]);

  // Track which answers just changed so the draft can flash them.
  const prev = useRef<Answers | null>(null);
  const [flash, setFlash] = useState<Record<string, number>>({});
  useEffect(() => {
    const before = prev.current;
    prev.current = session.answers;
    if (!before) return;
    const changed = Object.keys(session.answers).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(session.answers[k]));
    if (changed.length) setFlash((f) => { const n = { ...f }; for (const k of changed) n[k] = (n[k] ?? 0) + 1; return n; });
  }, [session.answers]);

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
  const leftovers = renderDraft(doc, answers, session.clauses).leftovers;
  const complete = v.ok && leftovers.length === 0;
  const step = !complete ? 1 : downloaded ? 3 : 2;

  function download(kind: "docx" | "pdf") {
    if (!complete) {
      toast.warning(leftovers.length ? `${leftovers.length} gap(s) still in the draft — answer the remaining questions first.` : "Fix the flagged issues before downloading.");
      return;
    }
    setDownloaded(true);
    if (kind === "docx") { const d = renderDraft(doc, answers, session.clauses); exportDocx(doc.name, d.text, null, doc.id); }
    else window.print();
  }

  async function onSaveDraft() {
    try {
      const r = await saveDraft({ data: { sessionId: session.id } });
      await qc.invalidateQueries({ queryKey: ["session", session.id] });
      toast.success(r.saved ? `Draft v${r.version} saved` : "Progress saved — you can come back any time from Your documents.");
    } catch { toast.error("Couldn't save. Please try again."); }
  }

  return (
    <SiteShell wide>
      {/* Top bar: back, steps, save */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 print:hidden">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to templates</Link>
        <ol className="flex items-center gap-2 text-sm" aria-label="Progress">
          {["Answer questions", "Review draft", "Download"].map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${step === i + 1 ? "bg-primary text-primary-foreground" : step > i + 1 ? "text-accent" : "text-muted-foreground"}`} aria-current={step === i + 1 ? "step" : undefined}>
                {step > i + 1 ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{i + 1}.</span>} <span className="hidden sm:inline">{label}</span>
              </span>
              {i < 2 && <span className="text-muted-foreground">→</span>}
            </li>
          ))}
        </ol>
        <Button size="sm" variant="outline" onClick={onSaveDraft}><Save className="h-3.5 w-3.5" /> Save draft</Button>
      </div>

      {/* Mobile pane switch */}
      <div className="flex gap-1 border-b border-border p-2 lg:hidden print:hidden" role="tablist">
        {(["questions", "draft"] as const).map((p) => (
          <button key={p} role="tab" aria-selected={mobilePane === p} onClick={() => setMobilePane(p)}
            className={`flex-1 rounded-md py-2 text-sm ${mobilePane === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {p === "questions" ? `Questions (${done}/${vis.length})` : "Draft"}
          </button>
        ))}
      </div>

      <div className="grid lg:h-[calc(100vh-118px)] lg:grid-cols-[minmax(380px,460px)_1fr] print:block print:h-auto">
        {/* LEFT: agent chat */}
        <section className={`${mobilePane === "questions" ? "flex" : "hidden"} h-[calc(100vh-170px)] min-h-0 flex-col border-r border-border lg:flex lg:h-auto print:hidden`}>
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2"><h1 className="truncate text-xl">{doc.name}</h1><RiskBadge level={doc.riskLevel} /></div>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${vis.length ? (done / vis.length) * 100 : 0}%` }} /></div>
              <span className="tabular-nums">{done}/{vis.length}</span>
            </div>
            <label className="mt-3 flex cursor-pointer items-center justify-between text-sm">
              <span>Answer all at once</span>
              <Switch checked={formMode} onCheckedChange={setFormMode} aria-label="Answer all at once" />
            </label>
          </div>

          {formMode ? (
            <AllAtOnceForm key={JSON.stringify(answers)} sessionId={session.id} doc={doc} answers={answers}
              onDone={() => { setFormMode(false); sendMessage({ text: "I've filled in the form. What's next?" }); }} />
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {messages.map((m) => <ChatMessage key={m.id} m={m} />)}
                {status === "submitted" && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Agent is thinking…</div>}
                {complete && !busy && (
                  <div className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
                    <p className="font-medium text-accent">✓ All set — review your draft</p>
                    <p className="mt-1 text-muted-foreground">Check the document on the right, then download it. You can still ask me to add a clause.</p>
                    <Button size="sm" variant="outline" className="mt-2 lg:hidden" onClick={() => setMobilePane("draft")}>View draft</Button>
                  </div>
                )}
                <div ref={end} />
              </div>
              <div className="border-t border-border p-4">
                <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 pl-3 focus-within:border-accent">
                  <Textarea ref={ta} value={input} onChange={(e) => setInput(e.target.value)} rows={2} placeholder="Type your answer…" aria-label="Type your answer"
                    className="min-h-0 resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                  {busy ? <Button size="icon" variant="outline" className="h-10 w-10 shrink-0 rounded-full" onClick={() => stop()} aria-label="Stop"><Square className="h-4 w-4" /></Button>
                    : <Button size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={send} disabled={!input.trim()} aria-label="Send"><ArrowUp className="h-4 w-4" /></Button>}
                </div>
                <p className="mt-2 px-1 text-xs text-muted-foreground">The agent only proposes clauses — you approve them.</p>
              </div>
            </>
          )}
        </section>

        {/* RIGHT: live preview */}
        <section className={`${mobilePane === "draft" ? "block" : "hidden"} min-h-0 overflow-y-auto bg-muted/40 lg:block print:block print:overflow-visible print:bg-transparent`}>
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-warning/95 px-6 py-2.5 text-xs text-warning-foreground backdrop-blur print:hidden">
            <span className="flex items-center gap-2 font-medium"><AlertTriangle className="h-3.5 w-3.5" /> Drafts only · not legal advice · not lawyer-reviewed</span>
            <span className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!complete} title={complete ? "" : "Answer all questions first"} onClick={() => download("docx")}><Download className="h-3.5 w-3.5" /> DOCX</Button>
              <Button size="sm" variant="outline" disabled={!complete} title={complete ? "" : "Answer all questions first"} onClick={() => download("pdf")}><Printer className="h-3.5 w-3.5" /> PDF</Button>
            </span>
          </div>
          <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 md:px-6">
            {v.jurisdiction.code && !v.jurisdiction.supported && <Banner tone="danger">UNSUPPORTED: {answers["jurisdiction"] as string} isn't supported for this template ({doc.jurisdiction.join(", ")} only). A draft can't be generated — please consult a local lawyer.</Banner>}
            {v.jurisdiction.warning && <Banner tone="warn">{v.jurisdiction.warning}</Banner>}
            {v.conflicts.map((c) => <Banner key={c} tone="warn">{c}</Banner>)}
            {!complete && done === vis.length && leftovers.length > 0 && <Banner tone="warn">{leftovers.length} gap(s) remain in the draft — downloads stay locked until they're filled.</Banner>}
            {session.drafts.length > 0 && <p className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Draft v{session.drafts.at(-1)!.version} saved.</p>}

            <article id="print-area" className="doc-paper rounded-sm px-6 py-10 md:px-16 md:py-14">
              <p className="mb-10 border-l-2 border-accent pl-3 font-sans text-xs italic text-accent">{DISCLAIMER}</p>
              <div className="whitespace-pre-wrap text-[17px] leading-[1.9]">
                {segs.map((s, i) => s.kind === "text" ? <span key={i}>{s.text}</span>
                  : s.kind === "value" ? <span key={`${i}-${flash[s.fieldId] ?? 0}`} className={flash[s.fieldId] ? "animate-fill-flash" : ""}>{s.text}</span>
                  : <span key={i} className="mx-0.5 inline-block rounded-full border border-dashed border-muted-foreground/40 bg-muted/60 px-2.5 py-0 align-baseline font-sans text-xs leading-6 text-muted-foreground print:border-0 print:bg-transparent">{s.label}</span>)}
              </div>
              {(approved.length > 0 || proposed.length > 0) && (
                <div className="mt-10 space-y-6 text-[17px] leading-[1.9]">
                  <h3 className="font-semibold tracking-wide">ADDITIONAL CLAUSES</h3>
                  {approved.map((c, i) => (
                    <div key={c.id}><p className="font-semibold">A{i + 1}. {c.title.toUpperCase()} <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 font-sans text-[10px] font-normal text-secondary-foreground print:hidden">user-approved</span></p><p className="whitespace-pre-wrap">{c.body}</p></div>
                  ))}
                  {proposed.map((c) => (
                    <div key={c.id} className="rounded-lg border border-dashed border-accent/60 bg-accent/5 p-5 print:hidden">
                      <p className="font-sans text-[11px] uppercase tracking-wider text-accent">Suggestion from {c.source === "agent" ? "agent (AI-drafted)" : "clause library"} — not in your document until you approve</p>
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

function AllAtOnceForm({ sessionId, doc, answers, onDone }: { sessionId: string; doc: DocType; answers: Answers; onDone: () => void }) {
  const save = useServerFn(saveAnswers);
  const qc = useQueryClient();
  const [vals, setVals] = useState<Record<string, string | number | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const merged = { ...answers, ...vals } as Answers;
  const remaining = visibleQuestions(doc, merged).filter((q) => isEmpty(answers[q.fieldId]));

  async function submit() {
    setSaving(true);
    try {
      const withDefaults = { ...vals };
      for (const q of remaining) if (withDefaults[q.fieldId] === undefined && q.default !== undefined && !Array.isArray(q.default)) withDefaults[q.fieldId] = q.default;
      const r = await save({ data: { sessionId, values: withDefaults } });
      await qc.invalidateQueries({ queryKey: ["session", sessionId] });
      if (Object.keys(r.errors).length) { setErrors(r.errors); toast.warning("Some answers need fixing."); }
      else { toast.success("Answers saved"); onDone(); }
    } catch { toast.error("Couldn't save answers."); }
    finally { setSaving(false); }
  }

  if (!remaining.length) return <div className="p-6 text-sm text-muted-foreground">Everything is answered. Switch off the toggle to continue in chat.</div>;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {remaining.map((q) => {
          const id = `aa-${q.fieldId}`;
          const val = vals[q.fieldId] ?? (q.default as string | number | boolean | undefined);
          const set = (x: string | number | boolean) => setVals((v) => ({ ...v, [q.fieldId]: x }));
          return (
            <div key={q.fieldId}>
              <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{q.label}{q.required && <span className="text-accent"> *</span>}</label>
              {q.helpText && <p className="mb-1.5 text-xs text-muted-foreground">{q.helpText}</p>}
              {q.answerType === "boolean" ? (
                <div className="flex gap-2">{[true, false].map((b) => <button key={String(b)} type="button" onClick={() => set(b)} className={`rounded-full border px-4 py-1.5 text-sm ${val === b ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}>{b ? "Yes" : "No"}</button>)}</div>
              ) : q.answerType === "select" ? (
                <select id={id} value={String(val ?? "")} onChange={(e) => set(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                  <option value="">Choose…</option>{q.options?.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : q.answerType === "long_text" ? (
                <Textarea id={id} value={String(val ?? "")} onChange={(e) => set(e.target.value)} rows={3} />
              ) : (
                <Input id={id} type={q.answerType === "date" ? "date" : q.answerType === "number" || q.answerType === "money" ? "number" : "text"} value={val === undefined ? "" : String(val)}
                  onChange={(e) => set(q.answerType === "number" || q.answerType === "money" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} />
              )}
              {errors[q.fieldId] && <p className="mt-1 text-xs text-destructive">{errors[q.fieldId]}</p>}
            </div>
          );
        })}
      </div>
      <div className="border-t border-border p-4"><Button className="w-full" onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save answers & return to draft</Button></div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "warn" | "danger"; children: React.ReactNode }) {
  return <p className={`flex gap-2 rounded-md p-3 text-sm ${tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-warning text-warning-foreground"}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{children}</p>;
}

function ChatMessage({ m }: { m: UIMessage }) {
  if (m.role === "user") {
    const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] text-primary-foreground">{text}</div>;
  }
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><Gavel className="h-3.5 w-3.5" /></div>
      <div className="min-w-0 max-w-[90%] space-y-2 text-[15px]">
        {m.parts.map((p, i) => {
          if (p.type === "text") return p.text.trim() ? <div key={i} className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 leading-relaxed [&_p]:my-1.5 [&_strong]:font-semibold"><ReactMarkdown>{p.text}</ReactMarkdown></div> : null;
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
