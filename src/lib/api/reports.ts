import { supabase } from "@/lib/supabase";
import type { FullReport } from "@/types";

export async function getFullReport(interviewId: string): Promise<FullReport> {
  const [interviewRes, reportRes, flagsRes, timelineRes, delaysRes] =
    await Promise.all([
      supabase
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .single(),
      supabase
        .from("interview_reports")
        .select("*")
        .eq("interview_id", interviewId)
        .single(),
      supabase
        .from("interview_flags")
        .select("*")
        .eq("interview_id", interviewId)
        .order("created_at", { ascending: true }),
      supabase
        .from("interview_timeline")
        .select("*")
        .eq("interview_id", interviewId)
        .order("created_at", { ascending: true }),
      supabase
        .from("response_delays")
        .select("*")
        .eq("interview_id", interviewId)
        .order("created_at", { ascending: true }),
    ]);

  if (interviewRes.error) throw interviewRes.error;
  if (reportRes.error) throw reportRes.error;

  // Fetch interviewer profile
  let interviewer = null;
  if (interviewRes.data.created_by) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", interviewRes.data.created_by)
      .single();
    interviewer = data;
  }

  return {
    interview: interviewRes.data,
    report: reportRes.data,
    flags: flagsRes.data ?? [],
    timeline: timelineRes.data ?? [],
    responseDelays: delaysRes.data ?? [],
    interviewer,
  };
}

export async function getCompletedReports(companyId: string) {
  const { data: interviews, error } = await supabase
    .from("interviews")
    .select("id, candidate_name, position, scheduled_at, duration, status")
    .eq("company_id", companyId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const reports = await Promise.all(
    (interviews ?? []).map(async (interview) => {
      const { data: report } = await supabase
        .from("interview_reports")
        .select("*")
        .eq("interview_id", interview.id)
        .single();

      const { data: flags } = await supabase
        .from("interview_flags")
        .select("*")
        .eq("interview_id", interview.id)
        .order("created_at", { ascending: true });

      const { data: timeline } = await supabase
        .from("interview_timeline")
        .select("*")
        .eq("interview_id", interview.id)
        .order("created_at", { ascending: true });

      const { data: delays } = await supabase
        .from("response_delays")
        .select("*")
        .eq("interview_id", interview.id)
        .order("created_at", { ascending: true });

      if (!report) return null;

      return {
        id: interview.id,
        candidate: interview.candidate_name,
        position: interview.position,
        date: interview.scheduled_at
          ? new Date(interview.scheduled_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "",
        duration: interview.duration ?? "",
        overall: report.overall_score,
        speech: report.speech_score,
        timing: report.timing_score,
        flow: report.flow_score,
        linguistic: report.linguistic_score,
        engagement: report.engagement,
        confidence: report.confidence,
        flags: (flags ?? []).map((f) => ({
          time: f.time,
          pattern: f.pattern,
          severity: f.severity as "low" | "medium" | "high",
        })),
        timeline: (timeline ?? []).map((t) => ({
          min: t.minute,
          score: t.score,
        })),
        responseDelays: (delays ?? []).map((d) => ({
          question: d.question,
          delay: d.delay,
          label: d.label,
        })),
      };
    })
  );

  return reports.filter(Boolean);
}
