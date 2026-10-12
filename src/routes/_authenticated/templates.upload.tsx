import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/legal/SiteShell";
import { registerTemplate } from "@/lib/legal/uploads.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/templates/upload")({
  head: () => ({
    meta: [
      { title: "Upload your template — Clausewell" },
      { name: "description", content: "Upload a DOCX or PDF template and let the assistant review, add and remove clauses with your approval." },
      { property: "og:title", content: "Upload your template — Clausewell" },
      { property: "og:description", content: "AI-assisted clause review for your own templates. Not legal advice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Upload,
});

async function extractText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  if (file.name.toLowerCase().endsWith(".pdf")) {
    const { extractText: ex, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await ex(pdf, { mergePages: false });
    return (Array.isArray(text) ? text : [text]).join("\n\n");
  }
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value;
}

function Upload() {
  const { user } = useAuth();
  const register = useServerFn(registerTemplate);
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  async function handle(file: File) {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".docx") && !lower.endsWith(".pdf")) return toast.error("Please choose a DOCX or PDF file.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Files must be 10 MB or smaller.");
    if (!user) return;
    try {
      setBusy("Reading your file…");
      const text = (await extractText(file)).trim();
      if (text.length < 20) throw new Error("No readable text found. Scanned PDFs aren't supported yet.");
      setBusy("Storing the original…");
      const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error } = await supabase.storage.from("templates").upload(path, file, { contentType: file.type || undefined });
      if (error) throw new Error("Upload failed. Please try again.");
      setBusy("The assistant is reviewing each clause…");
      const { id } = await register({ data: { name: file.name.replace(/\.(docx|pdf)$/i, ""), filePath: path, mimeType: file.type || "application/octet-stream", text } });
      navigate({ to: "/templates/$templateId", params: { templateId: id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-xl py-6">
        <Link to="/templates" className="text-sm text-muted-foreground hover:text-foreground">← Your registered templates</Link>
        <h1 className="mt-3 text-4xl text-primary">Upload your template</h1>
        <p className="mt-3 text-muted-foreground">DOCX or text-based PDF. We keep your original file unchanged; the assistant suggests changes you approve one by one.</p>
        <label className="mt-8 flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-card p-12 text-center hover:border-primary">
          {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <FileUp className="h-6 w-6 text-primary" />}
          <span className="font-medium">{busy ?? "Choose a file"}</span>
          <span className="text-xs text-muted-foreground">.docx or .pdf · up to 10 MB</span>
          <input type="file" accept=".docx,.pdf" className="sr-only" disabled={!!busy} onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
        </label>
        <p className="mt-6 text-xs text-muted-foreground">Clause statuses are suggestions, not legal advice. Have a lawyer review anything important.</p>
      </div>
    </SiteShell>
  );
}
