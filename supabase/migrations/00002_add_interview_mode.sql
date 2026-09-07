-- Add mode column to interviews table for Interview/Field/Panel modes
ALTER TABLE public.interviews
ADD COLUMN mode text NOT NULL DEFAULT 'interview' CHECK (mode IN ('interview', 'field', 'panel'));

COMMENT ON COLUMN public.interviews.mode IS 'Interview type: interview (standard video), field (POV research with glasses), panel (multi-viewer with POV)';
