"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";

/**
 * Joan Autopilot -- cron-driven candidate screening
 *
 * Reads completed intelligence briefs, applies threshold logic,
 * and queues recommendations into the autopilot_queue for human approval.
 *
 * Threshold zones (configurable per company via joan_settings):
 *   advance: confidenceScore >= 70
 *   reject:  confidenceScore < 40
 *   review:  40 <= confidenceScore < 70 (gray zone → human review)
 */

const DEFAULT_ADVANCE_THRESHOLD = 70;
const DEFAULT_REJECT_THRESHOLD = 40;

export const runAutopilotSweep = internalAction({
  args: {},
  returns: v.object({
    processed: v.number(),
    queued: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const briefs = await ctx.runQuery(api.queries.getCompletedBriefsWithoutAutopilot);

    let processed = 0;
    let queued = 0;
    let skipped = 0;

    for (const brief of briefs) {
      const settings = await ctx.runQuery(api.queries.getJoanSettings, {
        companyId: brief.companyId,
      });

      if (!settings?.autoStageMovement) {
        skipped++;
        continue;
      }

      processed++;

      const advanceThreshold = settings.advanceThreshold ?? DEFAULT_ADVANCE_THRESHOLD;
      const rejectThreshold = settings.rejectThreshold ?? DEFAULT_REJECT_THRESHOLD;
      const companyName = settings.companyName || "our company";

      const score = brief.synthesis?.confidenceScore ?? 0;
      const recommendation = classifyRecommendation(score, advanceThreshold, rejectThreshold);

      const candidate = await ctx.runQuery(api.queries.getCandidateById, {
        candidateId: brief.candidateId,
      });
      if (!candidate) {
        skipped++;
        continue;
      }

      const evidenceSummary = buildEvidenceSummary(brief, candidate);

      const draftEmail = recommendation !== "review"
        ? buildIntelligentDraftEmail(candidate, recommendation, brief, companyName)
        : undefined;

      await ctx.runMutation(api.mutations.createAutopilotItem, {
        candidateId: brief.candidateId,
        companyId: brief.companyId,
        briefId: brief._id,
        recommendation,
        confidenceScore: score,
        evidenceSummary,
        draftEmailSubject: draftEmail?.subject,
        draftEmailBody: draftEmail?.body,
      });

      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: brief.companyId,
        candidateId: brief.candidateId,
        action: "flagged_risk",
        description: `Joan autopilot queued ${candidate.candidateName}: ${recommendation} (${score}/100)`,
        details: {
          recommendation,
          confidenceScore: score,
          briefId: brief._id,
          hasDraftEmail: !!draftEmail,
          thresholds: { advance: advanceThreshold, reject: rejectThreshold },
        },
        success: true,
      });

      queued++;
    }

    console.log(
      `[autopilot] Sweep complete: ${processed} processed, ${queued} queued, ${skipped} skipped`
    );

    return { processed, queued, skipped };
  },
});

function classifyRecommendation(
  score: number,
  advanceThreshold = DEFAULT_ADVANCE_THRESHOLD,
  rejectThreshold = DEFAULT_REJECT_THRESHOLD
): "advance" | "review" | "reject" {
  if (score >= advanceThreshold) return "advance";
  if (score < rejectThreshold) return "reject";
  return "review";
}

function buildEvidenceSummary(
  brief: any,
  candidate: any
): string {
  const parts: string[] = [];

  parts.push(`Candidate: ${candidate.candidateName} for ${candidate.position}`);

  if (brief.synthesis?.summary) {
    parts.push(brief.synthesis.summary.slice(0, 500));
  }

  if (brief.synthesis?.strengths?.length) {
    parts.push(`Strengths: ${brief.synthesis.strengths.slice(0, 3).join("; ")}`);
  }

  if (brief.synthesis?.risks?.length) {
    parts.push(`Risks: ${brief.synthesis.risks.slice(0, 3).join("; ")}`);
  }

  if (brief.sources?.length) {
    parts.push(`Sources: ${brief.sources.join(", ")}`);
  }

  if (brief.pipelineDurationMs) {
    parts.push(`Analysis completed in ${(brief.pipelineDurationMs / 1000).toFixed(1)}s`);
  }

  return parts.join("\n\n");
}

function buildIntelligentDraftEmail(
  candidate: any,
  recommendation: "advance" | "reject",
  brief: any,
  companyName: string
): { subject: string; body: string } {
  const firstName = candidate.candidateName.split(" ")[0];
  const synthesis = brief.synthesis;

  if (recommendation === "advance") {
    const strengthMention = synthesis?.strengths?.[0]
      ? `\nWe were particularly impressed by ${synthesis.strengths[0].toLowerCase()}.`
      : "";

    const nextStepQuestion = synthesis?.customQuestions?.[0]
      ? `\nIn the next conversation, we'd love to explore: ${synthesis.customQuestions[0].question}`
      : "";

    return {
      subject: `Next steps for your ${candidate.position} application`,
      body: [
        `Hi ${firstName},`,
        "",
        `Thank you for your interest in the ${candidate.position} role at ${companyName}. After reviewing your profile and interview, we'd like to move forward with the next step.${strengthMention}`,
        nextStepQuestion,
        "",
        "We'll be in touch shortly with scheduling details.",
        "",
        "Best regards,",
        `Joan (AI Hiring Coordinator)`,
        companyName,
        "",
        "---",
        "This is an automated message from Joan AI. Reply to this email to reach our hiring team.",
      ]
        .filter((line) => line !== undefined)
        .join("\n"),
    };
  }

  const feedbackLine = synthesis?.risks?.[0]
    ? `While we appreciated your background, we're looking for candidates with a stronger fit in areas like ${synthesis.risks[0].toLowerCase().replace(/^(no evidence of |limited |lack of )/i, "")}.`
    : "After careful review, we've decided to move forward with other candidates whose experience more closely aligns with our current needs.";

  return {
    subject: `Update on your ${candidate.position} application`,
    body: [
      `Hi ${firstName},`,
      "",
      `Thank you for your interest in the ${candidate.position} role at ${companyName} and for taking the time to speak with us.`,
      "",
      feedbackLine,
      "",
      "We encourage you to apply for future openings that may be a better match.",
      "",
      "Best regards,",
      `Joan (AI Hiring Coordinator)`,
      companyName,
      "",
      "---",
      "This is an automated message from Joan AI. Reply to this email to reach our hiring team.",
    ].join("\n"),
  };
}

/**
 * Manual trigger for a single candidate -- used from the approval UI
 * when a human wants to re-run the autopilot assessment.
 */
export const reassessCandidate = action({
  args: {
    candidateId: v.id("hiring_pipeline"),
  },
  returns: v.object({
    success: v.boolean(),
    recommendation: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const existingItem = await ctx.runQuery(api.queries.getAutopilotItemByCandidate, {
      candidateId: args.candidateId,
    });
    if (existingItem && existingItem.status === "pending") {
      return { success: false, error: "Pending autopilot item already exists" };
    }

    const brief = await ctx.runQuery(api.queries.getBriefByCandidate, {
      candidateId: args.candidateId,
    });

    if (!brief || brief.status !== "complete") {
      return {
        success: false,
        error: brief ? `Brief status: ${brief.status}` : "No intelligence brief found",
      };
    }

    const candidate = await ctx.runQuery(api.queries.getCandidateById, {
      candidateId: args.candidateId,
    });
    if (!candidate) return { success: false, error: "Candidate not found" };

    const settings = await ctx.runQuery(api.queries.getJoanSettings, {
      companyId: candidate.companyId,
    });
    const advanceThreshold = settings?.advanceThreshold ?? DEFAULT_ADVANCE_THRESHOLD;
    const rejectThreshold = settings?.rejectThreshold ?? DEFAULT_REJECT_THRESHOLD;
    const companyName = settings?.companyName || "our company";

    const score = brief.synthesis?.confidenceScore ?? 0;
    const recommendation = classifyRecommendation(score, advanceThreshold, rejectThreshold);
    const evidenceSummary = buildEvidenceSummary(brief, candidate);

    const draftEmail = recommendation !== "review"
      ? buildIntelligentDraftEmail(candidate, recommendation, brief, companyName)
      : undefined;

    await ctx.runMutation(api.mutations.createAutopilotItem, {
      candidateId: args.candidateId,
      companyId: candidate.companyId,
      briefId: brief._id,
      recommendation,
      confidenceScore: score,
      evidenceSummary,
      draftEmailSubject: draftEmail?.subject,
      draftEmailBody: draftEmail?.body,
    });

    return { success: true, recommendation };
  },
});
