"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";

export const analyzeFrame = action({
  args: {
    interviewId: v.string(),
    imageBase64: v.string(),
    elapsedSeconds: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const xaiKey = process.env.AI_PROXY_KEY || process.env.XAI_API_KEY;
    if (!xaiKey) throw new Error("XAI_API_KEY not set");
    const xaiBaseUrl = process.env.AI_PROXY_URL || "https://api.x.ai";

    const grokResponse = await fetch(`${xaiBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${xaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-2-vision-latest",
        messages: [
          {
            role: "system",
            content: `You are a visual interview monitor. Analyze this webcam frame from a live interview and check for suspicious behavior.

Return ONLY valid JSON:
{
  "looking_away": <boolean>,
  "reading_detected": <boolean>,
  "multiple_faces": <boolean>,
  "no_face": <boolean>,
  "phone_visible": <boolean>,
  "description": "<brief 1-sentence description>"
}

Be conservative: only flag something if clearly visible.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Interview frame at ${Math.floor(args.elapsedSeconds / 60)}:${String(args.elapsedSeconds % 60).padStart(2, "0")}. Analyze this frame.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${args.imageBase64}` },
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
      console.error("[analyzeFrame] Grok error:", grokResponse.status);
      return {
        looking_away: false, reading_detected: false, multiple_faces: false,
        no_face: false, phone_visible: false, description: "Analysis unavailable",
      };
    }

    const content = grokData.choices?.[0]?.message?.content || "{}";
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      return {
        looking_away: false, reading_detected: false, multiple_faces: false,
        no_face: false, phone_visible: false, description: "Could not parse analysis",
      };
    }
  },
});
