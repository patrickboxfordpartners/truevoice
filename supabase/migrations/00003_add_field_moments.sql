-- Field mode: Contextual moments table for storing tagged insights
CREATE TABLE public.field_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES public.interviews ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  elapsed_seconds integer NOT NULL,
  scene_description text,
  detected_objects jsonb DEFAULT '[]'::jsonb,
  emotional_cue text,
  quote text,
  significance_score integer CHECK (significance_score >= 0 AND significance_score <= 100),
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by interview
CREATE INDEX field_moments_interview_id_idx ON public.field_moments(interview_id);

-- Index for filtering by tags
CREATE INDEX field_moments_tags_idx ON public.field_moments USING GIN(tags);

-- RLS: scoped via interview's company
ALTER TABLE public.field_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View field moments for company interviews"
  ON public.field_moments FOR SELECT
  USING (interview_id IN (SELECT id FROM public.interviews WHERE company_id = public.get_my_company_id()));

CREATE POLICY "Insert field moments"
  ON public.field_moments FOR INSERT
  WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.field_moments;

COMMENT ON TABLE public.field_moments IS 'Contextual insights captured during Field mode interviews (POV research with smart glasses)';
COMMENT ON COLUMN public.field_moments.scene_description IS 'AI-generated description of the scene/environment';
COMMENT ON COLUMN public.field_moments.detected_objects IS 'Array of objects detected in the scene, e.g. ["laptop", "sticky_notes", "whiteboard"]';
COMMENT ON COLUMN public.field_moments.emotional_cue IS 'Detected emotion: frustration, excitement, confusion, etc.';
COMMENT ON COLUMN public.field_moments.significance_score IS 'AI-assessed importance of this moment (0-100)';
COMMENT ON COLUMN public.field_moments.tags IS 'Tags for filtering: pain_point, competitor_mention, workaround, etc.';
