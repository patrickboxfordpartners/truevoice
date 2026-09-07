import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Mutation functions for TrueVoice + Joan
 */

// ─────────────────────────────────────────────────────────────────
// HIRING PIPELINE MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const createCandidate = mutation({
  args: {
    interviewId: v.string(),
    candidateName: v.string(),
    candidateEmail: v.string(),
    position: v.string(),
    companyId: v.string(),
    stage: v.optional(v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("final"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected")
    )),
    movedBy: v.optional(v.union(v.literal("joan"), v.literal("manual"))),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    resumeText: v.optional(v.string()),
    resumeUrl: v.optional(v.string()),
  },
  returns: v.id("hiring_pipeline"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("hiring_pipeline", {
      interviewId: args.interviewId,
      candidateName: args.candidateName,
      candidateEmail: args.candidateEmail,
      position: args.position,
      companyId: args.companyId,
      stage: args.stage ?? "screening",
      stageChangedAt: now,
      stageChangedBy: args.movedBy ?? "manual",
      linkedinUrl: args.linkedinUrl,
      githubUrl: args.githubUrl,
      resumeText: args.resumeText,
      resumeUrl: args.resumeUrl,
      flagCount: 0,
      actionItemsComplete: 0,
      actionItemsTotal: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Only launch intelligence pipeline if we have enrichment data to work with
    const hasEnrichmentData = args.linkedinUrl || args.githubUrl || args.resumeText;
    if (hasEnrichmentData) {
      const briefId = await ctx.db.insert("intelligence_briefs", {
        candidateId: id,
        companyId: args.companyId,
        synthesis: {
          summary: "",
          strengths: [],
          risks: [],
          customQuestions: [],
          confidenceScore: 0,
          recommendation: "review",
        },
        cotalRegistered: false,
        sources: [],
        pipelineDurationMs: 0,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      await ctx.scheduler.runAfter(0, internal.actions.intelligencePipeline.runIntelligencePipeline, {
        candidateId: id,
        briefId,
      });
    }

    return id;
  },
});

export const moveCandidateStage = mutation({
  args: {
    candidateId: v.id("hiring_pipeline"),
    newStage: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("final"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected")
    ),
    movedBy: v.union(v.literal("joan"), v.literal("manual")),
    skipEmail: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found");

    const previousStage = candidate.stage;

    await ctx.db.patch(args.candidateId, {
      previousStage: candidate.stage,
      stage: args.newStage,
      stageChangedAt: Date.now(),
      stageChangedBy: args.movedBy,
      updatedAt: Date.now(),
    });

    if (!args.skipEmail) {
      await ctx.scheduler.runAfter(0, api.actions.sendStageChangeEmail.sendStageChangeEmail, {
        candidateId: args.candidateId,
        candidateName: candidate.candidateName,
        candidateEmail: candidate.candidateEmail,
        position: candidate.position,
        fromStage: previousStage,
        toStage: args.newStage,
        companyId: candidate.companyId,
      });
    }
  },
});

export const enrichCandidate = mutation({
  args: {
    candidateId: v.id("hiring_pipeline"),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    experience: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, {
      linkedinUrl: args.linkedinUrl,
      githubUrl: args.githubUrl,
      skills: args.skills,
      experience: args.experience,
      lastEnriched: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────
// ACTION ITEMS MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const createActionItem = mutation({
  args: {
    interviewId: v.string(),
    candidateId: v.optional(v.id("hiring_pipeline")),
    companyId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("reference_check"),
      v.literal("follow_up"),
      v.literal("decision"),
      v.literal("documentation"),
      v.literal("other")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    dueDate: v.optional(v.number()),
    confidence: v.number(),
    transcriptTimestamp: v.optional(v.string()),
  },
  returns: v.id("action_items"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const actionItemId = await ctx.db.insert("action_items", {
      interviewId: args.interviewId,
      candidateId: args.candidateId,
      companyId: args.companyId,
      title: args.title,
      description: args.description,
      type: args.type,
      status: "pending",
      priority: args.priority,
      dueDate: args.dueDate,
      reminderSent: false,
      extractedBy: "joan",
      extractedAt: now,
      confidence: args.confidence,
      transcriptTimestamp: args.transcriptTimestamp,
      createdAt: now,
      updatedAt: now,
    });

    // Update candidate's action item count
    if (args.candidateId) {
      const candidate = await ctx.db.get(args.candidateId);
      if (candidate) {
        await ctx.db.patch(args.candidateId, {
          actionItemsTotal: candidate.actionItemsTotal + 1,
          updatedAt: now,
        });
      }
    }

    return actionItemId;
  },
});

export const updateActionItemStatus = mutation({
  args: {
    actionItemId: v.id("action_items"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.actionItemId);
    if (!item) throw new Error("Action item not found");

    const now = Date.now();
    const wasCompleted = item.status === "completed";
    const isNowCompleted = args.status === "completed";

    await ctx.db.patch(args.actionItemId, {
      status: args.status,
      updatedAt: now,
      ...(isNowCompleted && { completedAt: now }),
    });

    // Update candidate's completed count
    if (item.candidateId && !wasCompleted && isNowCompleted) {
      const candidate = await ctx.db.get(item.candidateId);
      if (candidate) {
        await ctx.db.patch(item.candidateId, {
          actionItemsComplete: candidate.actionItemsComplete + 1,
          updatedAt: now,
        });
      }
    }
  },
});

export const markReminderSent = mutation({
  args: {
    actionItemId: v.id("action_items"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.actionItemId, {
      reminderSent: true,
      reminderSentAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────
// EMAIL THREADS MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const createEmailThread = mutation({
  args: {
    candidateId: v.optional(v.id("hiring_pipeline")),
    companyId: v.string(),
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    threadId: v.string(),
    messageId: v.string(),
    inReplyTo: v.optional(v.string()),
    routingConfidence: v.number(),
    routingReason: v.string(),
    emailType: v.optional(v.union(
      v.literal("scheduling"),
      v.literal("follow_up"),
      v.literal("reference"),
      v.literal("offer"),
      v.literal("rejection"),
      v.literal("question"),
      v.literal("other")
    )),
    requiresAction: v.boolean(),
    suggestedActionItem: v.optional(v.string()),
  },
  returns: v.id("email_threads"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("email_threads", {
      candidateId: args.candidateId,
      companyId: args.companyId,
      from: args.from,
      to: args.to,
      subject: args.subject,
      body: args.body,
      bodyHtml: args.bodyHtml,
      threadId: args.threadId,
      messageId: args.messageId,
      inReplyTo: args.inReplyTo,
      routedBy: "joan",
      routingConfidence: args.routingConfidence,
      routingReason: args.routingReason,
      emailType: args.emailType,
      requiresAction: args.requiresAction,
      suggestedActionItem: args.suggestedActionItem,
      read: false,
      replied: false,
      receivedAt: now,
      createdAt: now,
    });
  },
});

// ─────────────────────────────────────────────────────────────────
// REAL-TIME COLLABORATION MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const joinLiveSession = mutation({
  args: {
    interviewId: v.string(),
    userId: v.string(),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    companyId: v.string(),
  },
  returns: v.id("live_sessions"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("live_sessions", {
      interviewId: args.interviewId,
      userId: args.userId,
      userName: args.userName,
      userAvatar: args.userAvatar,
      companyId: args.companyId,
      status: "active",
      lastHeartbeat: now,
      joinedAt: now,
    });
  },
});

export const updateHeartbeat = mutation({
  args: {
    sessionId: v.id("live_sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      status: "active",
      lastHeartbeat: Date.now(),
    });
  },
});

export const leaveLiveSession = mutation({
  args: {
    sessionId: v.id("live_sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      status: "disconnected",
      leftAt: Date.now(),
    });
  },
});

export const createSharedNote = mutation({
  args: {
    interviewId: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    companyId: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("note"),
      v.literal("flag"),
      v.literal("question"),
      v.literal("decision")
    ),
    parentNoteId: v.optional(v.id("shared_notes")),
    mentions: v.array(v.string()),
    transcriptTimestamp: v.optional(v.string()),
    videoTimestamp: v.optional(v.number()),
  },
  returns: v.id("shared_notes"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("shared_notes", {
      interviewId: args.interviewId,
      authorId: args.authorId,
      authorName: args.authorName,
      companyId: args.companyId,
      content: args.content,
      type: args.type,
      parentNoteId: args.parentNoteId,
      mentions: args.mentions,
      transcriptTimestamp: args.transcriptTimestamp,
      videoTimestamp: args.videoTimestamp,
      pinned: false,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateInterviewScores = mutation({
  args: {
    interviewId: v.string(),
    candidateId: v.optional(v.id("hiring_pipeline")),
    companyId: v.string(),
    overallScore: v.number(),
    speechScore: v.number(),
    timingScore: v.number(),
    flowScore: v.number(),
    linguisticScore: v.number(),
    engagement: v.number(),
    confidence: v.number(),
    flagCount: v.number(),
    criticalFlags: v.number(),
    updateSource: v.union(
      v.literal("realtime"),
      v.literal("batch"),
      v.literal("manual")
    ),
  },
  returns: v.union(v.id("interview_scores"), v.null()),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if scores already exist
    const existing = await ctx.db
      .query("interview_scores")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        overallScore: args.overallScore,
        speechScore: args.speechScore,
        timingScore: args.timingScore,
        flowScore: args.flowScore,
        linguisticScore: args.linguisticScore,
        engagement: args.engagement,
        confidence: args.confidence,
        flagCount: args.flagCount,
        criticalFlags: args.criticalFlags,
        lastUpdated: now,
        updateSource: args.updateSource,
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("interview_scores", {
        interviewId: args.interviewId,
        candidateId: args.candidateId,
        companyId: args.companyId,
        overallScore: args.overallScore,
        speechScore: args.speechScore,
        timingScore: args.timingScore,
        flowScore: args.flowScore,
        linguisticScore: args.linguisticScore,
        engagement: args.engagement,
        confidence: args.confidence,
        flagCount: args.flagCount,
        criticalFlags: args.criticalFlags,
        lastUpdated: now,
        updateSource: args.updateSource,
        createdAt: now,
      });
    }
  },
});

// ─────────────────────────────────────────────────────────────────
// JOAN ACTIVITY MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const logJoanActivity = mutation({
  args: {
    companyId: v.string(),
    interviewId: v.optional(v.string()),
    candidateId: v.optional(v.id("hiring_pipeline")),
    action: v.union(
      v.literal("extracted_action_items"),
      v.literal("routed_email"),
      v.literal("moved_pipeline_stage"),
      v.literal("sent_reminder"),
      v.literal("sent_status_email"),
      v.literal("created_from_email"),
      v.literal("enriched_candidate"),
      v.literal("flagged_risk"),
      v.literal("created_note")
    ),
    description: v.string(),
    details: v.optional(v.any()),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  returns: v.id("joan_activity"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("joan_activity", {
      companyId: args.companyId,
      interviewId: args.interviewId,
      candidateId: args.candidateId,
      action: args.action,
      description: args.description,
      details: args.details,
      success: args.success,
      errorMessage: args.errorMessage,
      timestamp: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────
// INTELLIGENCE BRIEFS MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const createIntelligenceBrief = mutation({
  args: {
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
  },
  returns: v.id("intelligence_briefs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("intelligence_briefs", {
      candidateId: args.candidateId,
      companyId: args.companyId,
      synthesis: {
        summary: "",
        strengths: [],
        risks: [],
        customQuestions: [],
        confidenceScore: 0,
        recommendation: "review",
      },
      cotalRegistered: false,
      sources: [],
      pipelineDurationMs: 0,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateIntelligenceBrief = mutation({
  args: {
    briefId: v.id("intelligence_briefs"),
    webPresence: v.optional(v.object({
      linkedinSummary: v.optional(v.string()),
      githubSummary: v.optional(v.string()),
      personalSites: v.optional(v.array(v.string())),
      publications: v.optional(v.array(v.string())),
      credentialFlags: v.optional(v.array(v.string())),
      rawSkills: v.optional(v.array(v.string())),
      experience: v.optional(v.string()),
    })),
    memoryContext: v.optional(v.object({
      priorInteractions: v.optional(v.string()),
      similarCandidates: v.optional(v.string()),
      teamPreferences: v.optional(v.string()),
      relevantHistory: v.optional(v.string()),
      citedSources: v.optional(v.array(v.string())),
    })),
    synthesis: v.optional(v.object({
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
    })),
    cotalRegistered: v.optional(v.boolean()),
    cotalAgentId: v.optional(v.string()),
    sources: v.optional(v.array(v.string())),
    pipelineDurationMs: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed")
    )),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { briefId, ...updates } = args;
    const filtered: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[k] = val;
    }
    await ctx.db.patch(briefId, filtered);
  },
});

// ─────────────────────────────────────────────────────────────────
// AUTOPILOT QUEUE MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const createAutopilotItem = mutation({
  args: {
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    briefId: v.id("intelligence_briefs"),
    recommendation: v.union(
      v.literal("advance"),
      v.literal("review"),
      v.literal("reject")
    ),
    confidenceScore: v.number(),
    evidenceSummary: v.string(),
    draftEmailSubject: v.optional(v.string()),
    draftEmailBody: v.optional(v.string()),
  },
  returns: v.id("autopilot_queue"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("autopilot_queue", {
      candidateId: args.candidateId,
      companyId: args.companyId,
      briefId: args.briefId,
      recommendation: args.recommendation,
      confidenceScore: args.confidenceScore,
      evidenceSummary: args.evidenceSummary,
      draftEmailSubject: args.draftEmailSubject,
      draftEmailBody: args.draftEmailBody,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const resolveAutopilotItem = mutation({
  args: {
    itemId: v.id("autopilot_queue"),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("modified")
    ),
    decidedBy: v.string(),
    modifiedAction: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.itemId, {
      status: args.status,
      decidedBy: args.decidedBy,
      decidedAt: now,
      modifiedAction: args.modifiedAction,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.actions.executeAutopilotDecision.executeAutopilotDecision,
      { itemId: args.itemId }
    );
  },
});

// ─────────────────────────────────────────────────────────────────
// JOAN SETTINGS MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const upsertJoanSettings = mutation({
  args: {
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
    slackWebhookUrl: v.optional(v.string()),
  },
  returns: v.id("joan_settings"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("joan_settings")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .first();

    const fields = {
      autoRouting: args.autoRouting,
      autoActionItems: args.autoActionItems,
      autoStageMovement: args.autoStageMovement,
      reminderTiming: args.reminderTiming,
      notificationPreference: args.notificationPreference,
      advanceThreshold: args.advanceThreshold,
      rejectThreshold: args.rejectThreshold,
      companyName: args.companyName,
      slackWebhookUrl: args.slackWebhookUrl,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("joan_settings", {
      companyId: args.companyId,
      ...fields,
    });
  },
});

// ─────────────────────────────────────────────────────────────────
// SHARED BRIEFS MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const createSharedBrief = mutation({
  args: {
    briefId: v.id("intelligence_briefs"),
    candidateId: v.id("hiring_pipeline"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const brief = await ctx.db.get(args.briefId);
    if (!brief || brief.status !== "complete") {
      throw new Error("Intelligence brief not found or not complete");
    }

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found");

    const existing = await ctx.db
      .query("shared_briefs")
      .withIndex("by_brief", (q) => q.eq("briefId", args.briefId))
      .first();
    if (existing) return existing.token;

    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await ctx.db.insert("shared_briefs", {
      briefId: args.briefId,
      candidateId: args.candidateId,
      companyId: candidate.companyId,
      token,
      candidateName: candidate.candidateName,
      position: candidate.position,
      synthesis: brief.synthesis,
      webPresence: brief.webPresence
        ? {
            linkedinSummary: brief.webPresence.linkedinSummary,
            githubSummary: brief.webPresence.githubSummary,
            rawSkills: brief.webPresence.rawSkills,
            experience: brief.webPresence.experience,
          }
        : undefined,
      createdAt: Date.now(),
    });

    return token;
  },
});

// ─────────────────────────────────────────────────────────────────
// ASYNC INTERVIEW MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const createInterviewQuestion = mutation({
  args: {
    text: v.string(),
    audioUrl: v.optional(v.string()),
    position: v.number(),
    category: v.union(
      v.literal("behavioral"),
      v.literal("technical"),
      v.literal("culture-fit"),
      v.literal("situational"),
      v.literal("general")
    ),
    companyId: v.string(),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("interview_questions"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("interview_questions", {
      text: args.text,
      audioUrl: args.audioUrl,
      position: args.position,
      category: args.category,
      companyId: args.companyId,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateInterviewQuestion = mutation({
  args: {
    questionId: v.id("interview_questions"),
    text: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    position: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("behavioral"),
      v.literal("technical"),
      v.literal("culture-fit"),
      v.literal("situational"),
      v.literal("general")
    )),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.text !== undefined) updates.text = args.text;
    if (args.audioUrl !== undefined) updates.audioUrl = args.audioUrl;
    if (args.position !== undefined) updates.position = args.position;
    if (args.category !== undefined) updates.category = args.category;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.questionId, updates);
  },
});

export const deleteInterviewQuestion = mutation({
  args: {
    questionId: v.id("interview_questions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.questionId);
  },
});

export const createCandidateResponse = mutation({
  args: {
    interviewId: v.string(),
    questionId: v.id("interview_questions"),
    candidateId: v.string(),
    companyId: v.string(),
    videoUrl: v.optional(v.string()),
    transcriptText: v.optional(v.string()),
    authenticityScore: v.optional(v.number()),
    flagCount: v.optional(v.number()),
    analysisDetails: v.optional(v.any()),
    duration: v.optional(v.number()),
  },
  returns: v.id("candidate_responses"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("candidate_responses", {
      interviewId: args.interviewId,
      questionId: args.questionId,
      candidateId: args.candidateId,
      companyId: args.companyId,
      videoUrl: args.videoUrl,
      transcriptText: args.transcriptText,
      authenticityScore: args.authenticityScore,
      flagCount: args.flagCount,
      analysisDetails: args.analysisDetails,
      timestamp: now,
      duration: args.duration,
      createdAt: now,
    });
  },
});

export const updateCandidateResponse = mutation({
  args: {
    responseId: v.id("candidate_responses"),
    videoUrl: v.optional(v.string()),
    transcriptText: v.optional(v.string()),
    authenticityScore: v.optional(v.number()),
    flagCount: v.optional(v.number()),
    analysisDetails: v.optional(v.any()),
    duration: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {};

    if (args.videoUrl !== undefined) updates.videoUrl = args.videoUrl;
    if (args.transcriptText !== undefined) updates.transcriptText = args.transcriptText;
    if (args.authenticityScore !== undefined) updates.authenticityScore = args.authenticityScore;
    if (args.flagCount !== undefined) updates.flagCount = args.flagCount;
    if (args.analysisDetails !== undefined) updates.analysisDetails = args.analysisDetails;
    if (args.duration !== undefined) updates.duration = args.duration;

    await ctx.db.patch(args.responseId, updates);
  },
});

// ─────────────────────────────────────────────────────────────────
// EMAIL TEMPLATE MUTATIONS
// ─────────────────────────────────────────────────────────────────

export const saveEmailTemplate = mutation({
  args: {
    templateId: v.optional(v.id("email_templates")),
    companyId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("advance"),
      v.literal("reject"),
      v.literal("invitation"),
      v.literal("reminder"),
      v.literal("followup"),
      v.literal("custom")
    ),
    subject: v.string(),
    body: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  returns: v.id("email_templates"),
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.templateId) {
      await ctx.db.patch(args.templateId, {
        name: args.name,
        type: args.type,
        subject: args.subject,
        body: args.body,
        isDefault: args.isDefault ?? false,
        updatedAt: now,
      });
      return args.templateId;
    }

    return await ctx.db.insert("email_templates", {
      companyId: args.companyId,
      name: args.name,
      type: args.type,
      subject: args.subject,
      body: args.body,
      isDefault: args.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteEmailTemplate = mutation({
  args: { templateId: v.id("email_templates") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
  },
});

// ─────────────────────────────────────────────────────────────────
// RESUME TEXT UPDATE
// ─────────────────────────────────────────────────────────────────

export const updateCandidateResume = mutation({
  args: {
    candidateId: v.id("hiring_pipeline"),
    resumeText: v.string(),
    resumeUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, {
      resumeText: args.resumeText,
      resumeUrl: args.resumeUrl,
      updatedAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────
// STAGE RULES CRUD
// ─────────────────────────────────────────────────────────────────

export const saveStageRule = mutation({
  args: {
    ruleId: v.optional(v.id("stage_rules")),
    companyId: v.string(),
    name: v.string(),
    fromStage: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("final"),
      v.literal("offer"),
      v.literal("any")
    ),
    toStage: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("final"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected")
    ),
    conditions: v.object({
      minScore: v.optional(v.number()),
      allActionItemsComplete: v.optional(v.boolean()),
      briefComplete: v.optional(v.boolean()),
      minConfidence: v.optional(v.number()),
      recommendation: v.optional(v.union(
        v.literal("advance"),
        v.literal("review"),
        v.literal("reject")
      )),
    }),
    isActive: v.boolean(),
  },
  returns: v.id("stage_rules"),
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.ruleId) {
      await ctx.db.patch(args.ruleId, {
        name: args.name,
        fromStage: args.fromStage,
        toStage: args.toStage,
        conditions: args.conditions,
        isActive: args.isActive,
        updatedAt: now,
      });
      return args.ruleId;
    }

    return await ctx.db.insert("stage_rules", {
      companyId: args.companyId,
      name: args.name,
      fromStage: args.fromStage,
      toStage: args.toStage,
      conditions: args.conditions,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteStageRule = mutation({
  args: { ruleId: v.id("stage_rules") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.ruleId);
  },
});

export const toggleStageRule = mutation({
  args: { ruleId: v.id("stage_rules") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (rule) {
      await ctx.db.patch(args.ruleId, {
        isActive: !rule.isActive,
        updatedAt: Date.now(),
      });
    }
  },
});

// ─────────────────────────────────────────────────────────────────
// BULK PIPELINE OPERATIONS
// ─────────────────────────────────────────────────────────────────

export const bulkMoveCandidates = mutation({
  args: {
    candidateIds: v.array(v.id("hiring_pipeline")),
    toStage: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("final"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected")
    ),
  },
  returns: v.object({ moved: v.number() }),
  handler: async (ctx, args) => {
    let moved = 0;
    const now = Date.now();

    for (const id of args.candidateIds) {
      const candidate = await ctx.db.get(id);
      if (candidate && candidate.stage !== args.toStage) {
        await ctx.db.patch(id, {
          previousStage: candidate.stage,
          stage: args.toStage,
          stageChangedAt: now,
          stageChangedBy: "manual",
          updatedAt: now,
        });
        moved++;
      }
    }

    return { moved };
  },
});

// ─────────────────────────────────────────────────────────────────
// CANDIDATE NOTES
// ─────────────────────────────────────────────────────────────────

export const addTagToCandidate = mutation({
  args: {
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    tag: v.string(),
    color: v.string(),
    addedBy: v.string(),
  },
  returns: v.id("candidate_tags"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("candidate_tags")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect();
    if (existing.some((t) => t.tag === args.tag)) {
      throw new Error("Tag already exists on this candidate");
    }
    return await ctx.db.insert("candidate_tags", {
      candidateId: args.candidateId,
      companyId: args.companyId,
      tag: args.tag,
      color: args.color,
      addedBy: args.addedBy,
      createdAt: Date.now(),
    });
  },
});

export const removeTagFromCandidate = mutation({
  args: { tagId: v.id("candidate_tags") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.tagId);
    return null;
  },
});

export const submitInterviewFeedback = mutation({
  args: {
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    interviewerId: v.string(),
    interviewerName: v.string(),
    interviewType: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("behavioral"),
      v.literal("final"),
      v.literal("culture")
    ),
    recommendation: v.union(
      v.literal("strong_hire"),
      v.literal("hire"),
      v.literal("no_hire"),
      v.literal("strong_no_hire")
    ),
    scores: v.object({
      technical: v.optional(v.number()),
      communication: v.optional(v.number()),
      problemSolving: v.optional(v.number()),
      cultureFit: v.optional(v.number()),
      leadership: v.optional(v.number()),
    }),
    strengths: v.array(v.string()),
    concerns: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("interview_feedback"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("interview_feedback", {
      candidateId: args.candidateId,
      companyId: args.companyId,
      interviewerId: args.interviewerId,
      interviewerName: args.interviewerName,
      interviewType: args.interviewType,
      recommendation: args.recommendation,
      scores: args.scores,
      strengths: args.strengths,
      concerns: args.concerns,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addCandidateNote = mutation({
  args: {
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    authorName: v.string(),
    content: v.string(),
    type: v.union(v.literal("note"), v.literal("flag"), v.literal("question"), v.literal("decision")),
  },
  returns: v.id("candidate_notes"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("candidate_notes", {
      candidateId: args.candidateId,
      companyId: args.companyId,
      authorName: args.authorName,
      content: args.content,
      type: args.type,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const togglePinNote = mutation({
  args: { noteId: v.id("candidate_notes") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) return false;
    await ctx.db.patch(args.noteId, { isPinned: !note.isPinned, updatedAt: Date.now() });
    return !note.isPinned;
  },
});

export const deleteCandidateNote = mutation({
  args: { noteId: v.id("candidate_notes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
    return null;
  },
});


