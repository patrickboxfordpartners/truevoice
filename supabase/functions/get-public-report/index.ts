// supabase/functions/get-public-report/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
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
    supabase.from("interviews").select("*").eq("id", interviewId).single(),
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
