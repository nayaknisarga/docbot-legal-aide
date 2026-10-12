ALTER TABLE public.template_clauses
ADD COLUMN sources JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.template_clauses.sources IS 'Verified legal research sources attached to AI-proposed clause changes.';