import { COMMON_FIELD_IDS } from "./defs";
import { z } from "zod";

const IDS = "clausewell.sessions.v2";
const PROFILE = "clausewell.profile.v2";
const NAMES = "clausewell.session-names.v1";

export const documentNameSchema = z.string().trim().min(1, "Enter a document name.").max(120, "Use 120 characters or fewer.").regex(/^[^\u0000-\u001f\u007f]+$/, "Use a name without control characters.");
export const loadSessionNames = () => {
  const result = z.record(z.string().uuid(), documentNameSchema).safeParse(read<unknown>(NAMES, {}));
  return result.success ? result.data : {};
};
export function renameSavedSession(id: string, name: string) {
  const sessionId = z.string().uuid().parse(id);
  const validName = documentNameSchema.parse(name);
  if (!mySessionIds().includes(sessionId)) throw new Error("Document is not saved in this browser.");
  localStorage.setItem(NAMES, JSON.stringify({ ...loadSessionNames(), [sessionId]: validName }));
  return validName;
}

const read = <T,>(k: string, d: T): T => {
  if (typeof window === "undefined") return d;
  try { return (JSON.parse(localStorage.getItem(k) ?? "null") as T) ?? d; } catch { return d; }
};

export const mySessionIds = () => read<string[]>(IDS, []);
export const rememberSession = (id: string) => localStorage.setItem(IDS, JSON.stringify([id, ...mySessionIds().filter((x) => x !== id)].slice(0, 100)));
export const forgetSession = (id: string) => localStorage.setItem(IDS, JSON.stringify(mySessionIds().filter((x) => x !== id)));

export const loadProfile = () => read<Record<string, unknown>>(PROFILE, {});
/** Remember common answers (parties, jurisdiction…) so they're never asked twice. */
export function rememberCommonAnswers(answers: Record<string, unknown>) {
  const p = loadProfile();
  for (const [k, v] of Object.entries(answers)) if (COMMON_FIELD_IDS.has(k) && k !== "effective_date") p[k] = v;
  localStorage.setItem(PROFILE, JSON.stringify(p));
}
