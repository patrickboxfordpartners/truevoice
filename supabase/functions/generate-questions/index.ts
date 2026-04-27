import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Strip <think>...</think> reasoning blocks and extract the first valid JSON array. */
function extractJson(raw: string): string | null {
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Try array match first (our expected output shape)
  const arrayMatch = stripped.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      JSON.parse(arrayMatch[0]);
      return arrayMatch[0];
    } catch {
      // fall through
    }
  }
  // Try object wrapper
  const objMatch = stripped.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      JSON.parse(objMatch[0]);
      return objMatch[0];
    } catch {
      // fall through
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { position, job_description, company_name } = await req.json();

    if (!position) {
      return new Response(JSON.stringify({ error: "position is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const xaiKey = Deno.env.get("XAI_API_KEY");
    if (!xaiKey) {
      return new Response(JSON.stringify({ error: "XAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextParts: string[] = [`Position: ${position}`];
    if (company_name) contextParts.push(`Company: ${company_name}`);
    if (job_description) contextParts.push(`Job Description:\n${job_description}`);

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
            content: `You are an expert interviewer generating tailored interview questions.
Given a job position and optional job description, produce 8-10 interview questions.

Mix question types:
- behavioral: "Tell me about a time..." — tests past behavior and experience
- situational: "How would you handle..." — tests judgment and problem-solving
- technical: role-specific knowledge or skill questions
- authenticity: "What would you do differently..." or reflection questions that reveal genuine self-awareness

You MUST return ONLY a valid JSON array with no explanation, no markdown, no code fences.
Each item must have exactly: id (string, e.g. "q1"), text (string), type ("behavioral"|"situational"|"technical"|"authenticity"), suggested_follow_up (string).

Example shape:
[{"id":"q1","text":"Tell me about a time you had to...","type":"behavioral","suggested_follow_up":"What was the outcome?"}]`,
          },
          {
            role: "user",
            content: contextParts.join("\n\n"),
          },
        ],
        temperature: 0.7,
      }),
    });

    const grokData = await grokResponse.json();

    if (!grokResponse.ok) {
      console.error("[generate-questions] Grok API error:", grokResponse.status, JSON.stringify(grokData));
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawContent = grokData.choices?.[0]?.message?.content || "";
    console.log("[generate-questions] Raw content:", rawContent.slice(0, 400));

    let questions: any[];
    try {
      const jsonStr = extractJson(rawContent);
      if (!jsonStr) throw new Error("No JSON found in response");
      const parsed = JSON.parse(jsonStr);
      // Handle both array and {questions:[...]} shapes
      questions = Array.isArray(parsed) ? parsed : parsed.questions ?? [];
      if (!Array.isArray(questions) || questions.length === 0) throw new Error("Empty questions array");
    } catch (e) {
      console.error("[generate-questions] Parse error:", e, "raw:", rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize and validate each question
    const normalized = questions.map((q: any, i: number) => ({
      id: q.id || `q${i + 1}`,
      text: String(q.text || ""),
      type: (["behavioral", "situational", "technical", "authenticity"] as const).includes(q.type)
        ? q.type
        : "behavioral",
      suggested_follow_up: String(q.suggested_follow_up || ""),
    }));

    return new Response(
      JSON.stringify({ questions: normalized }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[generate-questions] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
