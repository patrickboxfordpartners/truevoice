import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./lib/requireAuth";

export const getByToken = query({
  args: { token: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("report_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) return null;
    if (tokenDoc.expiresAt < Date.now()) return null;

    return tokenDoc;
  },
});

export const create = mutation({
  args: { interviewId: v.string() },
  returns: v.object({ token: v.string(), expiresAt: v.number() }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const token = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("report_tokens", {
      interviewId: args.interviewId,
      token,
      expiresAt,
      createdAt: now,
    });

    return { token, expiresAt };
  },
});
