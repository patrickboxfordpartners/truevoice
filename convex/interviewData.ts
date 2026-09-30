import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./lib/requireAuth";

export const getFullReport = query({
  args: { interviewId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const interview = await ctx.db.get(args.interviewId as any);
    if (!interview) return null;

    const [report, flags, timeline, delays] = await Promise.all([
      ctx.db.query("interview_reports").withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId)).first(),
      ctx.db.query("interview_flags").withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId)).collect(),
      ctx.db.query("interview_timeline").withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId)).collect(),
      ctx.db.query("response_delays").withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId)).collect(),
    ]);

    let interviewer = null;
    if (interview.createdBy) {
      interviewer = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", interview.createdBy))
        .first();
    }

    return { interview, report, flags, timeline, responseDelays: delays, interviewer };
  },
});

export const getReport = query({
  args: { interviewId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("interview_reports")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .first();
  },
});

export const getFlags = query({
  args: { interviewId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("interview_flags")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .collect();
  },
});

export const getTimeline = query({
  args: { interviewId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("interview_timeline")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .collect();
  },
});

export const getChunks = query({
  args: { interviewId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("transcript_chunks")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .collect();
  },
});

export const getDelays = query({
  args: { interviewId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("response_delays")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .collect();
  },
});

export const getCompletedReports = query({
  args: { companyId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const completed = interviews.filter((i) => i.status === "completed");

    const reports = await Promise.all(
      completed.map(async (interview) => {
        const [report, flags, timeline, delays] = await Promise.all([
          ctx.db.query("interview_reports")
            .withIndex("by_interview", (q) => q.eq("interviewId", interview._id))
            .first(),
          ctx.db.query("interview_flags")
            .withIndex("by_interview", (q) => q.eq("interviewId", interview._id))
            .collect(),
          ctx.db.query("interview_timeline")
            .withIndex("by_interview", (q) => q.eq("interviewId", interview._id))
            .collect(),
          ctx.db.query("response_delays")
            .withIndex("by_interview", (q) => q.eq("interviewId", interview._id))
            .collect(),
        ]);

        if (!report) return null;

        return {
          id: interview._id,
          candidate: interview.candidateName,
          position: interview.position,
          date: interview.scheduledAt
            ? new Date(interview.scheduledAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "",
          duration: interview.duration ?? "",
          overall: report.overallScore,
          speech: report.speechScore,
          timing: report.timingScore,
          flow: report.flowScore,
          linguistic: report.linguisticScore,
          engagement: report.engagement,
          confidence: report.confidence,
          summary: report.summary ?? "",
          flags: flags.map((f) => ({
            time: f.time,
            pattern: f.pattern,
            severity: f.severity,
          })),
          timeline: timeline.map((t) => ({
            min: t.minute,
            score: t.score,
          })),
          responseDelays: delays.map((d) => ({
            question: d.question,
            delay: d.delay,
            label: d.label,
          })),
        };
      })
    );

    return reports.filter(Boolean);
  },
});

export const insertChunk = mutation({
  args: {
    interviewId: v.string(),
    chunkIndex: v.number(),
    text: v.string(),
    speaker: v.optional(v.string()),
    elapsedSeconds: v.number(),
    speechScore: v.optional(v.number()),
    timingScore: v.optional(v.number()),
    flowScore: v.optional(v.number()),
    linguisticScore: v.optional(v.number()),
  },
  returns: v.id("transcript_chunks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("transcript_chunks", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const insertFlags = mutation({
  args: {
    flags: v.array(v.object({
      interviewId: v.string(),
      time: v.string(),
      pattern: v.string(),
      severity: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high")
      ),
      flagType: v.optional(v.string()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const flag of args.flags) {
      await ctx.db.insert("interview_flags", {
        ...flag,
        createdAt: now,
      });
    }
    return null;
  },
});

export const insertTimelineEntry = mutation({
  args: {
    interviewId: v.string(),
    minute: v.string(),
    score: v.number(),
  },
  returns: v.id("interview_timeline"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("interview_timeline", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const insertDelays = mutation({
  args: {
    delays: v.array(v.object({
      interviewId: v.string(),
      question: v.string(),
      delay: v.number(),
      label: v.string(),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const d of args.delays) {
      await ctx.db.insert("response_delays", {
        ...d,
        createdAt: now,
      });
    }
    return null;
  },
});

export const saveReport = mutation({
  args: {
    interviewId: v.string(),
    overallScore: v.number(),
    speechScore: v.number(),
    timingScore: v.number(),
    flowScore: v.number(),
    linguisticScore: v.number(),
    engagement: v.number(),
    confidence: v.number(),
    summary: v.optional(v.string()),
    recommendations: v.optional(v.array(v.string())),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("interview_reports")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        overallScore: args.overallScore,
        speechScore: args.speechScore,
        timingScore: args.timingScore,
        flowScore: args.flowScore,
        linguisticScore: args.linguisticScore,
        engagement: args.engagement,
        confidence: args.confidence,
        summary: args.summary,
        recommendations: args.recommendations,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("interview_reports", {
      ...args,
      createdAt: Date.now(),
    });
    return id;
  },
});
