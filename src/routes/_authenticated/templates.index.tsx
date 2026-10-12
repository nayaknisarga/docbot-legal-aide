import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/legal/SiteShell";
import { Button } from "@/components/ui/button";
import { listMyTemplates } from "@/lib/legal/uploads.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/templates/")({
  head: () => ({
    meta: [
      { title: "Your registered templates — Clausewell" },
      { name: "description", content: "Templates you've uploaded to Clausewell for AI-assisted clause review." },
      { property: "og:title", content: "Your registered templates — Clausewell" },
      { property: "og:description", content: "Templates you've uploaded for clause review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyTemplates,
});

type Row = { id: string; name: string; stage: string; updated_at: string };

function MyTemplates() {
  const list = useServerFn(listMyTemplates);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    list().then(setRows).catch(() => setErr("Couldn't load your templates."));
  }, [list]);

  return (
    <SiteShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to templates</Link>
          <h1 className="mt-2 text-3xl text-primary">Your registered templates</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}>Sign out</Button>
          <Button asChild><Link to="/templates/upload"><FileUp className="h-4 w-4" /> Upload your template</Link></Button>
        </div>
      </div>
      <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
        {err && <p className="p-6 text-sm text-destructive">{err}</p>}
        {!rows && !err && <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
        {rows?.length === 0 && <p className="p-6 text-sm text-muted-foreground">You haven't uploaded any templates yet.</p>}
        {rows?.map((r) => (
          <Link key={r.id} to="/templates/$templateId" params={{ templateId: r.id }} className="flex items-center justify-between p-4 hover:bg-muted/50">
            <span className="font-serif text-lg">{r.name}</span>
            <span className="text-xs text-muted-foreground">{r.stage === "done" ? "Reviewed" : "In review"} · {new Date(r.updated_at).toLocaleString()}</span>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
