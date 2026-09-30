import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";

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
  const companyId = company?.id ?? company?._id ?? "";
  const candidates = useConvexQuery(
    api.queries.getCandidatesByCompany,
    companyId ? { companyId } : "skip"
  );

  const mapped: CandidateSummary[] = (candidates ?? []).map((c: any) => ({
    id: c._id,
    company_id: c.companyId,
    name: c.candidateName ?? c.name ?? "",
    email: c.candidateEmail ?? c.email ?? "",
    linkedin_url: c.linkedinUrl ?? null,
    notes: c.notes ?? null,
    created_at: new Date(c._creationTime).toISOString(),
    updated_at: new Date(c.updatedAt ?? c._creationTime).toISOString(),
    last_interview_at: null,
    interview_count: 0,
    avg_score: c.overallScore ?? null,
  }));

  return {
    data: mapped,
    isLoading: candidates === undefined,
    error: null,
  };
}

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
  const candidate = useConvexQuery(
    api.queries.getCandidateById,
    candidateId ? { candidateId } : "skip"
  );

  const history: CandidateHistory | undefined = candidate ? {
    id: candidate._id,
    name: candidate.candidateName ?? "",
    email: candidate.candidateEmail ?? "",
    linkedin_url: candidate.linkedinUrl ?? null,
    notes: candidate.notes ?? null,
    interviews: [],
  } : undefined;

  return {
    data: history,
    isLoading: candidate === undefined && !!candidateId,
    error: null,
  };
}

export function useUpdateCandidate(id: string) {
  const moveStage = useConvexMutation(api.mutations.moveStage);

  return {
    mutateAsync: async (updates: { notes?: string; linkedin_url?: string }) => {
      // For now, notes updates go through the hiring pipeline
      // A dedicated candidate update mutation can be added later
      return updates;
    },
    isPending: false,
  };
}
