"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { sendEmail } from "../lib/emailService";
import { getStageTransitionEmail } from "../lib/emailTemplates";

/**
 * Send automated status update emails to candidates
 *
 * Triggered when a candidate moves between pipeline stages
 */

export const sendStageChangeEmail = action({
  args: {
    candidateId: v.id("hiring_pipeline"),
    candidateName: v.string(),
    candidateEmail: v.string(),
    position: v.string(),
    fromStage: v.string(),
    toStage: v.string(),
    companyId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    sent: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Look up company name from settings
      const settings = await ctx.runQuery(api.queries.getJoanSettings, {
        companyId: args.companyId,
      });
      const companyName = settings?.companyName || "our company";

      // Get email template for this stage transition
      const template = getStageTransitionEmail(
        args.candidateName,
        args.position,
        args.fromStage,
        args.toStage,
        companyName
      );

      // No email for this transition (e.g., screening → screening, or hired)
      if (!template) {
        console.log(`No email template for ${args.fromStage} → ${args.toStage}`);
        return { success: true, sent: false };
      }

      // Send email via configured provider (Resend)
      const emailResult = await sendEmail({
        to: args.candidateEmail,
        subject: template.subject,
        body: template.body,
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || "Failed to send email");
      }

      console.log(
        `Sent ${args.toStage} email to ${args.candidateName} (${args.candidateEmail})`
      );

      // Log Joan activity
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: args.companyId,
        candidateId: args.candidateId,
        action: "sent_status_email",
        description: `Joan sent ${args.toStage} stage email to ${args.candidateName}`,
        details: {
          fromStage: args.fromStage,
          toStage: args.toStage,
          emailSubject: template.subject,
          messageId: emailResult.messageId,
        },
        success: true,
      });

      return {
        success: true,
        sent: true,
      };
    } catch (error) {
      console.error("Failed to send stage change email:", error);

      // Log failure
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: args.companyId,
        candidateId: args.candidateId,
        action: "sent_status_email",
        description: `Joan failed to send ${args.toStage} email: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: {
          fromStage: args.fromStage,
          toStage: args.toStage,
        },
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        sent: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
