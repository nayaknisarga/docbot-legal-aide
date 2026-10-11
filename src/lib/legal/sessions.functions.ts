import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COMMON_FIELD_IDS, coerceAnswer, getDocType, questionsFor, type Answers } from "./defs";

/**
 * Sessions are addressed by an unguessable UUID kept in the user's browser (no accounts yet).
 * All reads/writes are scoped to that id server-side. See docs/IMPLEMENTATION_STATUS.md.
 */

export const createSession = createServerFn({ method: "POST" })
  .inputValidator((i: { templateId: string; profile: Record<string, unknown> }) =>
    z.object({ templateId: z.string(), profile: z.record(z.unknown()) }).parse(i))
  .handler(async ({ data }) => {
    const doc = getDocType(data.templateId);
    if (!doc) throw new Error("Unknown template");
    // Reuse previously given common answers, re-validated against this template's questions.
    const answers: Answers = {};
    for (const q of questionsFor(doc)) {
      if (!COMMON_FIELD_IDS.has(q.fieldId) || data.profile[q.fieldId] === undefined) continue;
      const c = coerceAnswer(q, data.profile[q.fieldId]);
      if (c.ok) answers[q.fieldId] = c.value;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("doc_sessions").insert({ template_id: doc.id, answers }).select("id").single();
    if (error) throw new Error("Could not create session");
    return { id: row.id };
  });

export const getSession = createServerFn({ method: "GET" })
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { loadSessionData } = await import("./agent.server");
    const d = await loadSessionData(data.id);
    if (!d) return null;
    return {
      id: d.session.id,
      templateId: d.session.template_id,
      status: d.session.status,
      answers: d.answers as Record<string, string | number | boolean | string[]>,
      messagesJson: JSON.stringify(d.session.messages ?? []),
      clauses: d.clauses.map((c) => ({ id: c.id, title: c.title, body: c.body, status: c.status as "proposed" | "approved" | "rejected", source: c.source as "agent" | "library", warnings: (c.warnings ?? []) as string[], requirement: c.requirement })),
      drafts: d.drafts.map((x) => ({ version: x.version, createdAt: x.created_at })),
    };
  });

export const listSessions = createServerFn({ method: "POST" })
  .inputValidator((i: { ids: string[] }) => z.object({ ids: z.array(z.string().uuid()).max(100) }).parse(i))
  .handler(async ({ data }) => {
    if (!data.ids.length) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("doc_sessions").select("id, template_id, status, updated_at").in("id", data.ids).order("updated_at", { ascending: false });
    if (error) throw new Error("Could not load documents");
    return rows.map((r) => ({ id: r.id, templateId: r.template_id, status: r.status, updatedAt: r.updated_at }));
  });

/** The ONLY path that can approve/reject a clause — a direct user action, never the agent. */
export const decideClause = createServerFn({ method: "POST" })
  .inputValidator((i: { sessionId: string; clauseId: string; decision: "approved" | "rejected" }) =>
    z.object({ sessionId: z.string().uuid(), clauseId: z.string().uuid(), decision: z.enum(["approved", "rejected"]) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("session_clauses")
      .update({ status: data.decision, approved_at: data.decision === "approved" ? new Date().toISOString() : null })
      .eq("id", data.clauseId).eq("session_id", data.sessionId).eq("status", "proposed")
      .select("id").maybeSingle();
    if (error) throw new Error("Could not update clause");
    if (!row) throw new Error("Clause is not awaiting a decision");
    return { ok: true };
  });

export const getLatestDraft = createServerFn({ method: "GET" })
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("generated_drafts").select("version, body").eq("session_id", data.id).order("version", { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error("Could not load draft");
    return row;
  });
