"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

function extractJson(raw: string): string | null {
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const matches = [...stripped.matchAll(/\{[\s\S]*?\}/g)];
  for (let i = matches.length - 1; i >= 0; i--) {
    try { JSON.parse(matches[i][0]); return matches[i][0]; } catch { continue; }
  }
  const greedy = stripped.match(/\{[\s\S]*\}/);
  return greedy ? greedy[0] : null;
}

export const analyzeResume = action({
  args: { interviewId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const xaiKey = process.env.AI_PROXY_KEY || process.env.XAI_API_KEY;
    if (!xaiKey) throw new Error("XAI_API_KEY not set");
    const xaiBaseUrl = process.env.AI_PROXY_URL || "https://api.x.ai";

    const interview = await ctx.runQuery(api.interviews.getById, { interviewId: args.interviewId });
    if (!interview) throw new Error("Interview not found");
    if (!interview.resumeText) return { skipped: true, reason: "No resume uploaded" };
    if (!interview.transcript?.trim()) return { skipped: true, reason: "No transcript available" };

    const grokResponse = await fetch(`${xaiBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${xaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-3-fast",
        messages: [
          {
            role: "system",
            content: `You are an expert interviewer analyzing alignment between a candidate's resume and interview responses.

Review the resume claims, find where they were discussed in the transcript, and assess support.

Return ONLY valid JSON:
{
  "alignment_score": <0-100>,
  "strengths": ["claim 1 well-supported", ...],
  "gaps": ["claimed X but avoided discussing it", ...]
}

Limit to 5 most notable strengths and 5 most notable gaps.`,
          },
          {
            role: "user",
            content: `Candidate: ${interview.candidateName}
Position: ${interview.position}

RESUME:
${interview.resumeText.slice(0, 4000)}

INTERVIEW TRANSCRIPT:
${interview.transcript.slice(0, 6000)}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const grokData = await grokResponse.json();
    if (!grokResponse.ok) throw new Error("Grok API error");

    const rawContent = grokData.choices?.[0]?.message?.content || "";
    let analysis: any = {};
    try {
      const jsonStr = extractJson(rawContent);
      if (!jsonStr) throw new Error("No JSON found");
      analysis = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse resume analysis");
    }

    const result = {
      alignmentScore: Math.min(100, Math.max(0, analysis.alignment_score ?? 50)),
      strengths: (analysis.strengths || []).slice(0, 5),
      gaps: (analysis.gaps || []).slice(0, 5),
    };

    return result;
  },
});
