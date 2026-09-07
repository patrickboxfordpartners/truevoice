"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { sendEmail } from "../lib/emailService";

/**
 * Joan's Deadline Reminder System
 *
 * Scans for action items due within 48 hours that haven't received a reminder yet.
 * Sends email reminders via configured email provider (Postmark, Resend, SendGrid, Mailgun).
 *
 * Called by cron job every hour.
 */

export const sendDeadlineReminders = internalAction({
  args: {},
  returns: v.object({
    success: v.boolean(),
    remindersSent: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx) => {
    try {
      // Email service configured via EMAIL_PROVIDER env var (postmark, resend, sendgrid, mailgun)
      const emailProvider = process.env.EMAIL_PROVIDER || "postmark";
      console.log(`Using email provider: ${emailProvider}`);

      // Calculate time window: now to 48 hours from now
      const now = Date.now();
      const fortyEightHoursFromNow = now + 48 * 60 * 60 * 1000;

      // Get action items due within the next 48 hours
      const actionItemsDueSoon = await ctx.runQuery(internal.queries.getActionItemsDueSoon, {
        startTime: now,
        endTime: fortyEightHoursFromNow,
      });

      // Filter items that:
      // 1. Haven't sent a reminder yet
      // 2. Are not completed or cancelled
      const itemsNeedingReminders = actionItemsDueSoon.filter((item: any) => {
        return (
          !item.reminderSent &&
          item.status !== "completed" &&
          item.status !== "cancelled"
        );
      });

      console.log(`Found ${itemsNeedingReminders.length} action items needing reminders`);

      let remindersSent = 0;
      let errors = 0;

      // Send reminders for each item
      for (const item of itemsNeedingReminders) {
        try {
          // Get candidate details for email
          const candidate = await ctx.runQuery(api.queries.getCandidateByInterview, {
            interviewId: item.interviewId,
          });

          if (!candidate) {
            console.warn(`Candidate not found for action item ${item._id}`);
            errors++;
            continue;
          }

          // Calculate hours until due
          const hoursUntilDue = Math.round((item.dueDate - now) / (1000 * 60 * 60));

          // Send reminder email via configured provider
          const emailResult = await sendEmail({
            to: candidate.candidateEmail,
            subject: `Reminder: ${item.title} - Due in ${hoursUntilDue} hours`,
            body: generateReminderEmail(item, candidate, hoursUntilDue),
          });

          if (!emailResult.success) {
            throw new Error(emailResult.error || "Failed to send email");
          }

          console.log(`Sent reminder email to ${candidate.candidateEmail} (Message ID: ${emailResult.messageId})`);

          // Mark reminder as sent
          await ctx.runMutation(api.mutations.markReminderSent, {
            actionItemId: item._id,
          });

          // Log Joan's activity
          await ctx.runMutation(api.mutations.logJoanActivity, {
            companyId: item.companyId,
            interviewId: item.interviewId,
            candidateId: item.candidateId,
            action: "sent_reminder",
            description: `Joan sent deadline reminder for "${item.title}" to ${candidate.candidateName}`,
            details: {
              actionItemId: item._id,
              actionItemTitle: item.title,
              dueDate: item.dueDate,
              hoursUntilDue,
              recipientEmail: candidate.candidateEmail,
            },
            success: true,
          });

          remindersSent++;
          console.log(`Sent reminder for action item: ${item.title} (${item._id})`);
        } catch (error) {
          errors++;
          console.error(`Failed to send reminder for action item ${item._id}:`, error);

          // Log failure
          await ctx.runMutation(api.mutations.logJoanActivity, {
            companyId: item.companyId,
            interviewId: item.interviewId,
            candidateId: item.candidateId,
            action: "sent_reminder",
            description: `Joan failed to send reminder: ${error instanceof Error ? error.message : "Unknown error"}`,
            details: {
              actionItemId: item._id,
              actionItemTitle: item.title,
            },
            success: false,
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        }
      }

      console.log(`Deadline reminders complete: ${remindersSent} sent, ${errors} errors`);

      return {
        success: true,
        remindersSent,
        errors,
      };
    } catch (error) {
      console.error("Critical error in sendDeadlineReminders:", error);
      return {
        success: false,
        remindersSent: 0,
        errors: 1,
      };
    }
  },
});

/**
 * Generate professional reminder email body
 */
function generateReminderEmail(
  item: any,
  candidate: any,
  hoursUntilDue: number
): string {
  const urgencyText = hoursUntilDue <= 24 ? "⚠️ URGENT: " : "";

  return `
${urgencyText}Action Item Reminder

Hi ${candidate.candidateName},

This is a friendly reminder from Joan, your AI hiring coordinator.

You have an upcoming action item that requires your attention:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ${item.title}
⏰ Due: ${formatDueDate(item.dueDate)}
⏳ Time remaining: ${hoursUntilDue} hours
${item.priority === "urgent" || item.priority === "high" ? "🔴 Priority: " + item.priority.toUpperCase() : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${item.description ? `Details:\n${item.description}\n\n` : ""}
Position: ${candidate.position}
Interview: ${item.interviewId}

If you have any questions or need assistance, please don't hesitate to reach out.

Best regards,
Joan
AI Hiring Coordinator | TrueVoice HQ

---
This is an automated reminder from Joan AI. To update your preferences or mark this item as complete, visit your TrueVoice dashboard.
`.trim();
}

/**
 * Format Unix timestamp to human-readable date
 */
function formatDueDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
