CREATE TABLE public.uploaded_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  file_path text NOT NULL,
  mime_type text NOT NULL,
  original_text text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'new',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uploaded_templates TO authenticated;
GRANT ALL ON public.uploaded_templates TO service_role;
ALTER TABLE public.uploaded_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own templates" ON public.uploaded_templates FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.template_clauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.uploaded_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  position int NOT NULL,
  heading text NOT NULL DEFAULT '',
  body text NOT NULL,
  origin text NOT NULL DEFAULT 'original' CHECK (origin IN ('original','added')),
  action text NOT NULL DEFAULT 'keep' CHECK (action IN ('keep','add','remove')),
  verdict text NOT NULL DEFAULT 'review' CHECK (verdict IN ('allowed','review','blocked')),
  decision text NOT NULL DEFAULT 'none' CHECK (decision IN ('none','pending','approved','skipped')),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_clauses TO authenticated;
GRANT ALL ON public.template_clauses TO service_role;
ALTER TABLE public.template_clauses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clauses" ON public.template_clauses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own template files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'templates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own template files insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'templates' AND (storage.foldername(name))[1] = auth.uid()::text);