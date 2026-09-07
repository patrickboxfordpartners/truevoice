import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAuth } from "./lib/requireAuth";

/**
 * Peer Review System
 *
 * Allows hiring managers to request reviews from other managers
 * for second opinions on candidates
 */

// ─────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const requestPeerReview = mutation({
  args: {
    candidateId: v.id("hiring_pipeline"),
    reviewerId: v.string(),
    reviewerName: v.string(),
    requestedBy: v.string(),
    requestedByName: v.string(),
  },
  returns: v.id("peer_reviews"),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    // Get candidate to extract companyId
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    const now = Date.now();

    // Create peer review request
    const reviewId = await ctx.db.insert("peer_reviews", {
      candidateId: args.candidateId,
      companyId: candidate.companyId,
      requestedBy: args.requestedBy,
      requestedByName: args.requestedByName,
      reviewerId: args.reviewerId,
      reviewerName: args.reviewerName,
      status: "pending",
      requestedAt: now,
      updatedAt: now,
    });

    // Log Joan activity
    await ctx.runMutation(api.mutations.logJoanActivity, {
      companyId: candidate.companyId,
      candidateId: args.candidateId,
      action: "peer_review_requested",
      description: `${args.requestedByName} requested peer review from ${args.reviewerName} for ${candidate.candidateName}`,
      details: {
        reviewerId: args.reviewerId,
        reviewerName: args.reviewerName,
      },
      success: true,
    });

    return reviewId;
  },
});

export const submitPeerReview = mutation({
  args: {
    reviewId: v.id("peer_reviews"),
    recommendation: v.union(
      v.literal("strong_hire"),
      v.literal("hire"),
      v.literal("no_hire"),
      v.literal("strong_no_hire")
    ),
    confidence: v.number(),
    strengths: v.array(v.string()),
    concerns: v.array(v.string()),
    additionalInsights: v.optional(v.string()),
    agreeWithOriginal: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    const now = Date.now();

    // Update review with assessment
    await ctx.db.patch(args.reviewId, {
      status: "completed",
      recommendation: args.recommendation,
      confidence: args.confidence,
      strengths: args.strengths,
      concerns: args.concerns,
      additionalInsights: args.additionalInsights,
      agreeWithOriginal: args.agreeWithOriginal,
      completedAt: now,
      updatedAt: now,
    });

    // Get candidate for logging
    const candidate = await ctx.db.get(review.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    // Log Joan activity
    await ctx.runMutation(api.mutations.logJoanActivity, {
      companyId: review.companyId,
      candidateId: review.candidateId,
      action: "peer_review_completed",
      description: `${review.reviewerName} completed peer review for ${candidate.candidateName}: ${args.recommendation}`,
      details: {
        recommendation: args.recommendation,
        confidence: args.confidence,
        agreeWithOriginal: args.agreeWithOriginal,
      },
      success: true,
    });

    return null;
  },
});

export const declinePeerReview = mutation({
  args: {
    reviewId: v.id("peer_reviews"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    await ctx.db.patch(args.reviewId, {
      status: "declined",
      updatedAt: Date.now(),
    });

    return null;
  },
});

// ─────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────

export const getPeerReviewsByCandidate = query({
  args: { candidateId: v.id("hiring_pipeline") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("peer_reviews")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect();
  },
});

export const getPendingReviewsForUser = query({
  args: { reviewerId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const allReviews = await ctx.db
      .query("peer_reviews")
      .withIndex("by_reviewer", (q) => q.eq("reviewerId", args.reviewerId))
      .collect();

    // Filter to pending only
    return allReviews.filter((r) => r.status === "pending");
  },
});

export const getPeerReviewById = query({
  args: { reviewId: v.id("peer_reviews") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.reviewId);
  },
});
