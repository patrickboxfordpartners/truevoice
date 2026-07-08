// supabase/functions/send-interview-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
          Join your interview →
        </a>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#111827">What to expect</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#4b5563;line-height:1.7">
          <li>Runs in your browser — no app to download</li>
          <li>Takes roughly 30–45 minutes</li>
          <li>Your interviewer will be {{interviewer_name}}</li>
        </ul>
      </div>
      <p style="margin:0 0 20px;font-size:13px;color:#6b7280;border-left:3px solid #e5e7eb;padding-left:12px">
        <em>{{company_name}} uses TrueVoice HQ, an AI-assisted interview platform that analyzes communication patterns during the conversation. The same process applies to every candidate.</em>
      </p>
      <p style="margin:0;font-size:14px;color:#374151">
        If you have any questions, reply to this email and we'll get back to you.
      </p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
        Powered by <a href="https://truevoicehq.com" style="color:#6b7280;text-decoration:none">TrueVoice HQ</a>
        · A Boxford Partners Company
      </p>
    </div>
  </div>
</body>
</html>`;

const INVITATION_SUBJECT = "You're invited to interview with {{company_name}} — {{position}}";

function substitute(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{{${k}}}`, v),
    template
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { interview_id, template_type, custom_subject, custom_body } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch interview + company
    const { data: interview, error: intError } = await supabase
      .from("interviews")
      .select("*, companies(name)")
      .eq("id", interview_id)
      .single();

    if (intError || !interview) {
      return new Response(JSON.stringify({ error: "Interview not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch interviewer profile for Reply-To and name
    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", interview.created_by)
      .single();

    const companyName = (interview as any).companies?.name || "Our Company";
    const siteUrl = Deno.env.get("SITE_URL") || "https://truevoicehq.com";
    const interviewLink = `${siteUrl}/interview/${interview.candidate_token}`;

    const vars: Record<string, string> = {
      company_name: companyName,
      candidate_name: interview.candidate_name || "there",
      position: interview.position || "the role",
      interview_link: interviewLink,
      interviewer_name: creator?.full_name || "your interviewer",
    };

    let subject: string;
    let htmlBody: string;

    if (template_type === "invitation") {
      // Hardcoded invitation template — no DB lookup needed
      subject = substitute(INVITATION_SUBJECT, vars);
      htmlBody = substitute(INVITATION_HTML, vars);
    } else {
      // Other template types: look up from DB or use custom
      subject = custom_subject || "";
      htmlBody = custom_body || "";

      if (!subject && !htmlBody && template_type) {
        const { data: template } = await supabase
          .from("email_templates")
          .select("subject, body")
          .eq("company_id", interview.company_id)
          .eq("template_type", template_type)
          .single();

        if (template) {
          subject = substitute(template.subject, vars);
          htmlBody = substitute(template.body, vars);
        }
      }
    }

    if (!subject || !htmlBody) {
      return new Response(JSON.stringify({ error: "No email content resolved" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const postmarkKey = Deno.env.get("POSTMARK_API_KEY");
    if (!postmarkKey) {
      console.error("[send-interview-email] POSTMARK_API_KEY not set");
      return new Response(JSON.stringify({ success: false, error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromAddress = `${companyName} <hello@truevoicehq.com>`;
    const payload: Record<string, unknown> = {
      From: fromAddress,
      To: interview.candidate_email,
      Subject: subject,
      HtmlBody: htmlBody,
      MessageStream: "outbound",
    };

    if (creator?.email) {
      payload.ReplyTo = creator.email;
    }

    const emailResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify(payload),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[send-interview-email] Postmark error:", emailResponse.status, JSON.stringify(emailResult));
      return new Response(
        JSON.stringify({ success: false, error: `Email send failed: ${emailResult.Message || emailResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-interview-email] Sent to:", interview.candidate_email, "MessageID:", emailResult.MessageID);

    return new Response(
      JSON.stringify({ success: true, message: `Email sent to ${interview.candidate_email}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-interview-email] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
