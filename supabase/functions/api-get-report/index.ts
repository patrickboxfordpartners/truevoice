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

  if (req.method !== "GET") {
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
      .select("id, subscription_tier, subscription_status")
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

    // --- Parse query params ---
    const url = new URL(req.url);
    const interviewId = url.searchParams.get("interview_id");
    if (!interviewId) {
      return jsonResponse({ error: "Missing required query param: interview_id" }, 400);
    }

    // --- Fetch interview (scoped to company) ---
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .eq("company_id", company.id)
      .single();

    if (interviewError || !interview) {
      return jsonResponse({ error: "Interview not found" }, 404);
    }

    // --- Fetch report ---
    const { data: report, error: reportError } = await supabase
      .from("interview_reports")
      .select("*")
      .eq("interview_id", interviewId)
      .single();

    if (reportError || !report) {
      return jsonResponse(
        {
          interview: {
            id: interview.id,
            candidate_name: interview.candidate_name,
            candidate_email: interview.candidate_email,
            position: interview.position,
            status: interview.status,
            scheduled_at: interview.scheduled_at,
            created_at: interview.created_at,
          },
          report: null,
          flags: [],
          message: "Report not yet generated — interview may not be complete",
        },
        200
      );
    }

    // --- Fetch flags ---
    const { data: flags } = await supabase
      .from("interview_flags")
      .select("id, time, pattern, severity, description")
      .eq("interview_id", interviewId)
      .order("time", { ascending: true });

    // --- Summarise flags by severity ---
    const flagSummary = (flags || []).reduce(
      (acc: Record<string, number>, f: { severity: string }) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      },
      {}
    );

    return jsonResponse({
      interview: {
        id: interview.id,
        candidate_name: interview.candidate_name,
        candidate_email: interview.candidate_email,
        position: interview.position,
        status: interview.status,
        scheduled_at: interview.scheduled_at,
        created_at: interview.created_at,
      },
      report: {
        id: report.id,
        overall_score: report.overall_score,
        speech_score: report.speech_score,
        timing_score: report.timing_score,
        flow_score: report.flow_score,
        linguistic_score: report.linguistic_score,
        engagement: report.engagement,
        confidence: report.confidence,
        summary: report.summary,
        recommendations: report.recommendations,
        created_at: report.created_at,
      },
      flags: flags || [],
      flags_summary: flagSummary,
    });
  } catch (err) {
    console.error("[api-get-report] Unhandled error:", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
