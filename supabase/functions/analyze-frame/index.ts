import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { interview_id, image_base64, elapsed_seconds } = await req.json();

    const xaiKey = Deno.env.get("XAI_API_KEY");
    if (!xaiKey) {
      return new Response(JSON.stringify({ error: "XAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
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
