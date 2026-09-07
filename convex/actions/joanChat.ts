"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

export const chat = action({
  args: {
    companyId: v.string(),
    message: v.string(),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const candidates = await ctx.runQuery(api.queries.getCandidatesByCompany, {
      companyId: args.companyId,
    });

    const funnelStats = await ctx.runQuery(api.queries.getPipelineFunnelStats, {
      companyId: args.companyId,
    });

    const recentActivity = await ctx.runQuery(api.queries.getRecentJoanNotifications, {
      companyId: args.companyId,
      since: Date.now() - 7 * 24 * 60 * 60 * 1000,
    });

    const candidateSummaries = candidates.map((c: any) => ({
      name: c.candidateName,
      position: c.position,
      stage: c.stage,
      score: c.overallScore ?? "N/A",
      flags: c.flagCount,
      actionItems: `${c.actionItemsComplete}/${c.actionItemsTotal}`,
    }));

    const systemPrompt = `You are Joan, an AI hiring coordinator for TrueVoice. You help hiring managers understand their pipeline, make decisions about candidates, and optimize their hiring process.

You have access to the following real-time data:

PIPELINE OVERVIEW:
- Total candidates: ${funnelStats.total}
- Screening: ${funnelStats.screening}, Technical: ${funnelStats.technical}, Final: ${funnelStats.final}
- Offer: ${funnelStats.offer}, Hired: ${funnelStats.hired}, Rejected: ${funnelStats.rejected}

CANDIDATES:
${JSON.stringify(candidateSummaries, null, 2)}

RECENT ACTIVITY (last 7 days):
${recentActivity.slice(0, 10).map((a: any) => `- ${a.description}`).join("\n")}

GUIDELINES:
- Be concise and actionable. Answer in 2-4 sentences unless asked for detail.
- Reference specific candidates by name when relevant.
- If asked about a candidate you don't have data for, say so.
- Provide data-driven recommendations when asked.
- Use a professional but warm tone.
- Never fabricate data. Only reference what's in the pipeline data above.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...args.history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: args.message },
    ];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return "I'm not fully connected yet -- the OpenAI API key needs to be configured in Convex environment variables. Once set, I'll be able to help you with your hiring pipeline.";
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return "I ran into an issue connecting to my language model. Please try again in a moment.";
    }

    const data = await response.json();
    return data.choices[0]?.message?.content ?? "I wasn't able to formulate a response. Could you rephrase?";
  },
});
