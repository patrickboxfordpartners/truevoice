import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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

async function fetchPanelists(interviewId: string): Promise<Panelist[]> {
  const { data, error } = await supabase
    .from("interview_panelists")
    .select("id, interview_id, profile_id, joined_at, notes, score_override, profile:profiles(full_name, email, avatar_url)")
    .eq("interview_id", interviewId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as Panelist[];
}

export function usePanelists(interviewId: string | undefined) {
  return useQuery({
    queryKey: ["panelists", interviewId],
    queryFn: () => fetchPanelists(interviewId!),
    enabled: !!interviewId,
    refetchInterval: 10_000, // poll every 10s so late joiners appear
  });
}

export function useJoinAsPanel(interviewId: string | undefined) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!interviewId || !profile?.id) return;
      // upsert — safe to call multiple times
      const { error } = await supabase
        .from("interview_panelists")
        .upsert(
          { interview_id: interviewId, profile_id: profile.id },
          { onConflict: "interview_id,profile_id", ignoreDuplicates: true }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["panelists", interviewId] });
    },
  });
}

export function useUpdatePanelistNotes(interviewId: string | undefined) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notes,
      score_override,
    }: {
      notes?: string;
      score_override?: number | null;
    }) => {
      if (!interviewId || !profile?.id) return;
      const patch: Record<string, unknown> = {};
      if (notes !== undefined) patch.notes = notes;
      if (score_override !== undefined) patch.score_override = score_override;
      if (Object.keys(patch).length === 0) return;

      const { error } = await supabase
        .from("interview_panelists")
        .update(patch)
        .eq("interview_id", interviewId)
        .eq("profile_id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["panelists", interviewId] });
    },
  });
}
