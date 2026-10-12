"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { XAI_MAX_TOKENS, xaiChatCompletion } from "../lib/xai";

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
    const interview = await ctx.runQuery(api.interviews.getById, { interviewId: args.interviewId });
    if (!interview) throw new Error("Interview not found");
    if (!interview.resumeText) return { skipped: true, reason: "No resume uploaded" };
    if (!interview.transcript?.trim()) return { skipped: true, reason: "No transcript available" };

    let grokResponse: Response;
    try {
      grokResponse = await xaiChatCompletion({
        maxTokens: XAI_MAX_TOKENS.resume,
        body: {
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
        },
      });
    } catch {
      throw new Error("Grok API error");
    }

    if (!grokResponse.ok) throw new Error("Grok API error");
    const grokData = await grokResponse.json();

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
