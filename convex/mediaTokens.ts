import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { advanceTokenWindow } from "./lib/tokenWindow";

export const consume = internalMutation({
  args: {
    bucket: v.string(),
    windowMs: v.number(),
    limit: v.number(),
  },
  returns: v.object({
    allowed: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("media_token_windows")
      .withIndex("by_bucket", (q) => q.eq("bucket", args.bucket))
      .first();

    const next = advanceTokenWindow(
      existing ? { windowStart: existing.windowStart, count: existing.count } : null,
      Date.now(),
      args.windowMs,
      args.limit,
    );

    if (!next.allowed) {
      return { allowed: false };
    }

    if (!existing) {
      await ctx.db.insert("media_token_windows", {
        bucket: args.bucket,
        windowStart: next.windowStart,
        count: next.count,
      });
    } else {
      await ctx.db.patch(existing._id, {
        windowStart: next.windowStart,
        count: next.count,
      });
    }
    return { allowed: true };
  },
});
