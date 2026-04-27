import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // --- Auth: extract API key from Bearer token ---
    const authHeader = req.headers.get("Authorization") || "";
    const apiKey = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!apiKey) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key against companies table
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, subscription_tier, subscription_status")
      .eq("api_key", apiKey)
      .single();

    if (companyError || !company) {
      return jsonResponse({ error: "Invalid API key" }, 401);
    }

    // Gate: Scale plan only
    const isScale =
      company.subscription_tier === "scale" &&
      (company.subscription_status === "active" || company.subscription_status === "trialing");

    if (!isScale) {
      return jsonResponse(
        { error: "API access requires the Scale plan", upgrade_url: "/settings" },
        403
      );
    }

    // --- Parse request body ---
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { candidate_name, candidate_email, position, scheduled_at, notes } = body as {
      candidate_name?: string;
      candidate_email?: string;
      position?: string;
      scheduled_at?: string;
      notes?: string;
    };

    if (!candidate_name || !candidate_email || !position) {
      return jsonResponse(
        { error: "Missing required fields: candidate_name, candidate_email, position" },
        400
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidate_email)) {
      return jsonResponse({ error: "Invalid candidate_email" }, 400);
    }

    // --- Create interview ---
    const { data: interview, error: insertError } = await supabase
      .from("interviews")
      .insert({
        company_id: company.id,
        candidate_name,
        candidate_email,
        position,
        scheduled_at: scheduled_at || null,
        notes: notes || null,
        status: "scheduled",
      })
      .select()
      .single();

    if (insertError || !interview) {
      console.error("[api-create-interview] Insert error:", insertError);
      return jsonResponse({ error: "Failed to create interview" }, 500);
    }

    const siteUrl =
      Deno.env.get("SITE_URL") ||
      req.headers.get("origin") ||
      "https://true-voice-insights.vercel.app";

    const interviewLink = `${siteUrl}/interview/${interview.candidate_token}`;

    return jsonResponse({
      interview: {
        id: interview.id,
        candidate_name: interview.candidate_name,
        candidate_email: interview.candidate_email,
        position: interview.position,
        status: interview.status,
        scheduled_at: interview.scheduled_at,
        notes: interview.notes,
        candidate_token: interview.candidate_token,
        interview_link: interviewLink,
        created_at: interview.created_at,
      },
    });
  } catch (err) {
    console.error("[api-create-interview] Unhandled error:", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
