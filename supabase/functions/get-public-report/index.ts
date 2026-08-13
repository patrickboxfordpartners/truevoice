// supabase/functions/get-public-report/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  // Rate limiting: 100 requests per minute per IP (public endpoint)
  const rateLimitKey = getRateLimitKey(req, "public-report");
  const rateLimit = await checkRateLimit(rateLimitKey, 100, 60);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        reset_at: rateLimit.resetAt.toISOString(),
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const url = new URL(req.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // Validate token format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return new Response(JSON.stringify({ error: "Invalid token format" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Look up the token
  const { data: tokenRow, error: tokenError } = await supabase
    .from("report_tokens")
    .select("interview_id")
    .eq("token", token)
    .single()

  if (tokenError || !tokenRow) {
    return new Response(JSON.stringify({ error: "Invalid or expired link" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const interviewId = tokenRow.interview_id

  // Fetch all report data in parallel
  const [interviewRes, reportRes, flagsRes, timelineRes, delaysRes] = await Promise.all([
    supabase.from("interviews").select("id, candidate_name, position, scheduled_at, duration, status").eq("id", interviewId).single(),
    supabase.from("interview_reports").select("*").eq("interview_id", interviewId).maybeSingle(),
    supabase.from("interview_flags").select("*").eq("interview_id", interviewId).order("created_at", { ascending: true }),
    supabase.from("interview_timeline").select("*").eq("interview_id", interviewId).order("created_at", { ascending: true }),
    supabase.from("response_delays").select("*").eq("interview_id", interviewId).order("created_at", { ascending: true }),
  ])

  if (interviewRes.error || !interviewRes.data) {
    return new Response(JSON.stringify({ error: "Report not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  return new Response(
    JSON.stringify({
      interview: interviewRes.data,
      report: reportRes.data ?? null,
      flags: flagsRes.data ?? [],
      timeline: timelineRes.data ?? [],
      responseDelays: delaysRes.data ?? [],
      interviewer: null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
