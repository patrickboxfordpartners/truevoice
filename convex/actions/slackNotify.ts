"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { api } from "../_generated/api";

export const sendSlackNotification = internalAction({
  args: {
    companyId: v.string(),
    text: v.string(),
    candidateName: v.optional(v.string()),
    action: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.queries.getJoanSettings, {
      companyId: args.companyId,
    });

    const webhookUrl = settings?.slackWebhookUrl;
    if (!webhookUrl) {
      return { success: false, error: "No Slack webhook URL configured" };
    }

    const actionEmoji: Record<string, string> = {
      extracted_action_items: ":clipboard:",
      routed_email: ":email:",
      moved_pipeline_stage: ":arrow_right:",
      sent_reminder: ":bell:",
      sent_status_email: ":mailbox_with_mail:",
      enriched_candidate: ":mag:",
      flagged_risk: ":warning:",
    };

    const emoji = args.action ? (actionEmoji[args.action] || ":robot_face:") : ":robot_face:";

    const payload = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${emoji} *Joan AI* ${args.candidateName ? `| ${args.candidateName}` : ""}\n${args.text}`,
          },
        },
      ],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return { success: false, error: `Slack returned ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
