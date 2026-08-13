import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";

/** Strip <think>...</think> reasoning blocks and extract the last JSON object. */
function extractJson(raw: string): string | null {
  // Remove reasoning model thinking blocks
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Find all {...} blocks and take the last one (most likely the actual output)
  const matches = [...stripped.matchAll(/\{[\s\S]*?\}/g)];
  if (matches.length === 0) return null;
  // Try from last to first until one parses cleanly
  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      JSON.parse(matches[i][0]);
      return matches[i][0];
    } catch {
      continue;
    }
  }
  // Fall back to greedy match on stripped content
  const greedy = stripped.match(/\{[\s\S]*\}/);
  return greedy ? greedy[0] : null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    // Rate limiting: 60 requests per minute (1 per second for real-time analysis)
    const rateLimitKey = getRateLimitKey(req, "analyze-chunk");
    const rateLimit = await checkRateLimit(rateLimitKey, 60, 60);

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

    // Parse and validate request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { interview_id, chunk_text, chunk_index, elapsed_seconds, previous_scores, response_delays, company_id } = body;

    // Input validation
    if (!interview_id || typeof interview_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid field: interview_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!chunk_text || typeof chunk_text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid field: chunk_text" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate chunk size (5KB max = ~1250 words, prevents cost abuse)
    if (chunk_text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "chunk_text too large (max 5000 characters)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize chunk_text to prevent XSS/injection
    const sanitizedText = chunk_text
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]+>/g, "") // Remove all HTML tags
      .replace(/[^\w\s.,!?'-]/g, "") // Remove special chars except basic punctuation
      .trim();

    if (!sanitizedText) {
      return new Response(
        JSON.stringify({ error: "chunk_text contains no valid content after sanitization" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof chunk_index !== "number" || chunk_index < 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid field: chunk_index (must be non-negative number)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof elapsed_seconds !== "number" || elapsed_seconds < 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid field: elapsed_seconds (must be non-negative number)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate UUID format for interview_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(interview_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid interview_id format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use sanitized text for analysis (original chunk_text becomes sanitizedText)
    const chunk_text_safe = sanitizedText;

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

    // Load company-specific flagged phrases for prompt injection
    let companyPhrases: string[] = [];
    if (company_id) {
      const { data: phrases } = await supabase
        .from("flagged_phrases")
        .select("phrase")
        .eq("company_id", company_id)
        .limit(50);
      companyPhrases = (phrases ?? []).map((p: { phrase: string }) => p.phrase);
    }

    const companyPhrasesSection = companyPhrases.length > 0
      ? `\n\nThis company has also flagged these specific phrases as red flags from past interviews — flag them if they appear (severity: medium): ${companyPhrases.map((p) => `"${p}"`).join(", ")}`
      : "";

    // Use grok-3-fast — non-reasoning model, reliable JSON output, lower latency
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
            content: `You are an interview authenticity analyst. Analyze the following transcript chunk from a live interview and score it on 4 dimensions (each 0-25):

- speech: Natural speech patterns (filler words, self-corrections, vocal variety) vs reading/scripted cadence. Score 20-25 for highly natural, 10-19 for mixed, 0-9 for clearly scripted.
- timing: Natural thinking time based on MEASURED response delays. Use the provided timing data to score authentically: mostly "normal" delays = 20-25, mix = 12-19, mostly "instant" or "delayed" = 0-11. If no timing data is provided, infer from speech patterns in the text.
- flow: Conversational engagement (clarifying questions, back-and-forth) vs monologue delivery. Score 20-25 for engaged, 10-19 for mixed, 0-9 for pure monologue.
- linguistic: Spoken language patterns (contractions, informal grammar, spoken fillers) vs written/formal language. Score 20-25 for natural spoken language, 10-19 for mixed, 0-9 for formal/written.

Also detect behavioral flags AND coached/AI-generated language flags. For phrases:
- Flag overly structured openers: "Firstly... secondly... in conclusion", "That's a great question"
- Flag AI tell phrases: "Certainly", "Absolutely", "I'd be happy to", "Great question"
- Flag rehearsed corporate language used unnaturally: "synergize", "leverage", "holistic approach", "going forward"
- Flag suspiciously precise statistics without citation: "studies show X%", "research indicates"
- Flag unusually polished transitions that feel rehearsed
Use flag type "phrase" and severity "medium" for language flags. Include the exact flagged phrase in the pattern field.${companyPhrasesSection}

Only flag real patterns. Do not flag normal professional language.

You MUST return ONLY valid JSON with no explanation, no markdown, no code fences:
{"speech":20,"timing":18,"flow":15,"linguistic":22,"flags":[{"pattern":"description","severity":"low","flag_type":"behavior"}]}`,
          },
          {
            role: "user",
            content: [
              `Elapsed time: ${elapsed_seconds}s`,
              `Previous scores: ${JSON.stringify(previous_scores || {})}`,
              Array.isArray(response_delays) && response_delays.length > 0
                ? `Response timing data for this chunk: ${JSON.stringify(
                    response_delays.map((d: { question: string; delay: number; label: string }) => ({
                      question: d.question,
                      delay_seconds: d.delay,
                      label: d.label,
                    }))
                  )}\n- "instant" responses (<1.5s) may indicate memorized/scripted answers\n- "normal" responses (1.5-4s) indicate natural thinking time\n- "delayed" responses (>4s) may indicate uncertainty or searching for answers`
                : null,
              `Transcript chunk to analyze: "${chunk_text_safe}"`,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
        temperature: 0.3,
      }),
    });

    const grokData = await grokResponse.json();
    console.log("[analyze-chunk] Grok API status:", grokResponse.status);
    console.log("[analyze-chunk] Grok raw response:", JSON.stringify(grokData).slice(0, 500));

    if (!grokResponse.ok) {
      console.error("[analyze-chunk] Grok API error:", grokResponse.status, JSON.stringify(grokData));
      return new Response(
        JSON.stringify({
          error: `Grok API error: ${grokResponse.status}`,
          grok_error: grokData,
          scores: { speech: 15, timing: 15, flow: 15, linguistic: 15 },
          overall: 60,
          flags: [],
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawContent = grokData.choices?.[0]?.message?.content || "";
    console.log("[analyze-chunk] Raw content:", rawContent.slice(0, 300));

    // Parse Grok response — handle reasoning model thinking blocks and markdown fences
    let analysis: { speech?: number; timing?: number; flow?: number; linguistic?: number; flags?: unknown[] } = {};
    try {
      const jsonStr = extractJson(rawContent);
      console.log("[analyze-chunk] Extracted JSON string:", jsonStr);
      if (!jsonStr) throw new Error("No JSON found in response");
      analysis = JSON.parse(jsonStr);
      console.log("[analyze-chunk] Parsed analysis:", JSON.stringify(analysis));
    } catch (e) {
      console.error("[analyze-chunk] JSON parse error:", e, "| Raw:", rawContent.slice(0, 200));
      // Use neutral mid-range scores rather than zeros so the UI shows something meaningful
      analysis = { speech: 15, timing: 15, flow: 15, linguistic: 15, flags: [] };
    }

    // Use nullish coalescing so a legitimate 0 score from Grok is preserved
    const scores = {
      speech: Math.min(25, Math.max(0, analysis.speech ?? 15)),
      timing: Math.min(25, Math.max(0, analysis.timing ?? 15)),
      flow: Math.min(25, Math.max(0, analysis.flow ?? 15)),
      linguistic: Math.min(25, Math.max(0, analysis.linguistic ?? 15)),
    };

    const overall = scores.speech + scores.timing + scores.flow + scores.linguistic;
    const flags = (analysis.flags as Array<{ pattern: string; severity?: string }>) || [];

    console.log("[analyze-chunk] Final scores:", JSON.stringify(scores), "overall:", overall);

    // Save to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("transcript_chunks").insert({
      interview_id,
      chunk_index,
      text: chunk_text_safe,
      elapsed_seconds,
      speech_score: scores.speech,
      timing_score: scores.timing,
      flow_score: scores.flow,
      linguistic_score: scores.linguistic,
    });

    const minutes = Math.floor(elapsed_seconds / 60);
    const mins = `${minutes}:${String(elapsed_seconds % 60).padStart(2, "0")}`;
    await supabase.from("interview_timeline").insert({
      interview_id,
      minute: mins,
      score: overall,
    });

    if (flags.length > 0) {
      const timeStr = `${Math.floor(elapsed_seconds / 60)}:${String(elapsed_seconds % 60).padStart(2, "0")}`;
      await supabase.from("interview_flags").insert(
        flags.map((f) => ({
          interview_id,
          time: timeStr,
          pattern: f.pattern,
          severity: f.severity || "low",
          flag_type: (f as any).flag_type || "behavior",
        }))
      );
    }

    if (Array.isArray(response_delays) && response_delays.length > 0) {
      await supabase.from("response_delays").insert(
        response_delays.map((d: { question: string; delay: number; label: string }) => ({
          interview_id,
          question: d.question,
          delay: d.delay,
          label: d.label,
        }))
      );
    }

    return new Response(
      JSON.stringify({ scores, overall, flags }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[analyze-chunk] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
