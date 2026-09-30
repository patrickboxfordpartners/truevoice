import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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

export function useFieldMoments(interviewId: string | undefined) {
  const moments = useConvexQuery(
    api.interviewData.getFlags,
    interviewId ? { interviewId } : "skip"
  );

  const mapped: FieldMoment[] = (moments ?? [])
    .filter((m: any) => m.flagType === "environment" || m.flagType === "insight")
    .map((m: any) => ({
      id: m._id,
      interview_id: m.interviewId,
      timestamp: new Date(m._creationTime).toISOString(),
      elapsed_seconds: 0,
      scene_description: m.pattern ?? null,
      detected_objects: null,
      emotional_cue: null,
      quote: null,
      significance_score: m.severity === "high" ? 80 : m.severity === "medium" ? 60 : 40,
      tags: [m.flagType],
      created_at: new Date(m._creationTime).toISOString(),
    }));

  return {
    data: mapped,
    isLoading: moments === undefined && !!interviewId,
    error: null,
  };
}
