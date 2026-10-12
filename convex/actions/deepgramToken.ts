"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { DEEPGRAM_TOKEN_LIMIT, DEEPGRAM_WINDOW_MS } from "../lib/tokenWindow";

export const generate = action({
  args: {
    interviewId: v.string(),
    candidateToken: v.optional(v.string()),
  },
  returns: v.object({
    token: v.string(),
    expires_at: v.string(),
  }),
  handler: async (ctx, args) => {
    const interview = await ctx.runQuery(internal.interviews.getForMediaAccess, {
      interviewId: args.interviewId,
      candidateToken: args.candidateToken,
    });
    if (!interview || interview.interviewId !== args.interviewId) {
      throw new Error("Unauthorized");
    }

    if (!args.candidateToken) {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Unauthorized");
      const companyId = await ctx.runQuery(internal.interviews.getCompanyIdForUser, {
        userId,
      });
      if (!companyId || companyId !== interview.companyId) {
        throw new Error("Unauthorized");
      }
    }

    const slot = await ctx.runMutation(internal.mediaTokens.consume, {
      bucket: `deepgram:${interview.interviewId}`,
      windowMs: DEEPGRAM_WINDOW_MS,
      limit: DEEPGRAM_TOKEN_LIMIT,
    });
    if (!slot.allowed) {
      throw new Error("Too many token requests. Try again shortly.");
    }

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
      throw new Error("DEEPGRAM_API_KEY not configured");
    }

    const tokenResponse = await fetch("https://api.deepgram.com/v1/keys", {
      method: "POST",
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment: `Interview ${args.interviewId}`,
        scopes: ["usage:write"],
        time_to_live_in_seconds: 900,
        tags: [`interview:${args.interviewId}`],
      }),
    });

    if (!tokenResponse.ok) {
      console.error("[deepgramToken] Error status:", tokenResponse.status);
      throw new Error("Failed to generate Deepgram token");
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData || typeof tokenData.key !== "string") {
      throw new Error("Failed to generate Deepgram token");
    }

    return {
      token: tokenData.key,
      expires_at: new Date(Date.now() + 900000).toISOString(),
    };
  },
});
