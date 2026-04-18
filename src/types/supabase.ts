export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          description: string | null;
          industry: string | null;
          company_size: string | null;
          default_duration: number;
          feedback_deadline: number;
          timezone: string;
          auto_record: boolean;
          authenticity_detection: boolean;
          require_candidate_camera: boolean;
          subscription_tier: string;
          subscription_status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          description?: string | null;
          industry?: string | null;
          company_size?: string | null;
          default_duration?: number;
          feedback_deadline?: number;
          timezone?: string;
          auto_record?: boolean;
          authenticity_detection?: boolean;
          require_candidate_camera?: boolean;
          subscription_tier?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          description?: string | null;
          industry?: string | null;
          company_size?: string | null;
          default_duration?: number;
          feedback_deadline?: number;
          timezone?: string;
          auto_record?: boolean;
          authenticity_detection?: boolean;
          require_candidate_camera?: boolean;
          subscription_tier?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          company_id: string | null;
          full_name: string | null;
          email: string;
          role: "owner" | "admin" | "editor" | "viewer";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id?: string | null;
          full_name?: string | null;
          email: string;
          role?: "owner" | "admin" | "editor" | "viewer";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string | null;
          full_name?: string | null;
          email?: string;
          role?: "owner" | "admin" | "editor" | "viewer";
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      interviews: {
        Row: {
          id: string;
          company_id: string;
          created_by: string;
          candidate_name: string;
          candidate_email: string;
          position: string;
          scheduled_at: string | null;
          duration: string | null;
          status: "scheduled" | "in_progress" | "completed" | "cancelled";
          candidate_token: string;
          candidate_consented: boolean;
          transcript: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          created_by: string;
          candidate_name: string;
          candidate_email: string;
          position: string;
          scheduled_at?: string | null;
          duration?: string | null;
          status?: "scheduled" | "in_progress" | "completed" | "cancelled";
          candidate_token?: string;
          candidate_consented?: boolean;
          transcript?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          candidate_name?: string;
          candidate_email?: string;
          position?: string;
          scheduled_at?: string | null;
          duration?: string | null;
          status?: "scheduled" | "in_progress" | "completed" | "cancelled";
          candidate_consented?: boolean;
          transcript?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      interview_reports: {
        Row: {
          id: string;
          interview_id: string;
          overall_score: number;
          speech_score: number;
          timing_score: number;
          flow_score: number;
          linguistic_score: number;
          engagement: number;
          confidence: number;
          summary: string | null;
          recommendations: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          overall_score: number;
          speech_score: number;
          timing_score: number;
          flow_score: number;
          linguistic_score: number;
          engagement: number;
          confidence: number;
          summary?: string | null;
          recommendations?: string[] | null;
          created_at?: string;
        };
        Update: {
          overall_score?: number;
          speech_score?: number;
          timing_score?: number;
          flow_score?: number;
          linguistic_score?: number;
          engagement?: number;
          confidence?: number;
          summary?: string | null;
          recommendations?: string[] | null;
        };
      };
      interview_flags: {
        Row: {
          id: string;
          interview_id: string;
          time: string;
          pattern: string;
          severity: "low" | "medium" | "high";
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          time: string;
          pattern: string;
          severity: "low" | "medium" | "high";
          created_at?: string;
        };
        Update: {
          time?: string;
          pattern?: string;
          severity?: "low" | "medium" | "high";
        };
      };
      interview_timeline: {
        Row: {
          id: string;
          interview_id: string;
          minute: string;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          minute: string;
          score: number;
          created_at?: string;
        };
        Update: {
          minute?: string;
          score?: number;
        };
      };
      response_delays: {
        Row: {
          id: string;
          interview_id: string;
          question: string;
          delay: number;
          label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          question: string;
          delay: number;
          label: string;
          created_at?: string;
        };
        Update: {
          question?: string;
          delay?: number;
          label?: string;
        };
      };
      transcript_chunks: {
        Row: {
          id: string;
          interview_id: string;
          chunk_index: number;
          text: string;
          speaker: string | null;
          elapsed_seconds: number;
          speech_score: number | null;
          timing_score: number | null;
          flow_score: number | null;
          linguistic_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          chunk_index: number;
          text: string;
          speaker?: string | null;
          elapsed_seconds: number;
          speech_score?: number | null;
          timing_score?: number | null;
          flow_score?: number | null;
          linguistic_score?: number | null;
          created_at?: string;
        };
        Update: {
          text?: string;
          speaker?: string | null;
          speech_score?: number | null;
          timing_score?: number | null;
          flow_score?: number | null;
          linguistic_score?: number | null;
        };
      };
      email_templates: {
        Row: {
          id: string;
          company_id: string;
          template_type: "invitation" | "reminder" | "followup";
          name: string;
          subject: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          template_type: "invitation" | "reminder" | "followup";
          name: string;
          subject: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          template_type?: "invitation" | "reminder" | "followup";
          name?: string;
          subject?: string;
          body?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
