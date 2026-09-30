import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";

export function useReport(interviewId: string | undefined) {
  const report = useQuery(
    api.interviewData.getReport,
    interviewId ? { interviewId } : "skip"
  );
  const flags = useQuery(
    api.interviewData.getFlags,
    interviewId ? { interviewId } : "skip"
  );
  const timeline = useQuery(
    api.interviewData.getTimeline,
    interviewId ? { interviewId } : "skip"
  );
  const delays = useQuery(
    api.interviewData.getDelays,
    interviewId ? { interviewId } : "skip"
  );

  const isLoading = report === undefined || flags === undefined || timeline === undefined || delays === undefined;

  return {
    data: report ? {
      report,
      flags: flags ?? [],
      timeline: timeline ?? [],
      responseDelays: delays ?? [],
    } : undefined,
    isLoading: isLoading && !!interviewId,
    error: null,
  };
}

export function useCompletedReports() {
  const { company } = useAuth();
  const companyId = company?.id;
  const interviews = useQuery(
    api.interviews.getByCompany,
    companyId ? { companyId } : "skip"
  );

  const completed = interviews?.filter((i: any) => i.status === "completed") ?? [];

  return {
    data: completed,
    isLoading: interviews === undefined && !!companyId,
    error: null,
  };
}
