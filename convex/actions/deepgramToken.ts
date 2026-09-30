"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";

export const generate = action({
  args: {
    interviewId: v.string(),
  },
  returns: v.object({
    token: v.string(),
    expires_at: v.string(),
  }),
  handler: async (_ctx, args) => {
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
      const errorText = await tokenResponse.text();
      console.error("[deepgramToken] Error:", tokenResponse.status, errorText);
      throw new Error("Failed to generate Deepgram token");
    }

    const tokenData = await tokenResponse.json();

    return {
      token: tokenData.key,
      expires_at: new Date(Date.now() + 900000).toISOString(),
    };
  },
});
