// Standalone types (migrated from Supabase Database types)

export interface Candidate {
  id: string;
  company_id: string;
  name: string;
  email: string;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  _id?: string;
  name: string | null;
  website?: string | null;
  description?: string | null;
  industry?: string | null;
  company_size?: string | null;
  subscription_tier: string;
  stripe_customer_id?: string | null;
  max_interviews_per_month?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  _id?: string;
  userId?: string;
  company_id: string | null;
  full_name: string | null;
  email: string;
  role: string;
  avatar_url?: string | null;
  has_completed_onboarding?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Interview {
  id: string;
  _id?: string;
  company_id?: string;
  companyId?: string;
  created_by?: string;
  createdBy?: string;
  candidate_name?: string;
  candidateName?: string;
  candidate_email?: string;
  candidateEmail?: string;
  position: string;
  scheduled_at?: string | null;
  scheduledAt?: number | null;
  duration?: string | null;
  status: string;
  candidate_token?: string;
  candidateToken?: string;
  candidate_consented?: boolean;
  transcript?: string | null;
  notes?: string | null;
  latest_scores?: LiveScores | null;
  latestScores?: LiveScores | null;
  livekit_room_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InterviewReport {
  id: string;
  interview_id?: string;
  interviewId?: string;
  overall_score?: number;
  overallScore?: number;
  speech_score?: number;
  speechScore?: number;
  timing_score?: number;
  timingScore?: number;
  flow_score?: number;
  flowScore?: number;
  linguistic_score?: number;
  linguisticScore?: number;
  engagement?: number;
  confidence?: number;
  summary?: string | null;
  recommendations?: string[];
  created_at?: string;
}

export interface InterviewFlag {
  id: string;
  interview_id?: string;
  interviewId?: string;
  time: string;
  pattern: string;
  severity: "low" | "medium" | "high";
  flag_type?: string;
  flagType?: string;
  created_at?: string;
}

export interface InterviewTimeline {
  id: string;
  interview_id?: string;
  interviewId?: string;
  minute: string;
  score: number;
  created_at?: string;
}

export interface ResponseDelay {
  id: string;
  interview_id?: string;
  interviewId?: string;
  question: string;
  delay: number;
  label: string;
  created_at?: string;
}

export interface TranscriptChunk {
  id: string;
  interview_id?: string;
  interviewId?: string;
  chunk_index?: number;
  chunkIndex?: number;
  text: string;
  speaker?: string | null;
  elapsed_seconds?: number;
  elapsedSeconds?: number;
  speech_score?: number | null;
  timing_score?: number | null;
  flow_score?: number | null;
  linguistic_score?: number | null;
  created_at?: string;
}

export interface EmailTemplate {
  id: string;
  company_id?: string;
  companyId?: string;
  template_type: string;
  name: string;
  subject: string;
  body: string;
  created_at?: string;
  updated_at?: string;
}

// Derived types
export type Role = string;
export type InterviewStatus = string;
export type FlagSeverity = "low" | "medium" | "high";
export type TemplateType = string;

// Composite type used by report page
export interface FullReport {
  interview: Interview;
  report: InterviewReport;
  flags: InterviewFlag[];
  timeline: InterviewTimeline[];
  responseDelays: ResponseDelay[];
  interviewer: Profile | null;
}

// Live scoring state used during interviews
export interface LiveScores {
  speech: number;
  timing: number;
  flow: number;
  linguistic: number;
}

// Dashboard stats
export interface DashboardStats {
  interviewsThisMonth: number;
  interviewsLastMonth: number;
  avgScore: number;
  avgScoreLastMonth: number;
  interviewsToday: number;
  completedToday: number;
  needsReview: number;
}
