import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Strip <think>...</think> reasoning blocks and extract the last valid JSON object. */
function extractJson(raw: string): string | null {
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const matches = [...stripped.matchAll(/\{[\s\S]*?\}/g)];
  if (matches.length === 0) return null;
  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      JSON.parse(matches[i][0]);
      return matches[i][0];
    } catch {
      continue;
    }
  }
  const greedy = stripped.match(/\{[\s\S]*\}/);
  return greedy ? greedy[0] : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { interview_id } = await req.json();

    const xaiKey = Deno.env.get("XAI_API_KEY");
    if (!xaiKey) {
      return new Response(JSON.stringify({ error: "XAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [chunksRes, interviewRes, flagsRes] = await Promise.all([
      supabase
        .from("transcript_chunks")
        .select("*")
        .eq("interview_id", interview_id)
        .order("chunk_index"),
      supabase
        .from("interviews")
        .select("*")
        .eq("id", interview_id)
        .single(),
      supabase
        .from("interview_flags")
        .select("*")
        .eq("interview_id", interview_id),
    ]);

    const chunks = chunksRes.data || [];
    const interview = interviewRes.data;
    const existingFlags = flagsRes.data || [];

    if (!interview) {
      return new Response(JSON.stringify({ error: "Interview not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullTranscript = interview.transcript || chunks.map((c: any) => c.text).join(" ");

    // If no transcript yet, use chunk averages as fallback
    if (!fullTranscript.trim() && chunks.length === 0) {
      const fallbackReport = {
        speech: 15, timing: 15, flow: 15, linguistic: 15,
        engagement: 70, confidence: 70,
        summary: "Interview completed. No transcript data available for analysis.",
        recommendations: ["Ensure microphone permissions are granted for future interviews"],
      };
      const overall = fallbackReport.speech + fallbackReport.timing + fallbackReport.flow + fallbackReport.linguistic;
      const { data: savedReport, error } = await supabase
        .from("interview_reports")
        .insert({ interview_id, overall_score: overall, ...fallbackReport })
        .select().single();
      if (error) throw error;
      await supabase.from("interviews").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", interview_id);
      return new Response(JSON.stringify({ report: savedReport }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${xaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-fast",
        messages: [
          {
            role: "system",
            content: `You are an interview authenticity analyst producing a final comprehensive report.
Analyze the full interview transcript and chunk-level analyses to produce overall scores.

Score each dimension 0-25 (higher = more authentic/natural):
- speech: Natural speech patterns vs reading/scripted cadence
- timing: Natural response timing vs instant memorized or extremely delayed
- flow: Conversational engagement vs monologue delivery
- linguistic: Spoken language patterns vs written/formal language

Also provide:
- engagement (0-100): How engaged and present the candidate was
- confidence (0-100): How confident vs uncertain the candidate appeared
- summary: 1-2 sentence overall assessment
- recommendations: Array of 3-5 actionable next steps for the interviewer

You MUST return ONLY valid JSON with no explanation, no markdown, no code fences:
{"speech":20,"timing":18,"flow":15,"linguistic":22,"engagement":75,"confidence":70,"summary":"...","recommendations":["...","..."]}`,
          },
          {
            role: "user",
            content: `Interview: ${interview.candidate_name} for ${interview.position}
Chunk-level analyses (${chunks.length} chunks): ${JSON.stringify(
              chunks.map((c: any) => ({
                speech: c.speech_score,
                timing: c.timing_score,
                flow: c.flow_score,
                linguistic: c.linguistic_score,
              }))
            )}
Flags detected (${existingFlags.length}): ${JSON.stringify(
              existingFlags.map((f: any) => ({ time: f.time, pattern: f.pattern, severity: f.severity }))
            )}
Full transcript: "${fullTranscript.slice(0, 8000)}"`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const grokData = await grokResponse.json();
    console.log("[generate-final-report] Grok API status:", grokResponse.status);

    if (!grokResponse.ok) {
      console.error("[generate-final-report] Grok API error:", grokResponse.status, JSON.stringify(grokData));
    }

    const rawContent = grokData.choices?.[0]?.message?.content || "";
    console.log("[generate-final-report] Raw content:", rawContent.slice(0, 300));

    let report: any;
    try {
      const jsonStr = extractJson(rawContent);
      if (!jsonStr) throw new Error("No JSON found");
      report = JSON.parse(jsonStr);
      console.log("[generate-final-report] Parsed report:", JSON.stringify(report));
    } catch (e) {
      console.error("[generate-final-report] Parse error, falling back to chunk averages:", e);
      const avgScore = (key: string) => {
        const vals = chunks.map((c: any) => c[key]).filter((v: any) => v != null);
        return vals.length > 0 ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 15;
      };
      report = {
        speech: avgScore("speech_score"),
        timing: avgScore("timing_score"),
        flow: avgScore("flow_score"),
        linguistic: avgScore("linguistic_score"),
        engagement: 70,
        confidence: 70,
        summary: "Analysis completed based on chunk-level scores.",
        recommendations: [
          "Review the full transcript for additional context",
          "Consider a follow-up interview for clarification",
        ],
      };
    }

    const scores = {
      speech: Math.min(25, Math.max(0, report.speech ?? 15)),
      timing: Math.min(25, Math.max(0, report.timing ?? 15)),
      flow: Math.min(25, Math.max(0, report.flow ?? 15)),
      linguistic: Math.min(25, Math.max(0, report.linguistic ?? 15)),
    };
    const overall = scores.speech + scores.timing + scores.flow + scores.linguistic;

    console.log("[generate-final-report] Final scores:", JSON.stringify(scores), "overall:", overall);

    const { data: savedReport, error: reportError } = await supabase
      .from("interview_reports")
      .insert({
        interview_id,
        overall_score: overall,
        speech_score: scores.speech,
        timing_score: scores.timing,
        flow_score: scores.flow,
        linguistic_score: scores.linguistic,
        engagement: Math.min(100, Math.max(0, report.engagement ?? 70)),
        confidence: Math.min(100, Math.max(0, report.confidence ?? 70)),
        summary: report.summary || null,
        recommendations: report.recommendations || null,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    await supabase
      .from("interviews")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", interview_id);

    // Fire-and-forget: resume alignment analysis (non-blocking)
    if (interview.resume_text) {
      fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ interview_id }),
      }).catch((e) => console.warn("[generate-final-report] analyze-resume failed (non-fatal):", e));
    }

    // Fire-and-forget: candidate feedback email (non-blocking)
    if (interview.candidate_email) {
      fetch(`${supabaseUrl}/functions/v1/send-interview-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ interview_id, template_type: "feedback" }),
      }).catch((e) => console.warn("[generate-final-report] feedback email failed (non-fatal):", e));
    }

    return new Response(
      JSON.stringify({ report: savedReport }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[generate-final-report] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
