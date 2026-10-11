import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { SiteShell, RiskBadge, DemoBadge } from "@/components/legal/SiteShell";
import { CATEGORIES, DISCLAIMER, DOC_TYPES, getDocType } from "@/lib/legal/defs";
import { createSession, listSessions } from "@/lib/legal/sessions.functions";
import { loadProfile, mySessionIds, rememberSession } from "@/lib/legal/local";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clausewell — Legal document templates with an AI drafting agent" },
      { name: "description", content: "Pick a template and let an AI agent ask the questions while your draft fills in live." },
      { property: "og:title", content: "Clausewell — Legal document templates with an AI drafting agent" },
      { property: "og:description", content: "Pick a template and let an AI agent ask the questions while your draft fills in live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Mine = { id: string; templateId: string; status: string; updatedAt: string };

function Index() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [opening, setOpening] = useState<string | null>(null);
  const [mine, setMine] = useState<Mine[] | null>(null);
  const navigate = useNavigate();
  const create = useServerFn(createSession);
  const list = useServerFn(listSessions);

  useEffect(() => {
    if (tab !== "mine") return;
    setMine(null);
    list({ data: { ids: mySessionIds() } }).then(setMine).catch(() => { setMine([]); toast.error("Couldn't load your documents."); });
  }, [tab, list]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? DOC_TYPES.filter((d) => (d.name + " " + d.shortDescription).toLowerCase().includes(t)) : DOC_TYPES;
  }, [q]);

  async function open(templateId: string) {
    setOpening(templateId);
    try {
      const { id } = await create({ data: { templateId, profile: loadProfile() } });
      rememberSession(id);
      navigate({ to: "/d/$sessionId", params: { sessionId: id } });
    } catch {
      toast.error("Couldn't start this document. Please try again.");
      setOpening(null);
    }
  }

  return (
    <SiteShell>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl text-primary">Legal documents</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">Choose a template. An AI agent asks the questions one at a time while your draft fills in beside it.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" className="pl-9" aria-label="Search templates" />
        </div>
      </div>

      <div className="mt-8 flex gap-6 border-b border-border" role="tablist">
        {(["all", "mine"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 text-sm ${tab === t ? "border-accent font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "all" ? "All" : "Your documents"}
          </button>
        ))}
      </div>

      {tab === "all" ? (
        <div className="mt-8 space-y-12">
          {CATEGORIES.map((c) => {
            const docs = filtered.filter((d) => d.categories.includes(c.id));
            if (!docs.length) return null;
            return (
              <section key={c.id}>
                <h2 className="mb-4 text-xl">{c.name}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {docs.map((d) => (
                    <button key={c.id + d.id} onClick={() => open(d.id)} disabled={!!opening}
                      className="group flex flex-col rounded-lg border border-border bg-card p-5 text-left transition hover:border-accent hover:shadow-sm disabled:opacity-60">
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
                        {opening === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <span className="font-serif text-lg leading-snug">{d.name}</span>
                      <span className="mt-1 flex-1 text-sm text-muted-foreground">{d.shortDescription}</span>
                      <span className="mt-4 flex flex-wrap gap-2"><RiskBadge level={d.riskLevel} /><DemoBadge /><span className="text-xs text-muted-foreground">{d.jurisdiction.join(" · ")}</span></span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
          {!filtered.length && <p className="text-sm text-muted-foreground">No templates match "{q}". Try another word — or describe your need to the agent inside any template.</p>}
        </div>
      ) : (
        <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
          {mine === null && <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
          {mine?.length === 0 && <p className="p-6 text-sm text-muted-foreground">You haven't started any documents in this browser yet.</p>}
          {mine?.map((s) => (
            <Link key={s.id} to="/d/$sessionId" params={{ sessionId: s.id }} className="flex items-center justify-between p-4 hover:bg-muted/50">
              <span className="font-serif text-lg">{getDocType(s.templateId)?.name ?? s.templateId}</span>
              <span className="text-xs text-muted-foreground">{s.status} · {new Date(s.updatedAt).toLocaleString()}</span>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-16 text-center text-xs text-muted-foreground">{DISCLAIMER}</p>
    </SiteShell>
  );
}
