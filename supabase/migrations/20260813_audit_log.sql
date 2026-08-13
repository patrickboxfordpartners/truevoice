-- Audit log for sensitive actions
-- Tracks who did what, when, and from where

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_company_action
  ON public.audit_log(company_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor
  ON public.audit_log(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_resource
  ON public.audit_log(resource_type, resource_id);

-- RLS: Company members can view their company's audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View company audit log"
  ON public.audit_log FOR SELECT
  USING (company_id = public.get_my_company_id());

-- Only service role can insert (edge functions log actions)
CREATE POLICY "Service role can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- Helper function to log an action
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_company_id UUID,
  p_actor_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_log (
    company_id,
    actor_id,
    action,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_company_id,
    p_actor_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_audit_action TO service_role;

-- Auto-cleanup old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.audit_log
  WHERE created_at < now() - interval '1 year';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.audit_log IS
  'Audit trail for security-sensitive actions: report sharing, member invites, plan changes, deletions';

COMMENT ON FUNCTION public.log_audit_action IS
  'Logs an auditable action. Called from edge functions with service role permissions.';
