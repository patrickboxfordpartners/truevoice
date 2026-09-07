import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface FieldMoment {
  id: string;
  interview_id: string;
  timestamp: string;
  elapsed_seconds: number;
  scene_description: string | null;
  detected_objects: string[] | null;
  emotional_cue: string | null;
  quote: string | null;
  significance_score: number | null;
  tags: string[] | null;
  created_at: string;
}

async function getFieldMoments(interviewId: string): Promise<FieldMoment[]> {
  const { data, error } = await supabase
    .from("field_moments")
    .select("*")
    .eq("interview_id", interviewId)
    .order("elapsed_seconds", { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useFieldMoments(interviewId: string | undefined) {
  return useQuery({
    queryKey: ["fieldMoments", interviewId],
    queryFn: () => getFieldMoments(interviewId!),
    enabled: !!interviewId,
  });
}
