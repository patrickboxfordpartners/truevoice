"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Joan's OpenAI Action Item Extractor
 *
 * Takes an interview transcript and extracts actionable tasks:
 * - Reference checks
 * - Follow-up questions
 * - Decision points
 * - Documentation needs
 *
 * Uses OpenAI GPT-4 for high-quality extraction
 */

interface ActionItem {
  title: string;
  description?: string;
  type: "reference_check" | "follow_up" | "decision" | "documentation" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: number; // Unix timestamp
  confidence: number; // 0-1
  transcriptTimestamp?: string; // "12:34" format
}

export const extractActionItems = action({
  args: {
    interviewId: v.string(),
    transcript: v.string(),
    candidateName: v.string(),
    position: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    itemsCreated: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get OpenAI API key from environment
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY not configured in Convex environment variables");
      }

      // Call OpenAI to extract action items
      const items = await extractWithOpenAI(
        apiKey,
        args.transcript,
        args.candidateName,
        args.position
      );

      // Get candidate from hiring pipeline (if exists)
      const candidate = await ctx.runQuery(api.queries.getCandidateByInterview, {
        interviewId: args.interviewId,
      });

      // Store extracted items in Convex
      let createdCount = 0;
      for (const item of items) {
        await ctx.runMutation(api.mutations.createActionItem, {
          interviewId: args.interviewId,
          candidateId: candidate?._id,
          companyId: candidate?.companyId ?? "unknown",
          title: item.title,
          description: item.description,
          type: item.type,
          priority: item.priority,
          dueDate: item.dueDate || undefined, // Convert null to undefined
          confidence: item.confidence,
          transcriptTimestamp: item.transcriptTimestamp || undefined,
        });
        createdCount++;
      }

      // Log Joan's activity
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: candidate?.companyId ?? "unknown",
        interviewId: args.interviewId,
        candidateId: candidate?._id,
        action: "extracted_action_items",
        description: `Joan extracted ${createdCount} action items from interview with ${args.candidateName}`,
        details: {
          itemCount: createdCount,
          avgConfidence: items.reduce((sum, i) => sum + i.confidence, 0) / items.length,
        },
        success: true,
      });

      return { success: true, itemsCreated: createdCount };
    } catch (error) {
      console.error("Failed to extract action items:", error);

      // Log failure
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: "unknown",
        interviewId: args.interviewId,
        action: "extracted_action_items",
        description: `Joan failed to extract action items: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        itemsCreated: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Call OpenAI GPT-4 to extract action items from transcript
 */
async function extractWithOpenAI(
  apiKey: string,
  transcript: string,
  candidateName: string,
  position: string
): Promise<ActionItem[]> {
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
          content: `You are Joan, an AI hiring coordinator assistant. Extract actionable tasks from interview transcripts.

Your job is to identify:
- Reference checks that need to be conducted
- Follow-up questions to ask the candidate
- Decisions that need to be made by the hiring team
- Documentation that needs to be prepared (offer letters, background checks, etc.)

Return ONLY valid JSON array with no markdown formatting. Each item must have:
{
  "title": "Short description (e.g., 'Reference check with John Doe')",
  "description": "Optional details",
  "type": "reference_check | follow_up | decision | documentation | other",
  "priority": "low | medium | high | urgent",
  "dueDate": null or unix timestamp (estimate based on urgency),
  "confidence": 0.0 to 1.0 (how confident you are this is a real action item),
  "transcriptTimestamp": "MM:SS" or null (when in the interview this was mentioned)
}

Be conservative - only extract clear, actionable items. Avoid vague or speculative tasks.`,
        },
        {
          role: "user",
          content: `Extract action items from this interview:

**Candidate:** ${candidateName}
**Position:** ${position}

**Transcript:**
${transcript.slice(0, 50000)} ${transcript.length > 50000 ? "...(truncated)" : ""}

Return JSON array only.`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
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

  const items: ActionItem[] = JSON.parse(jsonStr.trim());

  // Validate and sanitize
  return items
    .filter((item) => item.title && item.type && item.priority && item.confidence > 0.5)
    .map((item) => ({
      title: item.title,
      description: item.description || undefined,
      type: item.type,
      priority: item.priority,
      dueDate: item.dueDate || undefined, // Convert null to undefined
      confidence: Math.max(0, Math.min(1, item.confidence)), // Clamp 0-1
      transcriptTimestamp: item.transcriptTimestamp || undefined,
    }));
}
