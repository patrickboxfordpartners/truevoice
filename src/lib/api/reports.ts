// Convex API - reports
// Inside components, prefer useQuery(api.interviewData.getFullReport) directly.

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

export interface FullReport {
  interview: any;
  report: any;
  flags: any[];
  timeline: any[];
  responseDelays: any[];
  interviewer: any;
}

export async function getFullReport(interviewId: string): Promise<FullReport> {
  const result = await client.query(api.interviewData.getFullReport, { interviewId });
  if (!result) throw new Error("Report not found");
  return result;
}

export async function getCompletedReports(companyId: string) {
  const interviews = await client.query(api.interviews.getByCompany, { companyId });
  if (!interviews) return [];

  const completed = interviews.filter((i: any) => i.status === "completed");

  const reports = await Promise.all(
    completed.map(async (interview: any) => {
      const report = await client.query(api.interviewData.getReport, { interviewId: interview._id });
      if (!report) return null;

      const flags = await client.query(api.interviewData.getFlags, { interviewId: interview._id });
      const timeline = await client.query(api.interviewData.getTimeline, { interviewId: interview._id });
      const delays = await client.query(api.interviewData.getDelays, { interviewId: interview._id });

      return {
        id: interview._id,
        candidate: interview.candidateName,
        position: interview.position,
        date: interview.scheduledAt
          ? new Date(interview.scheduledAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
            })
          : "",
        duration: interview.duration ?? "",
        overall: report.overallScore,
        speech: report.speechScore,
        timing: report.timingScore,
        flow: report.flowScore,
        linguistic: report.linguisticScore,
        engagement: report.engagement,
        confidence: report.confidence,
        summary: report.summary ?? "",
        flags: (flags ?? []).map((f: any) => ({ time: f.time, pattern: f.pattern, severity: f.severity })),
        timeline: (timeline ?? []).map((t: any) => ({ min: t.minute, score: t.score })),
        responseDelays: (delays ?? []).map((d: any) => ({ question: d.question, delay: d.delay, label: d.label })),
      };
    })
  );

  return reports.filter(Boolean);
}
