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

    // Fetch all chunk analyses and the transcript
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

    // Call Grok for comprehensive final report
    const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${xaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini-fast",
        messages: [
          {
            role: "system",
            content: `You are an interview authenticity analyst producing a final comprehensive report.
Analyze the full interview transcript and chunk-level analyses to produce overall scores.

Score each dimension 0-25:
- speech: Natural speech patterns vs reading/scripted cadence
- timing: Natural response timing vs instant/delayed
- flow: Conversational engagement vs monologue
- linguistic: Spoken language vs written/formal

Also provide:
- engagement (0-100): How engaged and present the candidate was
- confidence (0-100): How confident vs uncertain the candidate appeared
- summary: 1-2 sentence overall assessment
- recommendations: Array of 3-5 actionable next steps

Return ONLY valid JSON:
{
  "speech": <0-25>,
  "timing": <0-25>,
  "flow": <0-25>,
  "linguistic": <0-25>,
  "engagement": <0-100>,
  "confidence": <0-100>,
  "summary": "...",
  "recommendations": ["...", "..."]
}`,
          },
          {
            role: "user",
            content: `Interview: ${interview.candidate_name} for ${interview.position}
Chunk analyses (${chunks.length} chunks): ${JSON.stringify(
              chunks.map((c: any) => ({
                speech: c.speech_score,
                timing: c.timing_score,
                flow: c.flow_score,
                linguistic: c.linguistic_score,
              }))
            )}
Existing flags (${existingFlags.length}): ${JSON.stringify(
              existingFlags.map((f: any) => ({
                time: f.time,
                pattern: f.pattern,
                severity: f.severity,
              }))
            )}
Full transcript: "${fullTranscript.slice(0, 8000)}"`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const grokData = await grokResponse.json();
    const content = grokData.choices?.[0]?.message?.content || "{}";

    let report;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      report = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      // Fallback: average chunk scores
      const avgScore = (key: string) => {
        const vals = chunks.map((c: any) => c[key]).filter(Boolean);
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
      speech: Math.min(25, Math.max(0, report.speech || 0)),
      timing: Math.min(25, Math.max(0, report.timing || 0)),
      flow: Math.min(25, Math.max(0, report.flow || 0)),
      linguistic: Math.min(25, Math.max(0, report.linguistic || 0)),
    };
    const overall = scores.speech + scores.timing + scores.flow + scores.linguistic;

    // Save report
    const { data: savedReport, error: reportError } = await supabase
      .from("interview_reports")
      .insert({
        interview_id,
        overall_score: overall,
        speech_score: scores.speech,
        timing_score: scores.timing,
        flow_score: scores.flow,
        linguistic_score: scores.linguistic,
        engagement: Math.min(100, Math.max(0, report.engagement || 70)),
        confidence: Math.min(100, Math.max(0, report.confidence || 70)),
        summary: report.summary || null,
        recommendations: report.recommendations || null,
      })
      .select()
      .single();

    if (reportError) {
      throw reportError;
    }

    // Mark interview as completed
    await supabase
      .from("interviews")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", interview_id);

    return new Response(
      JSON.stringify({ report: savedReport }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
