"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const INVITATION_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#f0fdf4;padding:28px 32px;border-bottom:1px solid #e5e7eb">
      <p style="margin:0;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em">Interview Invitation</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#111827">{{company_name}}</h1>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151">Hi {{candidate_name}},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        <strong>{{company_name}}</strong> has invited you to interview for the
        <strong>{{position}}</strong> role. We're looking forward to the conversation.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="{{interview_link}}" style="display:inline-block;background:#111827;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none">
          Join your interview &rarr;
        </a>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#111827">What to expect</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#4b5563;line-height:1.7">
          <li>Runs in your browser, no app to download</li>
          <li>Takes roughly 30 to 45 minutes</li>
          <li>Your interviewer will be {{interviewer_name}}</li>
        </ul>
      </div>
      <p style="margin:0;font-size:14px;color:#374151">
        If you have any questions, reply to this email and we'll get back to you.
      </p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
        Powered by TrueVoice HQ &middot; A Boxford Partners Company
      </p>
    </div>
  </div>
</body>
</html>`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function substitute(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{{${k}}}`, escapeHtml(v)),
    template
  );
}

export const sendInterviewEmail = action({
  args: {
    interviewId: v.string(),
    templateType: v.optional(v.string()),
    customSubject: v.optional(v.string()),
    customBody: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), message: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const postmarkKey = process.env.POSTMARK_API_KEY;
    if (!postmarkKey) throw new Error("POSTMARK_API_KEY not configured");

    const interview = await ctx.runQuery(
      (await import("../_generated/api")).api.interviews.getById,
      { interviewId: args.interviewId }
    );
    if (!interview) throw new Error("Interview not found");
    if (!interview.candidateEmail) throw new Error("Interview has no candidate email");

    const viewer = await ctx.runQuery(
      (await import("../_generated/api")).api.users.viewer,
      {}
    );

    const companyName = viewer?.company?.name || "Our Company";
    const siteUrl = process.env.SITE_URL || "https://truevoicehq.com";
    const interviewLink = `${siteUrl}/interview/${interview.candidateToken}`;

    const vars: Record<string, string> = {
      company_name: companyName,
      candidate_name: interview.candidateName || "there",
      position: interview.position || "the role",
      interview_link: interviewLink,
      interviewer_name: viewer?.full_name || "your interviewer",
    };

    let subject: string;
    let htmlBody: string;

    if (!args.templateType || args.templateType === "invitation") {
      subject = `You're invited to interview with ${companyName} - ${interview.position}`;
      htmlBody = substitute(INVITATION_HTML, vars);
    } else {
      subject = args.customSubject || "";
      htmlBody = args.customBody || "";
    }

    if (!subject || !htmlBody) throw new Error("No email content resolved");

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify({
        From: `${companyName} <hello@truevoicehq.com>`,
        To: interview.candidateEmail,
        Subject: subject,
        HtmlBody: htmlBody,
        ReplyTo: viewer?.email || undefined,
        MessageStream: "outbound",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Email send failed: ${err.Message || res.status}`);
    }

    return { success: true, message: `Email sent to ${interview.candidateEmail}` };
  },
});
