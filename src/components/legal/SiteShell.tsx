import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Scale } from "lucide-react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-primary">
            <Scale className="h-5 w-5 text-accent" /> Clausewell
          </Link>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }} activeOptions={{ exact: true }}>Browse</Link>
            <Link to="/assistant" className="hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Assistant</Link>
            <Link to="/drafts" className="hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>My drafts</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground print:hidden">
        Clausewell provides document drafts, not legal advice. Demo templates have not been reviewed by a lawyer.
      </footer>
    </div>
  );
}

export function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const cls = level === "high" ? "bg-destructive/10 text-destructive" : level === "medium" ? "bg-warning text-warning-foreground" : "bg-secondary text-secondary-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{level} risk</span>;
}

export function DemoBadge() {
  return <span className="rounded-full border border-accent/40 px-2 py-0.5 text-xs text-accent">Demo · not lawyer-reviewed</span>;
}
