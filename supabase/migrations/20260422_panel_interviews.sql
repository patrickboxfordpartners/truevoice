-- Panel interviewers: who is participating in an interview
CREATE TABLE IF NOT EXISTS public.interview_panelists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT, -- per-panelist private notes
  score_override INTEGER, -- panelist's personal overall score (optional, 0-100)
  UNIQUE(interview_id, profile_id)
);

ALTER TABLE public.interview_reports
  ADD COLUMN IF NOT EXISTS panelist_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS consensus_score INTEGER;

-- RLS
ALTER TABLE public.interview_panelists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View panelists for company interviews"
  ON public.interview_panelists FOR SELECT
  USING (interview_id IN (SELECT id FROM public.interviews WHERE company_id = public.get_my_company_id()));

CREATE POLICY "Insert panelists"
  ON public.interview_panelists FOR INSERT WITH CHECK (true);

CREATE POLICY "Update own panelist notes"
  ON public.interview_panelists FOR UPDATE USING (profile_id = auth.uid());
