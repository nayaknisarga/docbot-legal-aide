import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Check, FileText, Loader2, Pencil, Search, X } from "lucide-react";
import { toast } from "sonner";
import { SiteShell, RiskBadge, DemoBadge } from "@/components/legal/SiteShell";
import { CATEGORIES, DISCLAIMER, DOC_TYPES, getDocType } from "@/lib/legal/defs";
import { createSession, listSessions } from "@/lib/legal/sessions.functions";
import {
  documentNameSchema,
  loadProfile,
  loadSessionNames,
  mySessionIds,
  rememberSession,
  renameSavedSession,
} from "@/lib/legal/local";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DiscoveryChat } from "@/components/legal/DiscoveryChat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clausewell — Find the right legal document" },
      {
        name: "description",
        content:
          "Describe your situation to find suitable legal document drafts, or browse Clausewell's template catalogue. Demo content is not lawyer-reviewed.",
      },
      { property: "og:title", content: "Clausewell — Find the right legal document" },
      {
        property: "og:description",
        content:
          "Find document templates with a conversational assistant or browse by category. Drafts only, not legal advice.",
      },
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
  const [names, setNames] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const navigate = useNavigate();
  const create = useServerFn(createSession);
  const list = useServerFn(listSessions);

  useEffect(() => {
    if (tab !== "mine") return;
    setNames(loadSessionNames());
    setMine(null);
    list({ data: { ids: mySessionIds() } })
      .then(setMine)
      .catch(() => {
        setMine([]);
        toast.error("Couldn't load your documents.");
      });
  }, [tab, list]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t
      ? DOC_TYPES.filter((d) => (d.name + " " + d.shortDescription).toLowerCase().includes(t))
      : DOC_TYPES;
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

  function saveName(id: string) {
    const result = documentNameSchema.safeParse(name);
    if (!result.success) {
      setNameError(result.error.issues[0]?.message ?? "Enter a valid name.");
      return;
    }
    try {
      const saved = renameSavedSession(id, result.data);
      setNames((previous) => ({ ...previous, [id]: saved }));
      setEditing(null);
      toast.success("Document renamed.");
    } catch {
      setNameError("Couldn't save the name. Please try again.");
    }
  }

  return (
    <SiteShell>
      <DiscoveryChat onStart={open} opening={opening} />
      <section className="border-t border-border pt-8" aria-labelledby="browse-title">
        <div>
          <div>
            <h2 id="browse-title" className="text-3xl text-primary sm:text-4xl">
              Or browse all templates
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild className="h-11 px-5">
                <Link to="/templates/upload">Upload your template</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 bg-card px-5">
                <Link to="/templates">Check your registered templates</Link>
              </Button>
            </div>
          </div>
          <div className="relative mt-4 w-full">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates"
              className="h-11 bg-card pl-11"
              aria-label="Search templates"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-6 border-b border-border" role="tablist">
          {(["all", "mine"] as const).map((t) => (
            <Button
              variant="ghost"
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px h-auto rounded-none border-b-2 px-0 pb-3 hover:bg-transparent hover:text-foreground ${tab === t ? "border-accent font-medium text-foreground" : "border-transparent text-muted-foreground"}`}
            >
              {t === "all" ? "All" : "Your documents"}
            </Button>
          ))}
        </div>

        {tab === "all" ? (
          <div className="mt-6 space-y-12">
            {CATEGORIES.map((c) => {
              const docs = filtered.filter((d) => d.categories.includes(c.id));
              if (!docs.length) return null;
              return (
                <section key={c.id}>
                  <h2 className="mb-4 text-2xl">{c.name}</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {docs.map((d) => (
                      <Button
                        variant="outline"
                        key={c.id + d.id}
                        onClick={() => open(d.id)}
                        disabled={!!opening}
                        className="group flex h-auto min-h-44 flex-col items-stretch justify-start gap-0 whitespace-normal rounded-lg border border-border bg-card p-5 text-left font-normal transition hover:border-primary hover:bg-card hover:text-foreground hover:shadow-sm disabled:opacity-60"
                      >
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
                          {opening === d.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>
                        <span className="font-serif text-lg leading-snug">{d.name}</span>
                        <span className="mt-1 flex-1 text-sm text-muted-foreground">
                          {d.shortDescription}
                        </span>
                        <span className="mt-4 flex flex-wrap gap-2">
                          <RiskBadge level={d.riskLevel} />
                          <DemoBadge />
                          <span className="text-xs text-muted-foreground">
                            {d.jurisdiction.join(" · ")}
                          </span>
                        </span>
                      </Button>
                    ))}
                  </div>
                </section>
              );
            })}
            {!filtered.length && (
              <p className="text-sm text-muted-foreground">
                No templates match "{q}". Try another word — or describe your need to the agent
                inside any template.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
            {mine === null && (
              <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            )}
            {mine?.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">
                You haven't started any documents in this browser yet.
              </p>
            )}
            {mine?.map((s) => {
              const displayName = names[s.id] ?? getDocType(s.templateId)?.name ?? s.templateId;
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
                  {editing === s.id ? (
                    <form
                      className="flex min-w-0 flex-1 flex-wrap items-start gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveName(s.id);
                      }}
                    >
                      <div className="min-w-0 flex-1 basis-40">
                        <Input
                          autoFocus
                          aria-label="Document name"
                          maxLength={120}
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setNameError("");
                          }}
                          aria-invalid={!!nameError}
                          aria-describedby={nameError ? `name-error-${s.id}` : undefined}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setEditing(null);
                          }}
                        />
                        {nameError && (
                          <p
                            id={`name-error-${s.id}`}
                            role="alert"
                            className="mt-1 text-sm text-destructive"
                          >
                            {nameError}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        size="icon"
                        aria-label="Save document name"
                        title="Save name"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Cancel rename"
                        title="Cancel"
                        onClick={() => setEditing(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <Link
                        to="/d/$sessionId"
                        params={{ sessionId: s.id }}
                        className="min-w-0 flex-1 break-words font-serif text-lg hover:underline"
                      >
                        {displayName}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Rename ${displayName}`}
                        title="Rename document"
                        onClick={() => {
                          setEditing(s.id);
                          setName(displayName);
                          setNameError("");
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {s.status} · {new Date(s.updatedAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <p className="mt-16 text-center text-xs text-muted-foreground">{DISCLAIMER}</p>
    </SiteShell>
  );
}
