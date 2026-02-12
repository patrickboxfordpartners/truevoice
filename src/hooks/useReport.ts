import { useQuery } from "@tanstack/react-query";
import { getFullReport, getCompletedReports } from "@/lib/api/reports";
import { useAuth } from "@/contexts/AuthContext";

export function useReport(interviewId: string | undefined) {
  return useQuery({
    queryKey: ["report", interviewId],
    queryFn: () => getFullReport(interviewId!),
    enabled: !!interviewId,
  });
}

export function useCompletedReports() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["completedReports", company?.id],
    queryFn: () => getCompletedReports(company!.id),
    enabled: !!company?.id,
  });
}
