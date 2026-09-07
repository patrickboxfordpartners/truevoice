"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Joan's AI Interview Summary Generator
 *
 * Takes interview transcript + scores and generates a comprehensive briefing:
 * - Executive summary
 * - Key strengths
 * - Areas of concern
 * - Hiring recommendation
 * - Suggested follow-up questions
 * - Red flags
 *
 * Uses OpenAI GPT-4o for intelligent analysis
 */

interface InterviewSummary {
  executiveSummary: string; // 2-3 sentence overview
  strengths: Array<{
    point: string;
    evidence: string; // Quote or specific moment
  }>;
  concerns: Array<{
    point: string;
    severity: "low" | "medium" | "high" | "critical";
    evidence: string;
  }>;
  recommendation: "strong_hire" | "hire" | "maybe" | "no_hire";
  confidence: number; // 0-100
  followUpQuestions: string[]; // 5 suggested questions
  redFlags: Array<{
    flag: string;
    description: string;
  }>;
  overallAssessment: string; // 2-3 paragraphs
}

export const generateInterviewSummary = action({
  args: {
    interviewId: v.string(),
    transcript: v.string(),
    candidateName: v.string(),
    position: v.string(),
    overallScore: v.optional(v.number()),
    speechScore: v.optional(v.number()),
    timingScore: v.optional(v.number()),
    flowScore: v.optional(v.number()),
    linguisticScore: v.optional(v.number()),
    flagCount: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    summary: v.optional(
      v.object({
        executiveSummary: v.string(),
        strengths: v.array(
          v.object({
            point: v.string(),
            evidence: v.string(),
          })
        ),
        concerns: v.array(
          v.object({
            point: v.string(),
            severity: v.union(
              v.literal("low"),
              v.literal("medium"),
              v.literal("high"),
              v.literal("critical")
            ),
            evidence: v.string(),
          })
        ),
        recommendation: v.union(
          v.literal("strong_hire"),
          v.literal("hire"),
          v.literal("maybe"),
          v.literal("no_hire")
        ),
        confidence: v.number(),
        followUpQuestions: v.array(v.string()),
        redFlags: v.array(
          v.object({
            flag: v.string(),
            description: v.string(),
          })
        ),
        overallAssessment: v.string(),
      })
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get OpenAI API key
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY not configured");
      }

      // Generate summary with GPT-4o
      const summary = await generateSummaryWithOpenAI(
        apiKey,
        args.transcript,
        args.candidateName,
        args.position,
        {
          overallScore: args.overallScore,
          speechScore: args.speechScore,
          timingScore: args.timingScore,
          flowScore: args.flowScore,
          linguisticScore: args.linguisticScore,
          flagCount: args.flagCount || 0,
        }
      );

      // Store summary in Convex (we'll add a table for this)
      // For now, just return it

      // Log Joan's activity
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: "unknown", // Will get from candidate lookup in production
        interviewId: args.interviewId,
        action: "extracted_action_items", // Reusing this action type for now
        description: `Joan generated AI interview summary for ${args.candidateName}`,
        details: {
          recommendation: summary.recommendation,
          confidence: summary.confidence,
          strengthsCount: summary.strengths.length,
          concernsCount: summary.concerns.length,
          redFlagsCount: summary.redFlags.length,
        },
        success: true,
      });

      return { success: true, summary };
    } catch (error) {
      console.error("Failed to generate interview summary:", error);

      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: "unknown",
        interviewId: args.interviewId,
        action: "extracted_action_items",
        description: `Joan failed to generate summary: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Call OpenAI GPT-4o to generate interview summary
 */
async function generateSummaryWithOpenAI(
  apiKey: string,
  transcript: string,
  candidateName: string,
  position: string,
  scores: {
    overallScore?: number;
    speechScore?: number;
    timingScore?: number;
    flowScore?: number;
    linguisticScore?: number;
    flagCount: number;
  }
): Promise<InterviewSummary> {
  const systemPrompt = `You are Joan, an AI hiring coordinator and interview analyst for TrueVoice HQ.

Your job is to analyze interview transcripts and authenticity scores to generate comprehensive post-interview briefings.

CONTEXT:
- TrueVoice detects interview fraud using multi-dimensional analysis
- Scores are 0-100 (80+ = authentic, 60-79 = questionable, <60 = high risk)
- Fraud indicators include: unnatural speech patterns, suspicious response timing, lack of conversational flow, linguistic inconsistencies

AUTHENTICITY SCORES FOR THIS INTERVIEW:
- Overall: ${scores.overallScore ?? "Not available"}
- Speech Patterns: ${scores.speechScore ?? "Not available"}
- Response Timing: ${scores.timingScore ?? "Not available"}
- Conversation Flow: ${scores.flowScore ?? "Not available"}
- Linguistic Analysis: ${scores.linguisticScore ?? "Not available"}
- Fraud Flags: ${scores.flagCount}

TASK:
Analyze the interview transcript and scores to generate a comprehensive briefing.

Return ONLY valid JSON with NO markdown formatting:
{
  "executiveSummary": "2-3 sentence overview of the candidate",
  "strengths": [
    {
      "point": "Specific strength",
      "evidence": "Quote or moment from interview"
    }
  ],
  "concerns": [
    {
      "point": "Specific concern",
      "severity": "low|medium|high|critical",
      "evidence": "Quote or moment from interview"
    }
  ],
  "recommendation": "strong_hire|hire|maybe|no_hire",
  "confidence": 0-100,
  "followUpQuestions": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5"
  ],
  "redFlags": [
    {
      "flag": "Flag title",
      "description": "What this means"
    }
  ],
  "overallAssessment": "2-3 paragraph detailed assessment"
}

SCORING GUIDE:
- Overall score 80+, 0 flags → "strong_hire" or "hire"
- Overall score 60-79 → "maybe"
- Overall score <60 → "no_hire"
- Any critical fraud flags → "no_hire" regardless of other scores

BE SPECIFIC: Use actual quotes and moments from the transcript as evidence.
BE HONEST: If there are red flags, say so clearly.
BE HELPFUL: Suggest follow-up questions that probe areas of uncertainty.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `CANDIDATE: ${candidateName}
POSITION: ${position}

INTERVIEW TRANSCRIPT:
${transcript}

Generate the interview summary now.`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  // Parse JSON (handle potential markdown wrapping)
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }

  const summary: InterviewSummary = JSON.parse(jsonStr.trim());

  // Validate and sanitize
  if (!summary.executiveSummary || !summary.recommendation) {
    throw new Error("Invalid summary format from OpenAI");
  }

  return summary;
}
