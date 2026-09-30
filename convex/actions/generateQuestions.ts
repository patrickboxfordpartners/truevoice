"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function extractJson(raw: string): string | null {
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const arrayMatch = stripped.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try { JSON.parse(arrayMatch[0]); return arrayMatch[0]; } catch {}
  }
  const objMatch = stripped.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { JSON.parse(objMatch[0]); return objMatch[0]; } catch {}
  }
  return null;
}

export const generate = action({
  args: {
    position: v.string(),
    jobDescription: v.optional(v.string()),
    companyName: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const xaiKey = process.env.AI_PROXY_KEY || process.env.XAI_API_KEY;
    if (!xaiKey) throw new Error("AI API key not configured");
    const baseUrl = process.env.AI_PROXY_URL || "https://api.x.ai";

    const contextParts: string[] = [`Position: ${args.position}`];
    if (args.companyName) contextParts.push(`Company: ${args.companyName}`);
    if (args.jobDescription) contextParts.push(`Job Description:\n${args.jobDescription}`);

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
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
Each item must have exactly: id (string), text (string), type ("behavioral"|"situational"|"technical"|"authenticity"), suggested_follow_up (string).`,
          },
          { role: "user", content: contextParts.join("\n\n") },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error("AI generation failed");

    const rawContent = data.choices?.[0]?.message?.content || "";
    const jsonStr = extractJson(rawContent);
    if (!jsonStr) throw new Error("Failed to parse AI response");

    const parsed = JSON.parse(jsonStr);
    const questions = Array.isArray(parsed) ? parsed : parsed.questions ?? [];
    if (!Array.isArray(questions) || questions.length === 0) throw new Error("Empty questions array");

    return {
      questions: questions.map((q: any, i: number) => ({
        id: q.id || `q${i + 1}`,
        text: String(q.text || ""),
        type: ["behavioral", "situational", "technical", "authenticity"].includes(q.type) ? q.type : "behavioral",
        suggested_follow_up: String(q.suggested_follow_up || ""),
      })),
    };
  },
});
