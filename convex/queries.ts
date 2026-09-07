import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { requireAuth } from "./lib/requireAuth";

/**
 * Query functions for TrueVoice + Joan
 */

// ─────────────────────────────────────────────────────────────────
// HIRING PIPELINE QUERIES
// ─────────────────────────────────────────────────────────────────

export const getCandidateById = query({
  args: { candidateId: v.id("hiring_pipeline") },
  returns: v.union(
    v.object({
      _id: v.id("hiring_pipeline"),
      _creationTime: v.number(),
      interviewId: v.string(),
      candidateName: v.string(),
      candidateEmail: v.string(),
      position: v.string(),
      companyId: v.string(),
      stage: v.string(),
      previousStage: v.optional(v.string()),
      stageChangedAt: v.number(),
      stageChangedBy: v.string(),
      linkedinUrl: v.optional(v.string()),
      githubUrl: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      experience: v.optional(v.string()),
      lastEnriched: v.optional(v.number()),
      twitterUrl: v.optional(v.string()),
      mediumUrl: v.optional(v.string()),
      substackUrl: v.optional(v.string()),
      facebookUrl: v.optional(v.string()),
      instagramUrl: v.optional(v.string()),
      resumeUrl: v.optional(v.string()),
      resumeText: v.optional(v.string()),
      overallScore: v.optional(v.number()),
      flagCount: v.number(),
      actionItemsComplete: v.number(),
      actionItemsTotal: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.candidateId);
  },
});

export const getCandidateByInterview = query({
  args: { interviewId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("hiring_pipeline"),
      _creationTime: v.number(),
      interviewId: v.string(),
      candidateName: v.string(),
      candidateEmail: v.string(),
      position: v.string(),
      companyId: v.string(),
      stage: v.string(),
      previousStage: v.optional(v.string()),
      stageChangedAt: v.number(),
      stageChangedBy: v.string(),
      linkedinUrl: v.optional(v.string()),
      githubUrl: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      experience: v.optional(v.string()),
      lastEnriched: v.optional(v.number()),
      twitterUrl: v.optional(v.string()),
      mediumUrl: v.optional(v.string()),
      substackUrl: v.optional(v.string()),
      facebookUrl: v.optional(v.string()),
      instagramUrl: v.optional(v.string()),
      resumeUrl: v.optional(v.string()),
      resumeText: v.optional(v.string()),
      overallScore: v.optional(v.number()),
      flagCount: v.number(),
      actionItemsComplete: v.number(),
      actionItemsTotal: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .first();
  },
});

export const getCandidatesByCompany = query({
  args: { companyId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("hiring_pipeline"),
      _creationTime: v.number(),
      interviewId: v.string(),
      candidateName: v.string(),
      candidateEmail: v.string(),
      position: v.string(),
      companyId: v.string(),
      stage: v.string(),
      overallScore: v.optional(v.number()),
      flagCount: v.number(),
      actionItemsComplete: v.number(),
      actionItemsTotal: v.number(),
      updatedAt: v.number(),
      resumeText: v.optional(v.string()),
      resumeUrl: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const candidates = await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return candidates.map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
      interviewId: c.interviewId,
      candidateName: c.candidateName,
      candidateEmail: c.candidateEmail,
      position: c.position,
      companyId: c.companyId,
      stage: c.stage,
      overallScore: c.overallScore,
      flagCount: c.flagCount,
      actionItemsComplete: c.actionItemsComplete,
      actionItemsTotal: c.actionItemsTotal,
      updatedAt: c.updatedAt,
      resumeText: c.resumeText,
      resumeUrl: c.resumeUrl,
    }));
  },
});

export const getCandidatesByStage = query({
  args: {
    companyId: v.string(),
    stage: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("final"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected")
    ),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const allCandidates = await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return allCandidates.filter((c) => c.stage === args.stage);
  },
});

// ─────────────────────────────────────────────────────────────────
// ACTION ITEMS QUERIES
// ─────────────────────────────────────────────────────────────────

export const getActionItemsByCandidate = query({
  args: { candidateId: v.id("hiring_pipeline") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("action_items")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect();
  },
});

export const getPendingActionItems = query({
  args: { companyId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const allItems = await ctx.db
      .query("action_items")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return allItems.filter((item) => item.status === "pending");
  },
});

// ─────────────────────────────────────────────────────────────────
// REAL-TIME COLLABORATION QUERIES
// ─────────────────────────────────────────────────────────────────

export const getLiveSessionsByInterview = query({
  args: { interviewId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const allSessions = await ctx.db
      .query("live_sessions")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .collect();

    // Filter to active sessions (heartbeat within last 30 seconds)
    const now = Date.now();
    return allSessions.filter(
      (s) => s.status === "active" && now - s.lastHeartbeat < 30000
    );
  },
});

export const getSharedNotesByInterview = query({
  args: { interviewId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("shared_notes")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .collect();
  },
});

export const getInterviewScores = query({
  args: { interviewId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("interview_scores")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .first();
  },
});

// ─────────────────────────────────────────────────────────────────
// JOAN ACTIVITY QUERIES
// ─────────────────────────────────────────────────────────────────

export const getJoanSettings = query({
  args: { companyId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("joan_settings"),
      _creationTime: v.number(),
      companyId: v.string(),
      companyName: v.optional(v.string()),
      autoRouting: v.boolean(),
      autoActionItems: v.boolean(),
      autoStageMovement: v.boolean(),
      reminderTiming: v.union(
        v.literal("immediate"),
        v.literal("1hour"),
        v.literal("3hours"),
        v.literal("1day")
      ),
      notificationPreference: v.union(
        v.literal("all"),
        v.literal("important"),
        v.literal("none")
      ),
      advanceThreshold: v.optional(v.number()),
      rejectThreshold: v.optional(v.number()),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("joan_settings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .first();
  },
});

export const getJoanActivity = query({
  args: {
    companyId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const activities = await ctx.db
      .query("joan_activity")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(args.limit ?? 50);

    return activities;
  },
});

// ─────────────────────────────────────────────────────────────────
// INTERNAL QUERIES (for cron jobs and internal actions)
// ─────────────────────────────────────────────────────────────────

/**
 * Get action items due within a time window
 * Used by deadline reminder cron job
 */
export const getActionItemsDueSoon = internalQuery({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    // Use the by_due_date index to efficiently query items in the time window
    const allItems = await ctx.db
      .query("action_items")
      .withIndex("by_due_date")
      .collect();

    // Filter to items in the time window (Convex doesn't support range queries on indexes yet)
    return allItems.filter(
      (item) =>
        item.dueDate !== undefined &&
        item.dueDate >= args.startTime &&
        item.dueDate <= args.endTime
    );
  },
});

// ─────────────────────────────────────────────────────────────────
// EMAIL THREADS QUERIES
// ─────────────────────────────────────────────────────────────────

export const getEmailThreadsByCandidate = query({
  args: { candidateId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const emails = await ctx.db
      .query("email_threads")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .order("desc")
      .collect();

    return emails;
  },
});

// ─────────────────────────────────────────────────────────────────
// ASYNC INTERVIEW QUERIES
// ─────────────────────────────────────────────────────────────────

export const getQuestionsByCompany = query({
  args: {
    companyId: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const baseQuery = ctx.db
      .query("interview_questions")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId));

    const questions = await baseQuery.collect();

    // Filter for active questions if requested
    const filtered = args.activeOnly
      ? questions.filter((q) => q.isActive)
      : questions;

    // Sort by position
    return filtered.sort((a, b) => a.position - b.position);
  },
});

export const getQuestion = query({
  args: { questionId: v.id("interview_questions") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.questionId);
  },
});

export const getResponsesByInterview = query({
  args: { interviewId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const responses = await ctx.db
      .query("candidate_responses")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .collect();

    return responses;
  },
});

export const getResponseByInterviewAndQuestion = query({
  args: {
    interviewId: v.string(),
    questionId: v.id("interview_questions"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("candidate_responses")
      .withIndex("by_interview_question", (q) =>
        q.eq("interviewId", args.interviewId).eq("questionId", args.questionId)
      )
      .first();
  },
});

export const getResponsesByCandidate = query({
  args: { candidateId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const responses = await ctx.db
      .query("candidate_responses")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect();

    return responses;
  },
});

// ─────────────────────────────────────────────────────────────────
// INTELLIGENCE BRIEFS QUERIES
// ─────────────────────────────────────────────────────────────────

export const getIntelligenceBrief = query({
  args: { briefId: v.id("intelligence_briefs") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.briefId);
  },
});

export const getBriefByCandidate = query({
  args: { candidateId: v.id("hiring_pipeline") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("intelligence_briefs")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .order("desc")
      .first();
  },
});

export const getBriefsByCompany = query({
  args: { companyId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("intelligence_briefs")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();
  },
});

// ─────────────────────────────────────────────────────────────────
// AUTOPILOT QUEUE QUERIES
// ─────────────────────────────────────────────────────────────────

export const getAutopilotItem = query({
  args: { itemId: v.id("autopilot_queue") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.itemId);
  },
});

export const getPendingAutopilotItems = query({
  args: { companyId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("autopilot_queue")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", args.companyId).eq("status", "pending")
      )
      .order("desc")
      .collect();
  },
});

export const getCompletedBriefsWithoutAutopilot = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    await requireAuth(ctx);
    const completedBriefs = await ctx.db
      .query("intelligence_briefs")
      .withIndex("by_status", (q) => q.eq("status", "complete"))
      .order("desc")
      .take(100);

    const results = [];
    for (const brief of completedBriefs) {
      const existingItem = await ctx.db
        .query("autopilot_queue")
        .withIndex("by_candidate", (q) => q.eq("candidateId", brief.candidateId))
        .first();
      if (!existingItem) {
        results.push(brief);
      }
    }
    return results;
  },
});

export const getAutopilotItemByCandidate = query({
  args: { candidateId: v.id("hiring_pipeline") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("autopilot_queue")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .order("desc")
      .first();
  },
});

export const getAutopilotAnalytics = query({
  args: { companyId: v.string() },
  returns: v.object({
    total: v.number(),
    pending: v.number(),
    approved: v.number(),
    rejected: v.number(),
    modified: v.number(),
    approvalRate: v.number(),
    overrideRate: v.number(),
    avgConfidenceApproved: v.number(),
    avgConfidenceOverridden: v.number(),
    byRecommendation: v.object({
      advance: v.object({ total: v.number(), approved: v.number(), rejected: v.number(), modified: v.number() }),
      review: v.object({ total: v.number(), approved: v.number(), rejected: v.number(), modified: v.number() }),
      reject: v.object({ total: v.number(), approved: v.number(), rejected: v.number(), modified: v.number() }),
    }),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const items = await ctx.db
      .query("autopilot_queue")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const resolved = items.filter((i) => i.status !== "pending");
    const approved = resolved.filter((i) => i.status === "approved");
    const rejected = resolved.filter((i) => i.status === "rejected");
    const modified = resolved.filter((i) => i.status === "modified");
    const overridden = [...rejected, ...modified];

    const avgConfidence = (arr: typeof items) =>
      arr.length > 0
        ? Math.round(arr.reduce((s, i) => s + i.confidenceScore, 0) / arr.length)
        : 0;

    const byRec = (rec: "advance" | "review" | "reject") => {
      const subset = items.filter((i) => i.recommendation === rec);
      return {
        total: subset.length,
        approved: subset.filter((i) => i.status === "approved").length,
        rejected: subset.filter((i) => i.status === "rejected").length,
        modified: subset.filter((i) => i.status === "modified").length,
      };
    };

    return {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      approved: approved.length,
      rejected: rejected.length,
      modified: modified.length,
      approvalRate: resolved.length > 0 ? Math.round((approved.length / resolved.length) * 100) : 0,
      overrideRate: resolved.length > 0 ? Math.round((overridden.length / resolved.length) * 100) : 0,
      avgConfidenceApproved: avgConfidence(approved),
      avgConfidenceOverridden: avgConfidence(overridden),
      byRecommendation: {
        advance: byRec("advance"),
        review: byRec("review"),
        reject: byRec("reject"),
      },
    };
  },
});

// ─────────────────────────────────────────────────────────────────
// SHARED BRIEFS QUERIES
// ─────────────────────────────────────────────────────────────────

export const getSharedBrief = query({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      candidateName: v.string(),
      position: v.string(),
      synthesis: v.object({
        summary: v.string(),
        strengths: v.array(v.string()),
        risks: v.array(v.string()),
        customQuestions: v.array(v.object({
          question: v.string(),
          rationale: v.string(),
          targetGap: v.string(),
        })),
        confidenceScore: v.number(),
        recommendation: v.union(
          v.literal("advance"),
          v.literal("review"),
          v.literal("reject")
        ),
      }),
      webPresence: v.union(
        v.object({
          linkedinSummary: v.optional(v.string()),
          githubSummary: v.optional(v.string()),
          rawSkills: v.optional(v.array(v.string())),
          experience: v.optional(v.string()),
        }),
        v.null()
      ),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const shared = await ctx.db
      .query("shared_briefs")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!shared) return null;

    if (shared.expiresAt && shared.expiresAt < Date.now()) return null;

    return {
      candidateName: shared.candidateName,
      position: shared.position,
      synthesis: shared.synthesis,
      webPresence: shared.webPresence ?? null,
      createdAt: shared.createdAt,
    };
  },
});

// ─────────────────────────────────────────────────────────────────
// SUGGESTED QUESTIONS (from intelligence briefs)
// ─────────────────────────────────────────────────────────────────

export const getRecentSuggestedQuestions = query({
  args: {
    companyId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      question: v.string(),
      rationale: v.string(),
      targetGap: v.string(),
      candidateName: v.string(),
      briefId: v.id("intelligence_briefs"),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const maxBriefs = args.limit ?? 5;

    const briefs = await ctx.db
      .query("intelligence_briefs")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    const completeBriefs = briefs
      .filter((b) => b.status === "complete")
      .slice(0, maxBriefs);

    const results: {
      question: string;
      rationale: string;
      targetGap: string;
      candidateName: string;
      briefId: typeof completeBriefs[0]["_id"];
    }[] = [];

    for (const brief of completeBriefs) {
      const candidate = await ctx.db.get(brief.candidateId);
      const name = candidate?.candidateName ?? "Unknown";

      for (const q of brief.synthesis.customQuestions) {
        results.push({
          question: q.question,
          rationale: q.rationale,
          targetGap: q.targetGap,
          candidateName: name,
          briefId: brief._id,
        });
      }
    }

    return results;
  },
});

// ─────────────────────────────────────────────────────────────────
// PIPELINE FUNNEL STATS
// ─────────────────────────────────────────────────────────────────

export const getPipelineFunnelStats = query({
  args: { companyId: v.string() },
  returns: v.object({
    screening: v.number(),
    technical: v.number(),
    final: v.number(),
    offer: v.number(),
    hired: v.number(),
    rejected: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const candidates = await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const counts = { screening: 0, technical: 0, final: 0, offer: 0, hired: 0, rejected: 0 };
    for (const c of candidates) {
      if (c.stage in counts) {
        counts[c.stage as keyof typeof counts]++;
      }
    }

    return { ...counts, total: candidates.length };
  },
});

// ─────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────

export const getEmailTemplates = query({
  args: { companyId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("email_templates"),
      name: v.string(),
      type: v.string(),
      subject: v.string(),
      body: v.string(),
      isDefault: v.boolean(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const templates = await ctx.db
      .query("email_templates")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return templates.map((t) => ({
      _id: t._id,
      name: t.name,
      type: t.type,
      subject: t.subject,
      body: t.body,
      isDefault: t.isDefault,
      updatedAt: t.updatedAt,
    }));
  },
});

// ─────────────────────────────────────────────────────────────────
// RECENT JOAN ACTIVITY (for notification feed)
// ─────────────────────────────────────────────────────────────────

export const getRecentJoanNotifications = query({
  args: {
    companyId: v.string(),
    since: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("joan_activity"),
      action: v.string(),
      description: v.string(),
      candidateId: v.optional(v.string()),
      success: v.boolean(),
      timestamp: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const activities = await ctx.db
      .query("joan_activity")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    return activities
      .filter((a) => a.timestamp >= args.since)
      .slice(0, 20)
      .map((a) => ({
        _id: a._id,
        action: a.action,
        description: a.description,
        candidateId: a.candidateId,
        success: a.success,
        timestamp: a.timestamp,
      }));
  },
});

// ─────────────────────────────────────────────────────────────────
// CANDIDATES FOR COMPARISON (with briefs)
// ─────────────────────────────────────────────────────────────────

export const getCandidatesWithBriefs = query({
  args: { companyId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("hiring_pipeline"),
      candidateName: v.string(),
      position: v.string(),
      stage: v.string(),
      overallScore: v.optional(v.number()),
      brief: v.optional(
        v.object({
          confidenceScore: v.number(),
          recommendation: v.string(),
          summary: v.string(),
          strengths: v.array(v.string()),
          risks: v.array(v.string()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const candidates = await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const results = [];
    for (const c of candidates) {
      const brief = await ctx.db
        .query("intelligence_briefs")
        .withIndex("by_candidate", (q) => q.eq("candidateId", c._id))
        .first();

      results.push({
        _id: c._id,
        candidateName: c.candidateName,
        position: c.position,
        stage: c.stage,
        overallScore: c.overallScore,
        brief:
          brief && brief.status === "complete"
            ? {
                confidenceScore: brief.synthesis.confidenceScore,
                recommendation: brief.synthesis.recommendation,
                summary: brief.synthesis.summary,
                strengths: brief.synthesis.strengths,
                risks: brief.synthesis.risks,
              }
            : undefined,
      });
    }

    return results;
  },
});

// ─────────────────────────────────────────────────────────────────
// STAGE RULES
// ─────────────────────────────────────────────────────────────────

export const getStageRules = query({
  args: { companyId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("stage_rules"),
      name: v.string(),
      fromStage: v.string(),
      toStage: v.string(),
      conditions: v.object({
        minScore: v.optional(v.number()),
        allActionItemsComplete: v.optional(v.boolean()),
        briefComplete: v.optional(v.boolean()),
        minConfidence: v.optional(v.number()),
        recommendation: v.optional(v.string()),
      }),
      isActive: v.boolean(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const rules = await ctx.db
      .query("stage_rules")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return rules.map((r) => ({
      _id: r._id,
      name: r.name,
      fromStage: r.fromStage,
      toStage: r.toStage,
      conditions: r.conditions,
      isActive: r.isActive,
      updatedAt: r.updatedAt,
    }));
  },
});

// ─────────────────────────────────────────────────────────────────
// PIPELINE EXPORT DATA
// ─────────────────────────────────────────────────────────────────

export const getPipelineExportData = query({
  args: { companyId: v.string() },
  returns: v.array(
    v.object({
      candidateName: v.string(),
      candidateEmail: v.string(),
      position: v.string(),
      stage: v.string(),
      overallScore: v.optional(v.number()),
      flagCount: v.number(),
      actionItemsComplete: v.number(),
      actionItemsTotal: v.number(),
      confidenceScore: v.optional(v.number()),
      recommendation: v.optional(v.string()),
      briefSummary: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const candidates = await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const results = [];
    for (const c of candidates) {
      const brief = await ctx.db
        .query("intelligence_briefs")
        .withIndex("by_candidate", (q) => q.eq("candidateId", c._id))
        .first();

      results.push({
        candidateName: c.candidateName,
        candidateEmail: c.candidateEmail,
        position: c.position,
        stage: c.stage,
        overallScore: c.overallScore,
        flagCount: c.flagCount,
        actionItemsComplete: c.actionItemsComplete,
        actionItemsTotal: c.actionItemsTotal,
        confidenceScore: brief?.status === "complete" ? brief.synthesis.confidenceScore : undefined,
        recommendation: brief?.status === "complete" ? brief.synthesis.recommendation : undefined,
        briefSummary: brief?.status === "complete" ? brief.synthesis.summary : undefined,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    return results;
  },
});

// ─────────────────────────────────────────────────────────────────
// CANDIDATE NOTES
// ─────────────────────────────────────────────────────────────────

export const getCandidateNotes = query({
  args: { candidateId: v.id("hiring_pipeline") },
  returns: v.array(
    v.object({
      _id: v.id("candidate_notes"),
      authorName: v.string(),
      content: v.string(),
      type: v.union(v.literal("note"), v.literal("flag"), v.literal("question"), v.literal("decision")),
      isPinned: v.boolean(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const notes = await ctx.db
      .query("candidate_notes")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .order("desc")
      .collect();

    return notes.map((n) => ({
      _id: n._id,
      authorName: n.authorName,
      content: n.content,
      type: n.type,
      isPinned: n.isPinned,
      createdAt: n.createdAt,
    }));
  },
});

// ─────────────────────────────────────────────────────────────────
// DASHBOARD ANALYTICS
// ─────────────────────────────────────────────────────────────────

export const getDashboardStats = query({
  args: { companyId: v.string() },
  returns: v.object({
    totalCandidates: v.number(),
    byStage: v.object({
      screening: v.number(),
      technical: v.number(),
      final: v.number(),
      offer: v.number(),
      hired: v.number(),
      rejected: v.number(),
    }),
    avgScore: v.union(v.number(), v.null()),
    avgTimeInStage: v.union(v.number(), v.null()),
    recentHires: v.number(),
    recentRejects: v.number(),
    positionBreakdown: v.array(v.object({ position: v.string(), count: v.number() })),
    scoreDistribution: v.object({
      excellent: v.number(),
      good: v.number(),
      fair: v.number(),
      poor: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const candidates = await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const byStage = { screening: 0, technical: 0, final: 0, offer: 0, hired: 0, rejected: 0 };
    const posMap: Record<string, number> = {};
    const scoreDist = { excellent: 0, good: 0, fair: 0, poor: 0 };
    let scoreSum = 0;
    let scoreCount = 0;
    let stageTimeSum = 0;
    let stageTimeCount = 0;
    let recentHires = 0;
    let recentRejects = 0;

    for (const c of candidates) {
      const stage = c.stage as keyof typeof byStage;
      if (stage in byStage) byStage[stage]++;

      posMap[c.position] = (posMap[c.position] || 0) + 1;

      if (c.overallScore !== undefined) {
        scoreSum += c.overallScore;
        scoreCount++;
        if (c.overallScore >= 80) scoreDist.excellent++;
        else if (c.overallScore >= 60) scoreDist.good++;
        else if (c.overallScore >= 40) scoreDist.fair++;
        else scoreDist.poor++;
      }

      if (c.stageChangedAt) {
        const timeInStage = now - c.stageChangedAt;
        stageTimeSum += timeInStage;
        stageTimeCount++;
      }

      if (c.stage === "hired" && c.stageChangedAt && c.stageChangedAt > thirtyDaysAgo) recentHires++;
      if (c.stage === "rejected" && c.stageChangedAt && c.stageChangedAt > thirtyDaysAgo) recentRejects++;
    }

    return {
      totalCandidates: candidates.length,
      byStage,
      avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null,
      avgTimeInStage: stageTimeCount > 0 ? Math.round(stageTimeSum / stageTimeCount / (1000 * 60 * 60 * 24)) : null,
      recentHires,
      recentRejects,
      positionBreakdown: Object.entries(posMap)
        .map(([position, count]) => ({ position, count }))
        .sort((a, b) => b.count - a.count),
      scoreDistribution: scoreDist,
    };
  },
});

export const getCandidateTags = query({
  args: { candidateId: v.id("hiring_pipeline") },
  returns: v.array(
    v.object({
      _id: v.id("candidate_tags"),
      tag: v.string(),
      color: v.string(),
      addedBy: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const tags = await ctx.db
      .query("candidate_tags")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect();
    return tags.map((t) => ({
      _id: t._id,
      tag: t.tag,
      color: t.color,
      addedBy: t.addedBy,
      createdAt: t.createdAt,
    }));
  },
});

export const getAllCompanyTags = query({
  args: { companyId: v.string() },
  returns: v.array(v.object({ tag: v.string(), color: v.string(), count: v.number() })),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const allTags = await ctx.db
      .query("candidate_tags")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
    const tagMap: Record<string, { color: string; count: number }> = {};
    for (const t of allTags) {
      if (!tagMap[t.tag]) tagMap[t.tag] = { color: t.color, count: 0 };
      tagMap[t.tag].count++;
    }
    return Object.entries(tagMap).map(([tag, { color, count }]) => ({ tag, color, count }));
  },
});

export const getCandidateActivity = query({
  args: { candidateId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const activities = await ctx.db
      .query("joan_activity")
      .withIndex("by_company")
      .order("desc")
      .collect();
    return activities
      .filter((a) => a.candidateId === args.candidateId)
      .slice(0, args.limit ?? 50);
  },
});

export const getInterviewFeedbackByCandidate = query({
  args: { candidateId: v.id("hiring_pipeline") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("interview_feedback")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .order("desc")
      .collect();
  },
});

export const searchCandidates = query({
  args: { companyId: v.string(), searchTerm: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("hiring_pipeline"),
      candidateName: v.string(),
      candidateEmail: v.string(),
      position: v.string(),
      stage: v.string(),
      overallScore: v.optional(v.number()),
      flagCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const candidates = await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
    const term = args.searchTerm.toLowerCase();
    return candidates
      .filter(
        (c) =>
          c.candidateName.toLowerCase().includes(term) ||
          c.candidateEmail.toLowerCase().includes(term) ||
          c.position.toLowerCase().includes(term) ||
          (c.skills || []).some((s: string) => s.toLowerCase().includes(term))
      )
      .map((c) => ({
        _id: c._id,
        candidateName: c.candidateName,
        candidateEmail: c.candidateEmail,
        position: c.position,
        stage: c.stage,
        overallScore: c.overallScore,
        flagCount: c.flagCount,
      }));
  },
});

export const getSimilarCandidates = query({
  args: { candidateId: v.id("hiring_pipeline") },
  returns: v.array(
    v.object({
      _id: v.id("hiring_pipeline"),
      interviewId: v.string(),
      candidateName: v.string(),
      position: v.string(),
      stage: v.string(),
      overallScore: v.optional(v.number()),
      similarity: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const target = await ctx.db.get(args.candidateId);
    if (!target) return [];

    const allCandidates = await ctx.db
      .query("hiring_pipeline")
      .withIndex("by_company", (q) => q.eq("companyId", target.companyId))
      .collect();

    const targetSkills = new Set(target.skills || []);
    const results = allCandidates
      .filter((c) => c._id !== args.candidateId)
      .map((c) => {
        let similarity = 0;
        if (c.position === target.position) similarity += 40;
        const cSkills = new Set(c.skills || []);
        const overlap = [...targetSkills].filter((s) => cSkills.has(s)).length;
        const totalSkills = new Set([...targetSkills, ...cSkills]).size;
        if (totalSkills > 0) similarity += Math.round((overlap / totalSkills) * 40);
        if (c.overallScore && target.overallScore) {
          const scoreDiff = Math.abs(c.overallScore - target.overallScore);
          similarity += Math.max(0, 20 - scoreDiff);
        }
        return {
          _id: c._id,
          interviewId: c.interviewId,
          candidateName: c.candidateName,
          position: c.position,
          stage: c.stage,
          overallScore: c.overallScore,
          similarity: Math.min(100, similarity),
        };
      })
      .filter((c) => c.similarity > 20)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return results;
  },
});

export const getScoreBreakdown = query({
  args: { candidateId: v.optional(v.string()), interviewId: v.optional(v.string()) },
  returns: v.union(
    v.object({
      overallScore: v.number(),
      speechScore: v.number(),
      timingScore: v.number(),
      flowScore: v.number(),
      linguisticScore: v.number(),
      engagement: v.number(),
      confidence: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    let score = null;
    if (args.candidateId) {
      score = await ctx.db
        .query("interview_scores")
        .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
        .order("desc")
        .first();
    } else if (args.interviewId) {
      score = await ctx.db
        .query("interview_scores")
        .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
        .order("desc")
        .first();
    }
    if (!score) return null;
    return {
      overallScore: score.overallScore,
      speechScore: score.speechScore,
      timingScore: score.timingScore,
      flowScore: score.flowScore,
      linguisticScore: score.linguisticScore,
      engagement: score.engagement,
      confidence: score.confidence,
    };
  },
});
