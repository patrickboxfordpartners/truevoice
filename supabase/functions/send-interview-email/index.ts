import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { interview_id, template_type, custom_subject, custom_body } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch interview + company + creator profile
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

    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", interview.created_by)
      .single();

    // Fetch template if not custom
    let subject = custom_subject || "";
    let body = custom_body || "";

    if (!subject && !body && template_type) {
      const { data: template } = await supabase
        .from("email_templates")
        .select("subject, body")
        .eq("company_id", interview.company_id)
        .eq("template_type", template_type)
        .single();

      if (template) {
        subject = template.subject;
        body = template.body;
      }
    }

    // Variable substitution
    const siteUrl = Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://true-voice-insights.vercel.app";
    const interviewLink = `${siteUrl}/interview/${interview.candidate_token}`;
    const scheduledDate = interview.scheduled_at
      ? new Date(interview.scheduled_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "TBD";

    const variables: Record<string, string> = {
      candidate_name: interview.candidate_name,
      position: interview.position,
      company_name: interview.companies?.name || "Our Company",
      interview_link: interviewLink,
      interview_date: scheduledDate,
      duration: "45",
      sender_name: creator?.full_name || "The Team",
      response_days: "5",
    };

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      console.log("[send-email] RESEND_API_KEY not set, returning preview only");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email service not configured (RESEND_API_KEY missing)",
          preview: { to: interview.candidate_email, subject, body },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Resend
    const fromEmail = Deno.env.get("EMAIL_FROM") || "noreply@true-voice-insights.com";
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [interview.candidate_email],
        subject,
        html: body,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[send-email] Resend error:", emailResponse.status, JSON.stringify(emailResult));
      return new Response(
        JSON.stringify({
          success: false,
          error: `Email send failed: ${emailResult.message || emailResponse.status}`,
          preview: { to: interview.candidate_email, subject, body },
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-email] Sent to:", interview.candidate_email, "Resend ID:", emailResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email sent to ${interview.candidate_email}`,
        emailId: emailResult.id,
        preview: { to: interview.candidate_email, subject, body },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
