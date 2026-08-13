-- Performance indexes for security-critical queries
-- These prevent slow lookups that could be exploited for DoS

-- Interview lookups by token (used on every candidate page load)
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_token ON public.interviews(candidate_token);

-- Company lookups by API key (used on every API request)
CREATE INDEX IF NOT EXISTS idx_companies_api_key_active
  ON public.companies(api_key)
  WHERE subscription_status IN ('active', 'trialing');

-- Interview room lookups (LiveKit token generation)
CREATE INDEX IF NOT EXISTS idx_interviews_livekit_room ON public.interviews(livekit_room_name);

-- Company-scoped interview queries
CREATE INDEX IF NOT EXISTS idx_interviews_company_status
  ON public.interviews(company_id, status);

-- Timeline and chunk queries (used during live analysis)
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_interview_idx
  ON public.transcript_chunks(interview_id, chunk_index);

CREATE INDEX IF NOT EXISTS idx_interview_timeline_interview_time
  ON public.interview_timeline(interview_id, created_at);

CREATE INDEX IF NOT EXISTS idx_interview_flags_interview_time
  ON public.interview_flags(interview_id, created_at);

-- Response delay queries
CREATE INDEX IF NOT EXISTS idx_response_delays_interview
  ON public.response_delays(interview_id, created_at);

-- Report token lookups (public report access)
CREATE INDEX IF NOT EXISTS idx_report_tokens_token
  ON public.report_tokens(token);

-- Candidate lookups
CREATE INDEX IF NOT EXISTS idx_candidates_company_email
  ON public.candidates(company_id, email);

-- Profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company
  ON public.profiles(company_id);
