import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { interview_id, image_base64, elapsed_seconds } = await req.json();

    const proxyKey = Deno.env.get("AI_PROXY_KEY");
    const proxyUrl = Deno.env.get("AI_PROXY_URL");
    const xaiKey = proxyKey || Deno.env.get("XAI_API_KEY");
    if (!xaiKey) {
      return new Response(JSON.stringify({ error: "Neither AI_PROXY_KEY nor XAI_API_KEY is set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const xaiBaseUrl = proxyUrl || "https://api.x.ai";

    const grokResponse = await fetch(`${xaiBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${xaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-2-vision-latest",
        messages: [
          {
            role: "system",
            content: `You are a visual interview monitor. Analyze this webcam frame from a live interview and check for suspicious behavior.

Return ONLY valid JSON:
{
  "looking_away": <boolean - eyes clearly directed away from camera/screen>,
  "reading_detected": <boolean - eyes scanning left-to-right as if reading text from another screen or notes>,
  "multiple_faces": <boolean - more than one person visible>,
  "no_face": <boolean - no face visible in frame>,
  "phone_visible": <boolean - phone or secondary device visible>,
  "description": "<brief 1-sentence description of what you see>"
}

Be conservative: only flag something if it is clearly visible. Brief glances away are normal. Flag reading_detected only if the eye movement pattern strongly suggests reading from a screen or notes.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Interview frame at ${Math.floor(elapsed_seconds / 60)}:${String(elapsed_seconds % 60).padStart(2, "0")}. Analyze this frame for the candidate's visual behavior.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    const grokData = await grokResponse.json();

    if (!grokResponse.ok) {
      console.error("[analyze-frame] Grok API error:", grokResponse.status);
      return new Response(
        JSON.stringify({
          looking_away: false,
          reading_detected: false,
          multiple_faces: false,
          no_face: false,
          phone_visible: false,
          description: "Analysis unavailable",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = grokData.choices?.[0]?.message?.content || "{}";

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      analysis = {
        looking_away: false,
        reading_detected: false,
        multiple_faces: false,
        no_face: false,
        phone_visible: false,
        description: "Could not parse analysis",
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
