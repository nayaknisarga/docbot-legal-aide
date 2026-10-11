import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, MessageSquareText, Search } from "lucide-react";
import { SiteShell, RiskBadge, DemoBadge } from "@/components/legal/SiteShell";
import { CATEGORIES, documentsInCategory, getDocumentType } from "@/lib/legal/catalog";
import { rankDocuments } from "@/lib/legal/discovery";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clausewell — Find the right legal document" },
      { name: "description", content: "Browse legal document categories or describe your situation to find the right draft." },
      { property: "og:title", content: "Clausewell — Find the right legal document" },
      { property: "og:description", content: "Browse legal document categories or describe your situation to find the right draft." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const navigate = useNavigate();
  const results = useMemo(() => rankDocuments(q), [q]);

  return (
    <SiteShell>
      <section className="grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-end">
        <div>
          <p className="mb-3 text-sm uppercase tracking-widest text-accent">Guided legal drafting</p>
          <h1 className="text-5xl font-medium leading-tight text-primary md:text-6xl">The right document,<br />asked the right way.</h1>
          <p className="mt-5 max-w-lg text-muted-foreground">Search, browse, or describe your situation. We ask only what's needed and build a draft you can review and export.</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <label className="text-sm font-medium">What do you need?</label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. a client hasn't paid my invoice" className="pl-9" />
          </div>
          {q && (
            <ul className="mt-3 space-y-1">
              {results.length ? results.map((r) => (
                <li key={r.slug}>
                  <Link to="/documents/$slug" params={{ slug: r.slug }} className="block rounded px-2 py-1.5 text-sm hover:bg-muted">{getDocumentType(r.slug)!.name}</Link>
                </li>
              )) : <li className="text-sm text-muted-foreground">No direct match — try the assistant.</li>}
            </ul>
          )}
          <Button variant="outline" className="mt-4 w-full" onClick={() => navigate({ to: "/assistant", search: q ? { q } : {} })}>
            <MessageSquareText className="h-4 w-4" /> Describe it to the assistant
          </Button>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-6 text-2xl text-primary">Browse by area</h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
          {CATEGORIES.map((c) => {
            const docs = documentsInCategory(c.slug);
            const isOpen = open === c.slug;
            return (
              <div key={c.slug} className="bg-card">
                <button onClick={() => setOpen(isOpen ? null : c.slug)} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/50" aria-expanded={isOpen}>
                  <span>
                    <span className="font-serif text-lg">{c.name}</span>
                    <span className="block text-sm text-muted-foreground">{c.description}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">{docs.length} available <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} /></span>
                </button>
                {isOpen && (
                  <div className="space-y-2 px-5 pb-5">
                    {docs.map((d) => (
                      <Link key={d.slug} to="/documents/$slug" params={{ slug: d.slug }} className="block rounded-md border border-border p-3 hover:border-accent">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{d.name}</span><RiskBadge level={d.riskLevel} /><DemoBadge /></div>
                        <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
                      </Link>
                    ))}
                    <p className="pt-1 text-xs text-muted-foreground">Planned: {c.children.filter((n) => !docs.some((d) => d.name.toLowerCase().includes(n.toLowerCase()))).join(" · ") || "—"}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}
