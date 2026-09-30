import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./lib/requireAuth";

export const getByCompany = query({
  args: { companyId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("interviews")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { interviewId: v.id("interviews") },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.interviewId);
  },
});

export const getByToken = query({
  args: { token: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviews")
      .withIndex("by_token", (q) => q.eq("candidateToken", args.token))
      .first();
  },
});

export const create = mutation({
  args: {
    companyId: v.string(),
    candidateName: v.string(),
    candidateEmail: v.string(),
    position: v.string(),
    scheduledAt: v.optional(v.number()),
    duration: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("interviews"),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const now = Date.now();
    const token = crypto.randomUUID();

    return await ctx.db.insert("interviews", {
      ...args,
      createdBy: identity.subject,
      status: "scheduled",
      candidateToken: token,
      candidateConsented: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    interviewId: v.id("interviews"),
    candidateName: v.optional(v.string()),
    candidateEmail: v.optional(v.string()),
    position: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    duration: v.optional(v.string()),
    notes: v.optional(v.string()),
    transcript: v.optional(v.string()),
    candidateConsented: v.optional(v.boolean()),
    livekitRoomName: v.optional(v.string()),
    livekitStartedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { interviewId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) updates[k] = val;
    }
    await ctx.db.patch(interviewId, updates);
    return null;
  },
});

export const updateStatus = mutation({
  args: {
    interviewId: v.id("interviews"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.interviewId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateScores = mutation({
  args: {
    interviewId: v.id("interviews"),
    latestScores: v.object({
      speech: v.number(),
      timing: v.number(),
      flow: v.number(),
      linguistic: v.number(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.interviewId, {
      latestScores: args.latestScores,
      updatedAt: Date.now(),
    });
    return null;
  },
});
