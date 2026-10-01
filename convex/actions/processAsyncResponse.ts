"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

function extractJson(raw: string): string | null {
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const candidates: string[] = [];
  for (let i = 0; i < stripped.length; i++) {
    if (stripped[i] !== "{") continue;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = i; j < stripped.length; j++) {
      const ch = stripped[j];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) { candidates.push(stripped.slice(i, j + 1)); break; }
      }
    }
  }
  candidates.sort((a, b) => b.length - a.length);
  for (const c of candidates) {
    try { JSON.parse(c); return c; } catch { continue; }
  }
  return null;
}

export const processAsyncResponse = action({
  args: {
    responseId: v.string(),
    interviewId: v.string(),
    videoUrl: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    const xaiKey = process.env.AI_PROXY_KEY || process.env.XAI_API_KEY;

    if (!deepgramKey) {
      console.error("[processAsyncResponse] DEEPGRAM_API_KEY not set");
      return { success: false, error: "Transcription not configured" };
    }
    if (!xaiKey) {
      console.error("[processAsyncResponse] XAI_API_KEY not set");
      return { success: false, error: "Analysis not configured" };
    }

    const xaiBaseUrl = process.env.AI_PROXY_URL || "https://api.x.ai";
    let transcript = "";
    let authenticityScore = 0;
    let flagCount = 0;
    let analysisDetails: any = null;

    // Step 1: Transcribe with Deepgram
    if (args.videoUrl) {
      try {
        const videoResponse = await fetch(args.videoUrl);
        if (videoResponse.ok) {
          const audioBuffer = await videoResponse.arrayBuffer();

          const dgResponse = await fetch(
            "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&paragraphs=true",
            {
              method: "POST",
              headers: {
                Authorization: `Token ${deepgramKey}`,
                "Content-Type": "audio/webm",
              },
              body: audioBuffer,
            }
          );

          if (dgResponse.ok) {
            const dgResult = await dgResponse.json();
            transcript = dgResult.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
          } else {
            console.error("[processAsyncResponse] Deepgram error:", dgResponse.status);
          }
        }
      } catch (err) {
        console.error("[processAsyncResponse] Transcription failed:", err);
      }
    }

    // Step 2: Analyze with XAI Grok (if we have a transcript)
    if (transcript.length > 10) {
      try {
        const systemPrompt = `You are an interview authenticity analyst. Analyze the following transcript from an async video interview response and score it on 4 dimensions (each 0-25):
- speech: Natural speech patterns vs reading/scripted cadence.
- timing: Natural thinking time and pauses vs rehearsed delivery.
- flow: Conversational engagement vs monologue delivery.
- linguistic: Spoken language patterns vs written/formal language.
Also detect behavioral flags like scripted responses, AI-generated language, or coached answers.
Return ONLY valid JSON: {"speech":20,"timing":18,"flow":15,"linguistic":22,"flags":[{"pattern":"description","severity":"low"}]}`;

        const grokResponse = await fetch(`${xaiBaseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${xaiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "grok-3-fast",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Async interview response transcript:\n\n"${transcript}"` },
            ],
            temperature: 0.3,
          }),
        });

        if (grokResponse.ok) {
          const grokData = await grokResponse.json();
          const rawContent = grokData.choices?.[0]?.message?.content || "";
          const jsonStr = extractJson(rawContent);

          if (jsonStr) {
            const analysis = JSON.parse(jsonStr);
            const clamp = (n: number) => Math.min(25, Math.max(0, n ?? 15));
            const scores = {
              speech: clamp(analysis.speech),
              timing: clamp(analysis.timing),
              flow: clamp(analysis.flow),
              linguistic: clamp(analysis.linguistic),
            };
            authenticityScore = scores.speech + scores.timing + scores.flow + scores.linguistic;
            flagCount = (analysis.flags || []).length;
            analysisDetails = { scores, flags: analysis.flags || [] };
          }
        }
      } catch (err) {
        console.error("[processAsyncResponse] Analysis failed:", err);
      }
    }

    // Step 3: Update the response record
    await ctx.runMutation(internal.mutations.internalUpdateCandidateResponse, {
      responseId: args.responseId,
      transcriptText: transcript || undefined,
      authenticityScore: authenticityScore || undefined,
      flagCount,
      analysisDetails: analysisDetails || undefined,
    });

    // Step 4: Check if all questions answered — send notification
    try {
      const responses = await ctx.runQuery(api.queries.getResponsesByInterview, {
        interviewId: args.interviewId,
      });

      const allAnalyzed = responses.every((r: any) => r.authenticityScore !== undefined);

      if (allAnalyzed && responses.length > 0) {
        const interview = await ctx.runQuery(api.interviews.getById, {
          interviewId: args.interviewId,
        });

        if (interview) {
          const postmarkKey = process.env.POSTMARK_API_KEY;
          if (postmarkKey) {
            const avgScore = Math.round(
              responses.reduce((sum: number, r: any) => sum + (r.authenticityScore || 0), 0) / responses.length
            );
            const siteUrl = process.env.SITE_URL || "https://truevoicehq.com";

            await fetch("https://api.postmarkapp.com/email", {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-Postmark-Server-Token": postmarkKey,
              },
              body: JSON.stringify({
                From: "TrueVoice HQ <hello@truevoicehq.com>",
                To: interview.createdBy ? `hello@truevoicehq.com` : "hello@truevoicehq.com",
                Subject: `[TrueVoice] ${interview.candidateName} completed async interview for ${interview.position}`,
                HtmlBody: `
                  <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto">
                    <h2 style="color:#111827">${interview.candidateName} completed their async interview</h2>
                    <p style="color:#374151">Position: <strong>${interview.position}</strong></p>
                    <p style="color:#374151">${responses.length} questions answered with an average authenticity score of <strong>${avgScore}/100</strong>.</p>
                    <p style="color:#374151">Flags detected: ${responses.reduce((sum: number, r: any) => sum + (r.flagCount || 0), 0)}</p>
                    <div style="margin:24px 0">
                      <a href="${siteUrl}/dashboard" style="background:#111827;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                        Review Responses
                      </a>
                    </div>
                    <p style="font-size:12px;color:#9ca3af">Powered by TrueVoice HQ</p>
                  </div>
                `,
                MessageStream: "outbound",
              }),
            });
          }
        }
      }
    } catch (err) {
      console.error("[processAsyncResponse] Notification check failed:", err);
    }

    return {
      success: true,
      transcript: transcript.slice(0, 100) + (transcript.length > 100 ? "..." : ""),
      authenticityScore,
      flagCount,
    };
  },
});
