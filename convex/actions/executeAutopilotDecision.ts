"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { api } from "../_generated/api";
import { sendEmail } from "../lib/emailService";

/**
 * Executes the downstream effects of an approved/rejected autopilot decision.
 *
 * Approved "advance" -> move candidate to next stage + send intelligence-informed email
 * Approved "reject"  -> move candidate to rejected + send intelligence-informed email
 * Rejected decision  -> no action (human overrode Joan)
 * Modified decision   -> log the modification, no automated action
 */

const STAGE_PROGRESSION: Record<string, string> = {
  screening: "technical",
  technical: "final",
  final: "offer",
  offer: "hired",
};

export const executeAutopilotDecision = internalAction({
  args: {
    itemId: v.id("autopilot_queue"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.runQuery(api.queries.getAutopilotItem, {
      itemId: args.itemId,
    });
    if (!item) {
      console.warn("[autopilot-exec] Item not found:", args.itemId);
      return null;
    }

    if (item.status === "rejected" || item.status === "modified") {
      console.log(`[autopilot-exec] Decision was ${item.status}, no automated action`);
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: item.companyId,
        candidateId: item.candidateId,
        action: "moved_pipeline_stage",
        description: `Human ${item.status} Joan's ${item.recommendation} recommendation for candidate (no automated action taken)`,
        details: {
          decision: item.status,
          recommendation: item.recommendation,
          decidedBy: item.decidedBy,
          modifiedAction: item.modifiedAction,
        },
        success: true,
      });
      return null;
    }

    if (item.status !== "approved") {
      return null;
    }

    const candidate = await ctx.runQuery(api.queries.getCandidateById, {
      candidateId: item.candidateId,
    });
    if (!candidate) {
      console.warn("[autopilot-exec] Candidate not found:", item.candidateId);
      return null;
    }

    if (item.recommendation === "advance") {
      const nextStage = STAGE_PROGRESSION[candidate.stage];
      if (!nextStage) {
        console.log(`[autopilot-exec] No next stage from ${candidate.stage}, skipping move`);
        return null;
      }

      await ctx.runMutation(api.mutations.moveCandidateStage, {
        candidateId: item.candidateId,
        newStage: nextStage as any,
        movedBy: "joan",
        skipEmail: !!item.draftEmailSubject,
      });

      if (item.draftEmailSubject && item.draftEmailBody) {
        const emailResult = await sendEmail({
          to: candidate.candidateEmail,
          subject: item.draftEmailSubject,
          body: item.draftEmailBody,
        });

        await ctx.runMutation(api.mutations.logJoanActivity, {
          companyId: item.companyId,
          candidateId: item.candidateId,
          action: "sent_status_email",
          description: `Joan sent intelligence-informed advance email to ${candidate.candidateName}`,
          details: {
            emailSubject: item.draftEmailSubject,
            messageId: emailResult.messageId,
            success: emailResult.success,
          },
          success: emailResult.success,
          errorMessage: emailResult.error,
        });
      }

      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: item.companyId,
        candidateId: item.candidateId,
        action: "moved_pipeline_stage",
        description: `Joan advanced ${candidate.candidateName} from ${candidate.stage} to ${nextStage} (approved by ${item.decidedBy})`,
        details: {
          fromStage: candidate.stage,
          toStage: nextStage,
          approvedBy: item.decidedBy,
          confidenceScore: item.confidenceScore,
          usedIntelligentEmail: !!item.draftEmailSubject,
        },
        success: true,
      });

      console.log(`[autopilot-exec] Advanced ${candidate.candidateName}: ${candidate.stage} -> ${nextStage}`);
    } else if (item.recommendation === "reject") {
      if (candidate.stage !== "rejected") {
        await ctx.runMutation(api.mutations.moveCandidateStage, {
          candidateId: item.candidateId,
          newStage: "rejected",
          movedBy: "joan",
          skipEmail: !!item.draftEmailSubject,
        });
      }

      if (item.draftEmailSubject && item.draftEmailBody) {
        const emailResult = await sendEmail({
          to: candidate.candidateEmail,
          subject: item.draftEmailSubject,
          body: item.draftEmailBody,
        });

        await ctx.runMutation(api.mutations.logJoanActivity, {
          companyId: item.companyId,
          candidateId: item.candidateId,
          action: "sent_status_email",
          description: `Joan sent intelligence-informed rejection email to ${candidate.candidateName}`,
          details: {
            emailSubject: item.draftEmailSubject,
            messageId: emailResult.messageId,
            success: emailResult.success,
          },
          success: emailResult.success,
          errorMessage: emailResult.error,
        });
      }

      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: item.companyId,
        candidateId: item.candidateId,
        action: "moved_pipeline_stage",
        description: `Joan rejected ${candidate.candidateName} (approved by ${item.decidedBy})`,
        details: {
          fromStage: candidate.stage,
          toStage: "rejected",
          approvedBy: item.decidedBy,
          confidenceScore: item.confidenceScore,
          usedIntelligentEmail: !!item.draftEmailSubject,
        },
        success: true,
      });

      console.log(`[autopilot-exec] Rejected ${candidate.candidateName}`);
    }

    return null;
  },
});
