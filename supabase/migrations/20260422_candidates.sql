-- Persistent candidate profiles (separate from one-time interview tokens)
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Link interviews to persistent candidates
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES public.candidates ON DELETE SET NULL;

-- RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View company candidates" ON public.candidates FOR SELECT
  USING (company_id = public.get_my_company_id());
CREATE POLICY "Insert company candidates" ON public.candidates FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "Update company candidates" ON public.candidates FOR UPDATE
  USING (company_id = public.get_my_company_id());
