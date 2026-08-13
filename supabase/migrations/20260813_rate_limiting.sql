-- Rate limiting log table
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast window queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_key_time ON public.rate_limit_log(key, created_at);

-- Auto-cleanup old entries (keep last 24 hours only)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Helper function for rate limit table creation (called from edge functions)
CREATE OR REPLACE FUNCTION public.ensure_rate_limit_table()
RETURNS void AS $$
BEGIN
  -- This function exists only to trigger table creation via migration
  -- The actual table is created above
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-rate-limits', '0 */6 * * *', 'SELECT public.cleanup_rate_limit_log()');
