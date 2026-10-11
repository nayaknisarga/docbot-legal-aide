CREATE TABLE public.doc_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'intake',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.clause_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  purpose text NOT NULL,
  body text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  jurisdictions text[] NOT NULL DEFAULT '{}',
  is_jurisdiction_agnostic boolean NOT NULL DEFAULT false,
  review_status text NOT NULL DEFAULT 'demo_unreviewed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.session_clauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.doc_sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  requirement text,
  source text NOT NULL CHECK (source IN ('agent','library')),
  library_clause_id uuid REFERENCES public.clause_library(id),
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rejected')),
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.generated_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.doc_sessions(id) ON DELETE CASCADE,
  version integer NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, version)
);
GRANT ALL ON public.doc_sessions, public.clause_library, public.session_clauses, public.generated_drafts TO service_role;
ALTER TABLE public.doc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clause_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_drafts ENABLE ROW LEVEL SECURITY;

INSERT INTO public.clause_library (slug, title, purpose, body, tags, jurisdictions, is_jurisdiction_agnostic) VALUES
('non-solicitation-employees','Non-solicitation of employees','Stop the other party from hiring away your staff','For the term of this Agreement and twelve (12) months after it ends, neither party shall directly solicit for employment any employee of the other party with whom it had contact under this Agreement.', ARRAY['non-solicit','employees','staff'], ARRAY['US'], false),
('dispute-arbitration-in','Arbitration (India)','Resolve disputes by arbitration instead of court','Any dispute arising out of this Agreement shall be referred to arbitration by a sole arbitrator appointed by mutual agreement, conducted in English, with the seat of arbitration at {{city}}, India.', ARRAY['dispute','arbitration'], ARRAY['IN'], false),
('dispute-arbitration-us','Arbitration (US)','Resolve disputes by arbitration instead of court','Any dispute arising out of this Agreement shall be resolved by binding arbitration before a single arbitrator, conducted in English, in the state whose law governs this Agreement.', ARRAY['dispute','arbitration'], ARRAY['US'], false),
('return-of-materials','Return of materials','Get confidential documents back when the relationship ends','Upon written request or termination, each party shall promptly return or destroy all Confidential Information of the other party and confirm in writing that it has done so.', ARRAY['confidentiality','return','termination'], ARRAY[]::text[], true),
('late-payment-interest','Late payment interest','Charge interest when invoices are paid late','Amounts not paid when due shall accrue interest at the rate of one percent (1%) per month, or the maximum rate permitted by law if lower, until paid.', ARRAY['payment','late','interest'], ARRAY[]::text[], true),
('limitation-of-liability','Limitation of liability','Cap how much each party can be liable for','Except for breach of confidentiality or fraud, neither party''s total liability under this Agreement shall exceed the total fees paid or payable under it in the twelve (12) months before the claim.', ARRAY['liability','cap','risk'], ARRAY[]::text[], true),
('termination-for-convenience','Termination for convenience','Let either party end the agreement with notice','Either party may terminate this Agreement for any reason by giving thirty (30) days'' written notice to the other party.', ARRAY['termination','notice'], ARRAY[]::text[], true);