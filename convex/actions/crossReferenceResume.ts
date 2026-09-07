"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Joan's Resume Cross-Reference Action
 *
 * Analyzes interview transcript against resume to detect:
 * - Inconsistencies (claims don't match)
 * - Exaggerations (inflated experience/achievements)
 * - Omissions (achievements mentioned but not on resume)
 * - Timeline gaps or contradictions
 *
 * Uses OpenAI GPT-4o for intelligent comparison
 */

interface Inconsistency {
  claim: string;
  resumeSays: string;
  interviewSays: string;
  severity: "low" | "medium" | "high" | "critical";
  verdict: string;
}

interface VerifiedClaim {
  claim: string;
  evidence: string;
}

interface MissingItem {
  claim: string;
  note: string;
}

interface CrossReferenceResult {
  overallConsistency: number; // 0-100
  inconsistencies: Inconsistency[];
  verified: VerifiedClaim[];
  missing: MissingItem[];
  summary: string;
}

export const crossReferenceResume = action({
  args: {
    candidateId: v.id("hiring_pipeline"),
    candidateName: v.string(),
    resumeText: v.string(),
    transcript: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    result: v.optional(
      v.object({
        overallConsistency: v.number(),
        inconsistencies: v.array(
          v.object({
            claim: v.string(),
            resumeSays: v.string(),
            interviewSays: v.string(),
            severity: v.union(
              v.literal("low"),
              v.literal("medium"),
              v.literal("high"),
              v.literal("critical")
            ),
            verdict: v.string(),
          })
        ),
        verified: v.array(
          v.object({
            claim: v.string(),
            evidence: v.string(),
          })
        ),
        missing: v.array(
          v.object({
            claim: v.string(),
            note: v.string(),
          })
        ),
        summary: v.string(),
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

      // Get candidate details for logging
      const candidate = await ctx.runQuery(api.queries.getCandidateById, {
        candidateId: args.candidateId,
      });

      // Analyze with OpenAI
      const result = await analyzeWithOpenAI(
        apiKey,
        args.candidateName,
        args.resumeText,
        args.transcript
      );

      // Log Joan's activity
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: candidate?.companyId ?? "unknown",
        candidateId: args.candidateId,
        action: "extracted_action_items", // Reusing for now
        description: `Joan cross-referenced ${args.candidateName}'s resume against interview (${result.overallConsistency}% match)`,
        details: {
          consistencyScore: result.overallConsistency,
          inconsistenciesFound: result.inconsistencies.length,
          verifiedClaims: result.verified.length,
          missingFromResume: result.missing.length,
        },
        success: true,
      });

      return { success: true, result };
    } catch (error) {
      console.error("Failed to cross-reference resume:", error);

      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: "unknown",
        candidateId: args.candidateId,
        action: "extracted_action_items",
        description: `Joan failed to cross-reference resume: ${error instanceof Error ? error.message : "Unknown error"}`,
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
 * Call OpenAI GPT-4o to analyze resume vs transcript
 */
async function analyzeWithOpenAI(
  apiKey: string,
  candidateName: string,
  resumeText: string,
  transcript: string
): Promise<CrossReferenceResult> {
  const systemPrompt = `You are Joan, an AI hiring coordinator and fraud detection specialist for TrueVoice HQ.

Your job is to cross-reference interview transcripts against resumes to detect inconsistencies, exaggerations, and omissions.

CRITICAL RULES:
1. Be SPECIFIC - Quote exact text from both sources
2. Be FAIR - Don't flag minor discrepancies or reasonable paraphrasing
3. Focus on MATERIAL discrepancies - experience length, job titles, responsibilities, achievements
4. Distinguish between INCONSISTENCY (contradicts resume) vs MISSING (not on resume but should be)

SEVERITY LEVELS:
- critical: Major fabrication (fake degree, fake job, claims 10 years when resume shows 2)
- high: Significant exaggeration (inflates title, claims lead role when resume shows junior)
- medium: Notable discrepancy (off by 1-2 years, overstate responsibilities)
- low: Minor variance (rounding differences, order of events)

Return ONLY valid JSON with NO markdown formatting:
{
  "overallConsistency": 0-100,
  "inconsistencies": [
    {
      "claim": "What they claimed",
      "resumeSays": "Exact quote from resume",
      "interviewSays": "Exact quote from interview",
      "severity": "low|medium|high|critical",
      "verdict": "Why this is concerning"
    }
  ],
  "verified": [
    {
      "claim": "What they claimed",
      "evidence": "How resume confirms this"
    }
  ],
  "missing": [
    {
      "claim": "Achievement mentioned in interview",
      "note": "Why this should be on resume"
    }
  ],
  "summary": "2-3 sentence overall assessment"
}

CONSISTENCY SCORING:
- 90-100: Excellent match, minor variances only
- 80-89: Good match, some discrepancies
- 60-79: Concerning gaps or exaggerations
- 40-59: Major inconsistencies
- 0-39: Fabrication or serious fraud indicators`;

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

RESUME TEXT:
${resumeText}

INTERVIEW TRANSCRIPT:
${transcript}

Cross-reference these documents now. Be thorough but fair.`,
        },
      ],
      temperature: 0.2, // Lower for more consistent analysis
      max_tokens: 2500,
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

  const result: CrossReferenceResult = JSON.parse(jsonStr.trim());

  // Validate
  if (
    typeof result.overallConsistency !== "number" ||
    !Array.isArray(result.inconsistencies) ||
    !Array.isArray(result.verified)
  ) {
    throw new Error("Invalid result format from OpenAI");
  }

  return result;
}
