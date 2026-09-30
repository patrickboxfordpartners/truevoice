import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const viewer = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;

    let company = null;
    if (profile.company_id) {
      const doc = await ctx.db.get(profile.company_id as any);
      if (doc) {
        company = { ...doc, id: doc._id };
      }
    }

    return {
      ...profile,
      userId,
      company,
    };
  },
});

export const createProfile = mutation({
  args: {
    full_name: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing._id;

    const user = await ctx.db.get(userId);
    const email = user?.email ?? "";

    const now = Date.now();

    const companyId = await ctx.db.insert("companies", {
      name: `${args.full_name}'s Company`,
      subscription_tier: "free",
      max_interviews_per_month: 3,
      createdAt: now,
      updatedAt: now,
    });

    const profileId = await ctx.db.insert("profiles", {
      userId,
      email,
      full_name: args.full_name,
      role: "admin",
      company_id: companyId,
      has_completed_onboarding: false,
      createdAt: now,
      updatedAt: now,
    });

    return profileId;
  },
});

export const completeOnboarding = mutation({
  args: {
    companyName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      has_completed_onboarding: true,
      updatedAt: Date.now(),
    });

    if (profile.company_id) {
      await ctx.db.patch(profile.company_id as any, {
        name: args.companyName,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});
