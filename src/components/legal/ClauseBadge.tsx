import { clauseBadge, type Clause } from "@/lib/legal/uploads";

const TONES = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-secondary text-secondary-foreground",
} as const;

export function ClauseBadge({ clause }: { clause: Clause }) {
  const b = clauseBadge(clause);
  if (!b) return null;
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONES[b.tone]}`}>{b.label}</span>;
}
