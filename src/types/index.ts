import type { Database } from "./supabase";

// Row type shortcuts
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Interview = Database["public"]["Tables"]["interviews"]["Row"];
export type InterviewReport = Database["public"]["Tables"]["interview_reports"]["Row"];
export type InterviewFlag = Database["public"]["Tables"]["interview_flags"]["Row"];
export type InterviewTimeline = Database["public"]["Tables"]["interview_timeline"]["Row"];
export type ResponseDelay = Database["public"]["Tables"]["response_delays"]["Row"];
export type TranscriptChunk = Database["public"]["Tables"]["transcript_chunks"]["Row"];
export type EmailTemplate = Database["public"]["Tables"]["email_templates"]["Row"];

// Derived types
export type Role = Profile["role"];
export type InterviewStatus = Interview["status"];
export type FlagSeverity = InterviewFlag["severity"];
export type TemplateType = EmailTemplate["template_type"];

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
