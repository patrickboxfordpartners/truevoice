"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

function extractJson(raw: string): string | null {
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const matches = [...stripped.matchAll(/\{[\s\S]*?\}/g)];
  if (matches.length === 0) return null;
  for (let i = matches.length - 1; i >= 0; i--) {
    try { JSON.parse(matches[i][0]); return matches[i][0]; } catch { continue; }
  }
  const greedy = stripped.match(/\{[\s\S]*\}/);
  return greedy ? greedy[0] : null;
}

export const generate = action({
  args: { interviewId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const interview = await ctx.runQuery(api.interviews.getById, { interviewId: args.interviewId });
    if (!interview) throw new Error("Interview not found");

    const chunks = await ctx.runQuery(api.interviewData.getChunks, { interviewId: args.interviewId });
    const existingFlags = await ctx.runQuery(api.interviewData.getFlags, { interviewId: args.interviewId });

    const fullTranscript = (interview as any).transcript || (chunks || []).map((c: any) => c.text).join(" ");

    if (!fullTranscript.trim() && (!chunks || chunks.length === 0)) {
      const fallback = { speech: 15, timing: 15, flow: 15, linguistic: 15, engagement: 70, confidence: 70, summary: "Interview completed. No transcript data available for analysis.", recommendations: ["Ensure microphone permissions are granted for future interviews"] };
      const overall = 60;
      await ctx.runMutation(api.interviewData.saveReport, {
        interviewId: args.interviewId, overallScore: overall,
        speechScore: 15, timingScore: 15, flowScore: 15, linguisticScore: 15,
        engagement: 70, confidence: 70,
        summary: fallback.summary, recommendations: fallback.recommendations,
      });
      await ctx.runMutation(api.interviews.updateStatus, { interviewId: args.interviewId, status: "completed" });
      return { report: fallback };
    }

    const interviewContext = `Interview: ${(interview as any).candidateName} for ${(interview as any).position}
Chunk-level analyses (${(chunks || []).length} chunks): ${JSON.stringify(
      (chunks || []).map((c: any) => ({ speech: c.speechScore, timing: c.timingScore, flow: c.flowScore, linguistic: c.linguisticScore }))
    )}
Flags detected (${(existingFlags || []).length}): ${JSON.stringify(
      (existingFlags || []).map((f: any) => ({ time: f.time, pattern: f.pattern, severity: f.severity }))
    )}
Full transcript: "${fullTranscript.slice(0, 8000)}"`;

    const xaiKey = process.env.AI_PROXY_KEY || process.env.XAI_API_KEY;
    if (!xaiKey) throw new Error("AI API key not configured");
    const baseUrl = process.env.AI_PROXY_URL || "https://api.x.ai";

    const assemblyaiKey = process.env.ASSEMBLYAI_API_KEY;

    const grokPromise = fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${xaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-3-fast",
        messages: [
          {
            role: "system",
            content: `You are an interview authenticity analyst producing a final comprehensive report.
Analyze the full interview transcript and chunk-level analyses to produce overall scores.

Score each dimension 0-25 (higher = more authentic/natural):
- speech: Natural speech patterns vs reading/scripted cadence
- timing: Natural response timing vs instant memorized or extremely delayed
- flow: Conversational engagement vs monologue delivery
- linguistic: Spoken language patterns vs written/formal language

Also provide:
- engagement (0-100): How engaged and present the candidate was
- confidence (0-100): How confident vs uncertain the candidate appeared
- summary: 1-2 sentence overall assessment
- recommendations: Array of 3-5 actionable next steps for the interviewer

You MUST return ONLY valid JSON with no explanation, no markdown, no code fences:
{"speech":20,"timing":18,"flow":15,"linguistic":22,"engagement":75,"confidence":70,"summary":"...","recommendations":["...","..."]}`,
          },
          { role: "user", content: interviewContext },
        ],
        temperature: 0.3,
      }),
    });

    const gatewayPromise = assemblyaiKey
      ? fetch("https://llm-gateway.assemblyai.com/v1/chat/completions", {
          method: "POST",
          headers: { authorization: assemblyaiKey, "content-type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            messages: [
              {
                role: "system",
                content: `You are a senior hiring advisor. Given an interview transcript with chunk-level authenticity scores and detected flags, produce a structured hiring summary.
Return ONLY valid JSON:
{"hiring_recommendation":"strong_yes"|"yes"|"maybe"|"no"|"strong_no","strengths":["..."],"concerns":["..."],"red_flags":["..."],"follow_up_questions":["..."],"executive_summary":"2-3 sentence assessment"}`,
              },
              { role: "user", content: interviewContext },
            ],
            temperature: 0.3,
          }),
        }).then(async (res) => res.ok ? res.json() : null).catch(() => null)
      : Promise.resolve(null);

    const [grokResponse, gatewayData] = await Promise.all([grokPromise, gatewayPromise]);
    const grokData = await grokResponse.json();

    let gatewaySummary: any = null;
    if (gatewayData) {
      try {
        const gwContent = gatewayData.choices?.[0]?.message?.content || "";
        const gwJson = extractJson(gwContent);
        if (gwJson) gatewaySummary = JSON.parse(gwJson);
      } catch {}
    }

    let report: any;
    try {
      const rawContent = grokData.choices?.[0]?.message?.content || "";
      const jsonStr = extractJson(rawContent);
      if (!jsonStr) throw new Error("No JSON found");
      report = JSON.parse(jsonStr);
    } catch {
      const avgScore = (key: string) => {
        const vals = (chunks || []).map((c: any) => c[key]).filter((v: any) => v != null);
        return vals.length > 0 ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 15;
      };
      report = {
        speech: avgScore("speechScore"), timing: avgScore("timingScore"),
        flow: avgScore("flowScore"), linguistic: avgScore("linguisticScore"),
        engagement: 70, confidence: 70,
        summary: "Analysis completed based on chunk-level scores.",
        recommendations: ["Review the full transcript for additional context"],
      };
    }

    const scores = {
      speech: Math.min(25, Math.max(0, report.speech ?? 15)),
      timing: Math.min(25, Math.max(0, report.timing ?? 15)),
      flow: Math.min(25, Math.max(0, report.flow ?? 15)),
      linguistic: Math.min(25, Math.max(0, report.linguistic ?? 15)),
    };
    const overall = scores.speech + scores.timing + scores.flow + scores.linguistic;

    await ctx.runMutation(api.interviewData.saveReport, {
      interviewId: args.interviewId,
      overallScore: overall,
      speechScore: scores.speech,
      timingScore: scores.timing,
      flowScore: scores.flow,
      linguisticScore: scores.linguistic,
      engagement: Math.min(100, Math.max(0, report.engagement ?? 70)),
      confidence: Math.min(100, Math.max(0, report.confidence ?? 70)),
      summary: report.summary || "",
      recommendations: report.recommendations || [],
    });

    await ctx.runMutation(api.interviews.updateStatus, { interviewId: args.interviewId, status: "completed" });

    return { report: { ...scores, overall, engagement: report.engagement, confidence: report.confidence, summary: report.summary, recommendations: report.recommendations, gatewaySummary } };
  },
});
