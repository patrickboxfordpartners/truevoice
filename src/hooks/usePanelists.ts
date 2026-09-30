import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";

export interface Panelist {
  id: string;
  interview_id: string;
  profile_id: string;
  joined_at: string | null;
  notes: string | null;
  score_override: number | null;
  profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function usePanelists(interviewId: string | undefined) {
  const panelists = useConvexQuery(
    api.queries.getPanelistsByInterview,
    interviewId ? { interviewId } : "skip"
  );

  const mapped: Panelist[] = (panelists ?? []).map((p: any) => ({
    id: p._id,
    interview_id: p.interviewId,
    profile_id: p.profileId,
    joined_at: p.joinedAt ? new Date(p.joinedAt).toISOString() : null,
    notes: p.notes ?? null,
    score_override: p.scoreOverride ?? null,
    profile: p.profile ?? { full_name: null, email: "", avatar_url: null },
  }));

  return {
    data: mapped,
    isLoading: panelists === undefined && !!interviewId,
    error: null,
  };
}

export function useJoinAsPanel(_interviewId: string | undefined) {
  return {
    mutateAsync: async () => {
      // TODO: implement join-as-panelist mutation in Convex
    },
    isPending: false,
  };
}

export function useUpdatePanelistNotes(_interviewId: string | undefined) {
  return {
    mutateAsync: async (_args: { notes?: string; score_override?: number | null }) => {
      // TODO: implement panelist notes mutation in Convex
    },
    isPending: false,
  };
}
