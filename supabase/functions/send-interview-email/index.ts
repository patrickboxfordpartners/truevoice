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
    const interviewLink = `${req.headers.get("origin") || "https://authentiview.com"}/interview/${interview.candidate_token}`;
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

    // For MVP, log the email. Production would use a service like Resend/SendGrid/Mailgun.
    console.log("Email to send:", {
      to: interview.candidate_email,
      subject,
      body,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email prepared for ${interview.candidate_email}`,
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
