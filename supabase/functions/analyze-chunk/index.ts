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
    const { interview_id, chunk_text, chunk_index, elapsed_seconds, previous_scores } =
      await req.json();

    const xaiKey = Deno.env.get("XAI_API_KEY");
    if (!xaiKey) {
      return new Response(JSON.stringify({ error: "XAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Grok for analysis
    const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${xaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          {
            role: "system",
            content: `You are an interview authenticity analyst. Analyze the following transcript chunk from a live interview and score it on 4 dimensions (each 0-25):
- speech: Natural speech patterns (filler words, self-corrections, vocal variety) vs reading/scripted cadence
- timing: Natural thinking time vs suspiciously instant or very delayed responses
- flow: Conversational engagement (clarifying questions, back-and-forth) vs monologue delivery
- linguistic: Spoken language patterns (contractions, informal grammar) vs written/formal language

Also detect any flags/patterns with severity (low/medium/high).

Return ONLY valid JSON in this format:
{
  "speech": <0-25>,
  "timing": <0-25>,
  "flow": <0-25>,
  "linguistic": <0-25>,
  "flags": [{"pattern": "description", "severity": "low|medium|high"}]
}`,
          },
          {
            role: "user",
            content: `Elapsed time: ${elapsed_seconds}s
Previous scores: ${JSON.stringify(previous_scores || {})}
Transcript chunk: "${chunk_text}"`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const grokData = await grokResponse.json();
    console.log("[analyze-chunk] Grok API status:", grokResponse.status);
    console.log("[analyze-chunk] Grok raw response:", JSON.stringify(grokData));

    if (!grokResponse.ok) {
      console.error("[analyze-chunk] Grok API error:", grokResponse.status, JSON.stringify(grokData));
      // Return error details so frontend and direct calls can see what went wrong
      return new Response(
        JSON.stringify({
          error: `Grok API error: ${grokResponse.status}`,
          scores: { speech: 0, timing: 0, flow: 0, linguistic: 0 },
          overall: 0,
          flags: [],
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = grokData.choices?.[0]?.message?.content || "{}";
    console.log("[analyze-chunk] Extracted content:", content);

    // Parse Grok response
    let analysis;
    try {
      // Try to extract JSON from the response, handling markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonToParse = jsonMatch ? jsonMatch[0] : content;
      console.log("[analyze-chunk] JSON to parse:", jsonToParse);
      analysis = JSON.parse(jsonToParse);
      console.log("[analyze-chunk] Parsed analysis:", JSON.stringify(analysis));
    } catch (e) {
      console.error("[analyze-chunk] JSON parse error:", e);
      console.log("[analyze-chunk] Using default scores");
      analysis = { speech: 15, timing: 15, flow: 15, linguistic: 15, flags: [] };
    }

    const scores = {
      speech: Math.min(25, Math.max(0, analysis.speech || 0)),
      timing: Math.min(25, Math.max(0, analysis.timing || 0)),
      flow: Math.min(25, Math.max(0, analysis.flow || 0)),
      linguistic: Math.min(25, Math.max(0, analysis.linguistic || 0)),
    };

    const overall = scores.speech + scores.timing + scores.flow + scores.linguistic;
    const flags = analysis.flags || [];

    // Save to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save transcript chunk
    await supabase.from("transcript_chunks").insert({
      interview_id,
      chunk_index,
      text: chunk_text,
      elapsed_seconds,
      speech_score: scores.speech,
      timing_score: scores.timing,
      flow_score: scores.flow,
      linguistic_score: scores.linguistic,
    });

    // Save timeline point
    const minutes = Math.floor(elapsed_seconds / 60);
    const mins = `${minutes}:${String(elapsed_seconds % 60).padStart(2, "0")}`;
    await supabase.from("interview_timeline").insert({
      interview_id,
      minute: mins,
      score: overall,
    });

    // Save any flags
    if (flags.length > 0) {
      const timeStr = `${Math.floor(elapsed_seconds / 60)}:${String(
        elapsed_seconds % 60
      ).padStart(2, "0")}`;

      await supabase.from("interview_flags").insert(
        flags.map((f: any) => ({
          interview_id,
          time: timeStr,
          pattern: f.pattern,
          severity: f.severity || "low",
        }))
      );
    }

    return new Response(
      JSON.stringify({ scores, overall, flags }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
