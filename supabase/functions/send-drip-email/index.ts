import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM = "TrueVoice HQ <hello@truevoicehq.com>";

interface DripEmail {
  to: string;
  name: string;
  plan: string;
  sequence: "welcome" | "day3" | "day7";
}

function getEmailContent(data: DripEmail): { subject: string; html: string } {
  const firstName = data.name?.split(" ")[0] || "there";

  if (data.sequence === "welcome") {
    return {
      subject: "Welcome to TrueVoice HQ — here's how to run your first interview",
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">TRUE</span><span style="font-size: 18px; font-weight: 400; color: #555;">voice</span><span style="font-size: 18px; font-weight: 500; color: #059669;">HQ</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px;">Welcome, ${firstName}.</h1>
          <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">Your ${data.plan} plan is active. Here's how to run your first interview in the next 10 minutes:</p>
          <ol style="color: #333; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
            <li>Go to your <strong>Dashboard</strong> and click <strong>New Interview</strong></li>
            <li>Enter the position title and candidate name</li>
            <li>Copy the candidate link and send it to your candidate</li>
            <li>Open the <strong>Interviewer Room</strong> when they join — you'll see live AI scores in real time</li>
            <li>After the session, review the full authenticity report</li>
          </ol>
          <a href="https://truevoicehq.com/dashboard" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Go to Dashboard →</a>
          <p style="color: #999; font-size: 12px; margin-top: 40px; line-height: 1.6;">You're receiving this because you signed up for TrueVoice HQ. <a href="https://truevoicehq.com" style="color: #999;">truevoicehq.com</a></p>
        </div>
      `,
    };
  }

  if (data.sequence === "day3") {
    return {
      subject: "Have you run your first interview yet?",
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">TRUE</span><span style="font-size: 18px; font-weight: 400; color: #555;">voice</span><span style="font-size: 18px; font-weight: 500; color: #059669;">HQ</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px;">Quick check-in, ${firstName}</h1>
          <p style="color: #555; line-height: 1.6; margin: 0 0 16px;">It's been a couple days — have you had a chance to run your first interview?</p>
          <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">If you've hit a snag or have questions, just reply to this email. Otherwise, here's a reminder of what you get with the live analysis:</p>
          <ul style="color: #333; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
            <li><strong>Speech pattern scoring</strong> — hesitation, filler words, confidence markers</li>
            <li><strong>Response timing</strong> — unusually fast answers can flag rehearsed responses</li>
            <li><strong>Linguistic authenticity</strong> — detects overly formal or copy-pasted language</li>
            ${data.plan !== "starter" ? "<li><strong>Webcam monitoring</strong> — gaze, attention, and device detection</li>" : ""}
          </ul>
          <a href="https://truevoicehq.com/dashboard" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Run your first interview →</a>
          <p style="color: #999; font-size: 12px; margin-top: 40px; line-height: 1.6;">You're receiving this because you signed up for TrueVoice HQ. <a href="https://truevoicehq.com" style="color: #999;">truevoicehq.com</a></p>
        </div>
      `,
    };
  }

  // day7
  return {
    subject: "What's working — and a tip from us",
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">TRUE</span><span style="font-size: 18px; font-weight: 400; color: #555;">voice</span><span style="font-size: 18px; font-weight: 500; color: #059669;">HQ</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px;">One week in, ${firstName}</h1>
        <p style="color: #555; line-height: 1.6; margin: 0 0 16px;">A tip that makes TrueVoice significantly more useful: <strong>compare candidates side by side.</strong></p>
        <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">After running a few interviews for the same role, go to the <strong>Compare</strong> page. You'll see authenticity scores, behavioral flags, and linguistic patterns stacked against each other — which makes the difference between candidates immediately visible.</p>
        <a href="https://truevoicehq.com/compare" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Try Compare →</a>
        <p style="color: #555; font-size: 13px; margin-top: 32px; line-height: 1.6;">Questions or feedback? Just reply — we read every email.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px; line-height: 1.6;">You're receiving this because you signed up for TrueVoice HQ. <a href="https://truevoicehq.com" style="color: #999;">truevoicehq.com</a></p>
      </div>
    `,
  };
}

serve(async (req) => {
  try {
    const body = await req.json() as { userId?: string; companyId?: string; sequence: DripEmail["sequence"] };
    const { sequence } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let userId = body.userId;
    let companyId = body.companyId;

    // If companyId provided, find the owner profile
    if (!userId && companyId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      userId = profile?.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Could not resolve user" }), { status: 400 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_id")
      .eq("id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    if (!companyId) companyId = profile.company_id;

    // Get user email
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;
    if (!email) {
      return new Response(JSON.stringify({ error: "No email found" }), { status: 400 });
    }

    // Get company for plan info
    const { data: company } = companyId
      ? await supabase.from("companies").select("subscription_tier").eq("id", companyId).single()
      : { data: null };

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("[send-drip-email] RESEND_API_KEY not set, skipping");
      return new Response(JSON.stringify({ sent: false, reason: "no_resend_key" }));
    }

    const emailData: DripEmail = {
      to: email,
      name: profile.full_name ?? "",
      plan: company?.subscription_tier ?? "starter",
      sequence,
    };

    const { subject, html } = getEmailContent(emailData);

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("[send-drip-email] Resend error:", result);
      return new Response(JSON.stringify({ sent: false, error: result }), { status: 500 });
    }

    console.log(`[send-drip-email] Sent ${sequence} to ${email}`);
    return new Response(JSON.stringify({ sent: true, id: result.id }));
  } catch (err) {
    console.error("[send-drip-email] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
