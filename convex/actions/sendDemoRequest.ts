"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const sendDemoRequest = action({
  args: {
    name: v.string(),
    company: v.string(),
    role: v.string(),
    volume: v.string(),
    message: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (_ctx, args) => {
    const postmarkKey = process.env.POSTMARK_API_KEY;
    if (!postmarkKey) throw new Error("POSTMARK_API_KEY not configured");

    const safeName = args.name.replace(/[\r\n]/g, " ").trim();
    const safeCompany = args.company.replace(/[\r\n]/g, " ").trim();

    const htmlBody = `
      <h2>New TrueVoice HQ Demo Request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:480px">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Name</td><td style="padding:8px 0;font-weight:600">${escapeHtml(args.name)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Company</td><td style="padding:8px 0;font-weight:600">${escapeHtml(args.company)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Role</td><td style="padding:8px 0;font-weight:600">${escapeHtml(args.role)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Interviews/month</td><td style="padding:8px 0;font-weight:600">${escapeHtml(args.volume)}</td></tr>
        ${args.message ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Message</td><td style="padding:8px 0">${escapeHtml(args.message)}</td></tr>` : ""}
      </table>
    `;

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify({
        From: "hello@truevoicehq.com",
        To: "patrick@boxfordpartners.com",
        Subject: `Demo request - ${safeName} at ${safeCompany}`,
        HtmlBody: htmlBody,
        TextBody: `Demo request\n\nName: ${safeName}\nCompany: ${safeCompany}\nRole: ${args.role}\nInterviews/month: ${args.volume}${args.message ? `\nMessage: ${args.message}` : ""}`,
        MessageStream: "outbound",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Failed to send email: ${err.Message || res.status}`);
    }

    return { success: true };
  },
});
