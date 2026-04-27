import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/types/supabase";

type CandidateUpdate = Database["public"]["Tables"]["candidates"]["Update"];

// ─── useCandidates ──────────────────────────────────────────────────────────
// All persistent candidates for the current company, ordered by most-recent
// interview date (candidates with no interviews sort last by created_at).

export interface CandidateSummary {
  id: string;
  company_id: string;
  name: string;
  email: string;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_interview_at: string | null;
  interview_count: number;
  avg_score: number | null;
}

export function useCandidates() {
  const { company } = useAuth();

  return useQuery({
    queryKey: ["candidates", company?.id],
    queryFn: async (): Promise<CandidateSummary[]> => {
      const { data, error } = await supabase
        .from("candidates")
        .select(
          `id, company_id, name, email, linkedin_url, notes, created_at, updated_at,
           interviews!interviews_candidate_id_fkey (
             id, scheduled_at, created_at,
             interview_reports!interview_reports_interview_id_fkey (overall_score)
           )`
        )
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((c: any) => {
        const interviews: any[] = c.interviews ?? [];

        const dates = interviews
          .map((i: any) => i.scheduled_at ?? i.created_at)
          .filter(Boolean)
          .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

        const scores = interviews
          .flatMap((i: any) => i.interview_reports ?? [])
          .map((r: any) => r.overall_score as number)
          .filter((s: number) => s > 0);

        return {
          id: c.id,
          company_id: c.company_id,
          name: c.name,
          email: c.email,
          linkedin_url: c.linkedin_url,
          notes: c.notes,
          created_at: c.created_at,
          updated_at: c.updated_at,
          last_interview_at: dates[0] ?? null,
          interview_count: interviews.length,
          avg_score: scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null,
        };
      }).sort((a, b) => {
        if (a.last_interview_at && b.last_interview_at) {
          return new Date(b.last_interview_at).getTime() - new Date(a.last_interview_at).getTime();
        }
        if (a.last_interview_at) return -1;
        if (b.last_interview_at) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
    enabled: !!company?.id,
  });
}

// ─── useCandidateHistory ─────────────────────────────────────────────────────
// All interviews + reports for a single candidate.

export interface CandidateInterview {
  id: string;
  position: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  overall_score: number | null;
  speech_score: number | null;
  timing_score: number | null;
  flow_score: number | null;
  linguistic_score: number | null;
}

export interface CandidateHistory {
  id: string;
  name: string;
  email: string;
  linkedin_url: string | null;
  notes: string | null;
  interviews: CandidateInterview[];
}

export function useCandidateHistory(candidateId: string | undefined) {
  return useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: async (): Promise<CandidateHistory> => {
      const { data, error } = await supabase
        .from("candidates")
        .select(
          `id, name, email, linkedin_url, notes,
           interviews!interviews_candidate_id_fkey (
             id, position, status, scheduled_at, created_at,
             interview_reports!interview_reports_interview_id_fkey (
               overall_score, speech_score, timing_score, flow_score, linguistic_score
             )
           )`
        )
        .eq("id", candidateId!)
        .single();

      if (error) throw error;

      const interviews: CandidateInterview[] = ((data as any).interviews ?? [])
        .map((i: any) => {
          const report = (i.interview_reports ?? [])[0] ?? null;
          return {
            id: i.id,
            position: i.position,
            status: i.status,
            scheduled_at: i.scheduled_at,
            created_at: i.created_at,
            overall_score: report?.overall_score ?? null,
            speech_score: report?.speech_score ?? null,
            timing_score: report?.timing_score ?? null,
            flow_score: report?.flow_score ?? null,
            linguistic_score: report?.linguistic_score ?? null,
          };
        })
        .sort((a: CandidateInterview, b: CandidateInterview) =>
          new Date(a.scheduled_at ?? a.created_at).getTime() -
          new Date(b.scheduled_at ?? b.created_at).getTime()
        );

      return {
        id: (data as any).id,
        name: (data as any).name,
        email: (data as any).email,
        linkedin_url: (data as any).linkedin_url,
        notes: (data as any).notes,
        interviews,
      };
    },
    enabled: !!candidateId,
  });
}

// ─── useUpdateCandidate ───────────────────────────────────────────────────────

export function useUpdateCandidate(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Pick<CandidateUpdate, "notes" | "linkedin_url">) => {
      const { data, error } = await supabase
        .from("candidates")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", id] });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}
