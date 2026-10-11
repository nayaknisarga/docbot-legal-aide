import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, FileText, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { SiteShell, RiskBadge, DemoBadge } from "@/components/legal/SiteShell";
import { getDocumentType, JURISDICTIONS } from "@/lib/legal/catalog";
import { prefillFromProfile, validateSession, visibleFields, validateField } from "@/lib/legal/questionnaire";
import { generateDraft } from "@/lib/legal/render";
import { loadProfile, loadSession, saveProfile, saveSession, type DraftSession } from "@/lib/legal/storage";
import { exportDocx } from "@/lib/legal/export";
import type { Answers, FieldDefinition } from "@/lib/legal/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/documents/$slug")({
  validateSearch: (s: Record<string, unknown>) => ({ session: typeof s.session === "string" ? s.session : undefined }),
  loader: ({ params }) => {
    const doc = getDocumentType(params.slug);
    if (!doc) throw notFound();
    return { name: doc.name, description: doc.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Document"} — Clausewell` },
      { name: "description", content: loaderData?.description ?? "Prepare a legal document draft." },
      { property: "og:title", content: `${loaderData?.name ?? "Document"} — Clausewell` },
      { property: "og:description", content: loaderData?.description ?? "Prepare a legal document draft." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentPage,
});

const GROUPS: { key: FieldDefinition["group"]; title: string }[] = [
  { key: "common", title: "About you" },
  { key: "specific", title: "Document details" },
  { key: "conditional", title: "Follow-up" },
];

function DocumentPage() {
  const { slug } = Route.useParams();
  const { session: sessionId } = Route.useSearch();
  const doc = getDocumentType(slug)!;
  const [id, setId] = useState<string>("");
  const [answers, setAnswers] = useState<Answers>({});
  const [jurisdiction, setJurisdiction] = useState<string>("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [draft, setDraft] = useState<ReturnType<typeof generateDraft> | null>(null);
  const [existing, setExisting] = useState<DraftSession | undefined>();

  useEffect(() => {
    const s = sessionId ? loadSession(sessionId) : undefined;
    if (s && s.docSlug === slug) {
      setId(s.id); setAnswers(s.answers); setJurisdiction(s.jurisdiction); setExisting(s);
    } else {
      setId(crypto.randomUUID());
      setAnswers(prefillFromProfile(doc, {}, loadProfile()));
    }
  }, [sessionId, slug, doc]);

  const v = useMemo(() => validateSession(doc, answers, jurisdiction), [doc, answers, jurisdiction]);
  const fields = visibleFields(doc, answers);
  const requiredCount = fields.filter((f) => f.required).length;
  const done = requiredCount - v.missing.length;
  const j = JURISDICTIONS.find((x) => x.code === jurisdiction);

  const set = (fid: string, val: Answers[string]) => { setAnswers((a) => ({ ...a, [fid]: val })); setDraft(null); };

  function persist(extra?: Partial<DraftSession>) {
    const base: DraftSession = existing ?? { id, docSlug: slug, jurisdiction, answers, status: "intake", versions: [], updatedAt: "" };
    const s: DraftSession = { ...base, jurisdiction, answers, status: v.ok ? "ready_for_generation" : "needs_information", ...extra };
    saveSession(s); setExisting(s);
    const profile: Answers = {};
    doc.fields.filter((f) => f.reusable && answers[f.id] !== undefined).forEach((f) => (profile[f.id] = answers[f.id]));
    saveProfile(profile);
    return s;
  }

  function onGenerate() {
    setAttempted(true);
    if (!v.ok) { toast.error("Please complete the highlighted questions."); persist(); return; }
    const d = generateDraft(doc, answers, jurisdiction);
    setDraft(d);
    const s = existing;
    const version = (s?.versions.length ?? 0) + 1;
    persist({ status: "generated", versions: [...(s?.versions ?? []), { version, createdAt: new Date().toISOString(), title: d.title, body: d.body, templateVersion: d.templateVersion }] });
    toast.success(`Draft version ${version} saved`);
    setTimeout(() => document.getElementById("print-area")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <SiteShell>
      <div className="mb-8 print:hidden">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← All documents</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="text-4xl text-primary">{doc.name}</h1><RiskBadge level={doc.riskLevel} /><DemoBadge /></div>
        <p className="mt-2 text-muted-foreground">{doc.description}</p>
        {doc.riskNote && <p className="mt-4 flex gap-2 rounded-md bg-warning p-3 text-sm text-warning-foreground"><AlertTriangle className="h-4 w-4 shrink-0" />{doc.riskNote}</p>}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_280px] print:block">
        <div className="space-y-10 print:hidden">
          <section>
            <h2 className="mb-3 text-xl">Jurisdiction</h2>
            <select value={jurisdiction} onChange={(e) => { setJurisdiction(e.target.value); setDraft(null); }} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
              <option value="">Choose where this document will apply…</option>
              {JURISDICTIONS.map((x) => <option key={x.code} value={x.code}>{x.name}{x.support === "unsupported" ? " (not supported)" : ""}</option>)}
            </select>
            {j && <p className={`mt-2 text-sm ${j.support === "unsupported" ? "text-destructive" : "text-muted-foreground"}`}>{j.note}</p>}
          </section>

          {GROUPS.map((g) => {
            const gf = fields.filter((f) => f.group === g.key);
            if (!gf.length) return null;
            return (
              <section key={g.key}>
                <h2 className="mb-4 text-xl">{g.title}</h2>
                <div className="space-y-5">
                  {gf.map((f) => (
                    <FieldInput key={f.id} field={f} value={answers[f.id]} onChange={(val) => set(f.id, val)} onBlur={() => setTouched((t) => ({ ...t, [f.id]: true }))}
                      error={(touched[f.id] || attempted) ? validateField(f, answers[f.id]) : null} />
                  ))}
                </div>
              </section>
            );
          })}

          {(attempted || v.crossErrors.length > 0) && v.crossErrors.length > 0 && (
            <ul className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{v.crossErrors.map((e) => <li key={e}>{e}</li>)}</ul>
          )}
        </div>

        <aside className="print:hidden">
          <div className="sticky top-6 space-y-4 rounded-lg border border-border bg-card p-5">
            <div>
              <div className="flex justify-between text-sm"><span>Required answers</span><span>{done}/{requiredCount}</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${requiredCount ? (done / requiredCount) * 100 : 0}%` }} /></div>
            </div>
            <Button className="w-full" onClick={onGenerate}><FileText className="h-4 w-4" /> Generate draft</Button>
            <Button variant="outline" className="w-full" onClick={() => { persist(); toast.success("Progress saved"); }}><Save className="h-4 w-4" /> Save progress</Button>
            {attempted && !v.ok && <p className="text-xs text-destructive">{v.jurisdictionError ?? `${v.missing.length} required answer(s) missing or invalid.`}</p>}
            <p className="text-xs text-muted-foreground">Template v{doc.template.version} · demo, unreviewed. Your name and address are remembered in this browser for next time.</p>
          </div>
        </aside>
      </div>

      {draft && (
        <section className="mt-14">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <h2 className="text-2xl text-primary">Your draft</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportDocx(draft.title, draft.body, draft.disclaimer, doc.slug)}><Download className="h-4 w-4" /> DOCX</Button>
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> PDF</Button>
            </div>
          </div>
          <p className="mb-4 text-xs text-muted-foreground print:hidden">Export layout is simplified and may differ from the preview. {draft.jurisdictionNote}</p>
          <article id="print-area" className="doc-paper mx-auto max-w-3xl rounded-sm px-10 py-12 md:px-16">
            {draft.disclaimer && <p className="mb-8 border-l-2 border-accent pl-3 font-sans text-xs italic text-accent">{draft.disclaimer}</p>}
            <h3 className="mb-8 text-center text-xl font-semibold tracking-wide">{draft.title}</h3>
            <div className="whitespace-pre-wrap leading-relaxed">{draft.body}</div>
          </article>
        </section>
      )}
    </SiteShell>
  );
}

function FieldInput({ field, value, onChange, onBlur, error }: { field: FieldDefinition; value: Answers[string]; onChange: (v: Answers[string]) => void; onBlur: () => void; error: string | null }) {
  const id = `f-${field.id}`;
  let control;
  if (field.type === "textarea") control = <Textarea id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} rows={3} />;
  else if (field.type === "boolean") control = (
    <div className="flex gap-2">
      {[true, false].map((b) => (
        <button key={String(b)} type="button" onClick={() => { onChange(b); onBlur(); }} className={`rounded-md border px-4 py-1.5 text-sm ${value === b ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}>{b ? "Yes" : "No"}</button>
      ))}
    </div>
  );
  else if (field.type === "select") control = (
    <select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || undefined)} onBlur={onBlur} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
      <option value="">Choose…</option>
      {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  else control = <Input id={id} type={field.type === "number" ? "number" : field.type} value={value === undefined ? "" : String(value)} onBlur={onBlur}
    onChange={(e) => onChange(field.type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)} />;
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block">{field.label}{field.required && <span className="text-accent"> *</span>}</Label>
      {field.help && <p className="mb-1.5 text-xs text-muted-foreground">{field.help}</p>}
      {control}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
