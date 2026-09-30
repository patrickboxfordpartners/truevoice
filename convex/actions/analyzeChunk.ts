"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

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

export const analyzeChunk = action({
  args: {
    interviewId: v.string(),
    chunkText: v.string(),
    chunkIndex: v.number(),
    elapsedSeconds: v.number(),
    previousScores: v.optional(v.any()),
    responseDelays: v.optional(v.array(v.object({
      question: v.string(),
      delay: v.number(),
      label: v.string(),
    }))),
    companyId: v.optional(v.string()),
    mode: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const xaiKey = process.env.AI_PROXY_KEY || process.env.XAI_API_KEY;
    if (!xaiKey) throw new Error("XAI_API_KEY not set");
    const xaiBaseUrl = process.env.AI_PROXY_URL || "https://api.x.ai";

    if (!args.chunkText || args.chunkText.length > 5000) {
      throw new Error("Invalid chunk text");
    }

    const chunkTextSafe = args.chunkText
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[^\w\s.,!?'-]/g, "")
      .trim();

    if (!chunkTextSafe) throw new Error("Empty chunk after sanitization");

    const isFieldMode = args.mode === "field";

    const systemPrompt = isFieldMode
      ? `You are a contextual research analyst. Analyze this transcript chunk from a field research session and score it on 4 dimensions (each 0-25):
- context: Environmental richness vs abstract discussion.
- engagement: Participant engagement vs passive describing.
- insights: Implicit pain points, workarounds, friction vs surface-level.
- clarity: Clear expression vs vague communication.
Also detect research flags with types: "insight", "competitor", "environment".
Return ONLY valid JSON: {"context":20,"engagement":18,"insights":15,"clarity":22,"flags":[{"pattern":"description","severity":"low","flag_type":"insight"}]}`
      : `You are an interview authenticity analyst. Analyze the following transcript chunk and score it on 4 dimensions (each 0-25):
- speech: Natural speech patterns vs reading/scripted cadence.
- timing: Natural thinking time based on response delays.
- flow: Conversational engagement vs monologue delivery.
- linguistic: Spoken language patterns vs written/formal language.
Also detect behavioral and coached/AI-generated language flags.
Return ONLY valid JSON: {"speech":20,"timing":18,"flow":15,"linguistic":22,"flags":[{"pattern":"description","severity":"low","flag_type":"behavior"}]}`;

    const userContent = [
      `Elapsed time: ${args.elapsedSeconds}s`,
      `Previous scores: ${JSON.stringify(args.previousScores || {})}`,
      args.responseDelays?.length
        ? `Response timing data: ${JSON.stringify(args.responseDelays.map(d => ({ question: d.question, delay_seconds: d.delay, label: d.label })))}`
        : null,
      `Transcript chunk to analyze: "${chunkTextSafe}"`,
    ].filter(Boolean).join("\n");

    const grokResponse = await fetch(`${xaiBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${xaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-3-fast",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
      }),
    });

    const grokData = await grokResponse.json();
    if (!grokResponse.ok) {
      console.error("[analyzeChunk] Grok error:", grokResponse.status);
      return { scores: { speech: 15, timing: 15, flow: 15, linguistic: 15 }, overall: 60, flags: [] };
    }

    const rawContent = grokData.choices?.[0]?.message?.content || "";
    let analysis: any = {};
    try {
      const jsonStr = extractJson(rawContent);
      if (!jsonStr) throw new Error("No JSON found");
      analysis = JSON.parse(jsonStr);
    } catch {
      analysis = { speech: 15, timing: 15, flow: 15, linguistic: 15, flags: [] };
    }

    const clamp = (n: number) => Math.min(25, Math.max(0, n ?? 15));
    const scores = isFieldMode
      ? { speech: clamp(analysis.context), timing: clamp(analysis.engagement), flow: clamp(analysis.insights), linguistic: clamp(analysis.clarity) }
      : { speech: clamp(analysis.speech), timing: clamp(analysis.timing), flow: clamp(analysis.flow), linguistic: clamp(analysis.linguistic) };

    const overall = scores.speech + scores.timing + scores.flow + scores.linguistic;
    const flags: Array<{ pattern: string; severity: string; flag_type?: string }> = analysis.flags || [];

    await ctx.runMutation(api.interviewData.insertChunk, {
      interviewId: args.interviewId,
      chunkIndex: args.chunkIndex,
      text: chunkTextSafe,
      elapsedSeconds: args.elapsedSeconds,
      speechScore: scores.speech,
      timingScore: scores.timing,
      flowScore: scores.flow,
      linguisticScore: scores.linguistic,
    });

    const mins = `${Math.floor(args.elapsedSeconds / 60)}:${String(args.elapsedSeconds % 60).padStart(2, "0")}`;
    await ctx.runMutation(api.interviewData.insertTimelineEntry, {
      interviewId: args.interviewId,
      minute: mins,
      score: overall,
    });

    if (flags.length > 0) {
      await ctx.runMutation(api.interviewData.insertFlags, {
        interviewId: args.interviewId,
        flags: flags.map(f => ({
          time: mins,
          pattern: f.pattern,
          severity: f.severity || "low",
          flagType: f.flag_type || "behavior",
        })),
      });
    }

    if (args.responseDelays?.length) {
      await ctx.runMutation(api.interviewData.insertDelays, {
        interviewId: args.interviewId,
        delays: args.responseDelays.map(d => ({
          question: d.question,
          delay: d.delay,
          label: d.label,
        })),
      });
    }

    await ctx.runMutation(api.interviews.updateScores, {
      interviewId: args.interviewId,
      latestScores: scores,
    });

    return { scores, overall, flags };
  },
});
