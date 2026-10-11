import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { SiteShell } from "@/components/legal/SiteShell";
import { deleteSession, loadSessions, type DraftSession } from "@/lib/legal/storage";
import { getDocumentType } from "@/lib/legal/catalog";

export const Route = createFileRoute("/drafts")({
  head: () => ({
    meta: [
      { title: "My drafts — Clausewell" },
      { name: "description", content: "Continue or revisit your saved legal document drafts." },
      { property: "og:title", content: "My drafts — Clausewell" },
      { property: "og:description", content: "Continue or revisit your saved legal document drafts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Drafts,
});

function Drafts() {
  const [list, setList] = useState<DraftSession[]>([]);
  useEffect(() => setList(loadSessions()), []);
  return (
    <SiteShell>
      <h1 className="text-3xl text-primary">My drafts</h1>
      <p className="mt-1 text-sm text-muted-foreground">Saved in this browser only.</p>
      <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
        {list.length === 0 && <p className="p-6 text-sm text-muted-foreground">No drafts yet. <Link to="/" className="text-accent">Start one</Link>.</p>}
        {list.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-4">
            <Link to="/documents/$slug" params={{ slug: s.docSlug }} search={{ session: s.id }} className="flex-1">
              <div className="font-serif text-lg">{getDocumentType(s.docSlug)?.name ?? s.docSlug}</div>
              <div className="text-xs text-muted-foreground">{s.status.replace(/_/g, " ")} · {s.versions.length} version(s) · updated {new Date(s.updatedAt).toLocaleString()}</div>
            </Link>
            <button aria-label="Delete draft" onClick={() => { deleteSession(s.id); setList(loadSessions()); }} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </SiteShell>
  );
}
