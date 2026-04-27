ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS resume_text TEXT,
  ADD COLUMN IF NOT EXISTS resume_filename TEXT;

ALTER TABLE public.interview_reports
  ADD COLUMN IF NOT EXISTS resume_alignment_score INTEGER, -- 0-100
  ADD COLUMN IF NOT EXISTS resume_gaps TEXT[], -- skills/claims not supported by interview
  ADD COLUMN IF NOT EXISTS resume_strengths TEXT[]; -- claims well-supported by interview
