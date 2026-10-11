import type { Answers } from "./types";

/** Browser-local persistence for slice 1. Replace with server tables + tenant isolation (see docs/IMPLEMENTATION_STATUS.md). */
export interface DraftVersion {
  version: number;
  createdAt: string;
  title: string;
  body: string;
  templateVersion: number;
}
export interface DraftSession {
  id: string;
  docSlug: string;
  jurisdiction: string;
  answers: Answers;
  status: "intake" | "needs_information" | "ready_for_generation" | "generated";
  versions: DraftVersion[];
  updatedAt: string;
}

const SESSIONS = "legaldraft.sessions.v1";
const PROFILE = "legaldraft.profile.v1";

const read = <T,>(k: string, d: T): T => {
  if (typeof window === "undefined") return d;
  try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; }
};

export const loadSessions = () => read<DraftSession[]>(SESSIONS, []);
export const loadSession = (id: string) => loadSessions().find((s) => s.id === id);
export function saveSession(s: DraftSession) {
  const all = loadSessions().filter((x) => x.id !== s.id);
  localStorage.setItem(SESSIONS, JSON.stringify([{ ...s, updatedAt: new Date().toISOString() }, ...all]));
}
export function deleteSession(id: string) {
  localStorage.setItem(SESSIONS, JSON.stringify(loadSessions().filter((x) => x.id !== id)));
}
export const loadProfile = () => read<Answers>(PROFILE, {});
export function saveProfile(p: Answers) {
  localStorage.setItem(PROFILE, JSON.stringify({ ...loadProfile(), ...p }));
}
