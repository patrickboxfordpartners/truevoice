-- Add expiration and revocation to report tokens
-- Prevents indefinite access to sensitive interview reports

ALTER TABLE public.report_tokens
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS revoked BOOLEAN NOT NULL DEFAULT false;

-- Index for fast expiration checks
CREATE INDEX IF NOT EXISTS idx_report_tokens_expires
  ON public.report_tokens(token, expires_at, revoked);

-- Update RLS policy to enforce expiration
DROP POLICY IF EXISTS "public token read" ON public.report_tokens;

CREATE POLICY "public token read - non-expired only"
  ON public.report_tokens FOR SELECT
  USING (expires_at > now() AND NOT revoked);

-- Helper function to revoke a report token
CREATE OR REPLACE FUNCTION public.revoke_report_token(token_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.report_tokens
  SET revoked = true
  WHERE token = token_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.revoke_report_token TO authenticated;

COMMENT ON FUNCTION public.revoke_report_token IS
  'Revokes a report share link. Only the company that owns the interview can revoke.';
