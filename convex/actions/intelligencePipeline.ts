"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";

/**
 * Joan's Multi-Agent Intelligence Pipeline
 *
 * Firecrawl → Mitosis recall → OpenAI synthesis → Mitosis store → Cotal register
 *
 * Each stage is fault-tolerant: if a provider is unconfigured or fails,
 * the pipeline continues with whatever data it has.
 */

interface WebPresence {
  linkedinSummary?: string;
  githubSummary?: string;
  personalSites?: string[];
  publications?: string[];
  credentialFlags?: string[];
  rawSkills?: string[];
  experience?: string;
}

interface MemoryContext {
  priorInteractions?: string;
  similarCandidates?: string;
  teamPreferences?: string;
  relevantHistory?: string;
  citedSources?: string[];
}

interface Synthesis {
  summary: string;
  strengths: string[];
  risks: string[];
  customQuestions: { question: string; rationale: string; targetGap: string }[];
  confidenceScore: number;
  recommendation: "advance" | "review" | "reject";
}

const FETCH_TIMEOUT_MS = 30_000;

function fetchWithTimeout(url: string, opts: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// Public wrapper for the re-run button in the UI
export const rerunIntelligencePipeline = action({
  args: {
    candidateId: v.id("hiring_pipeline"),
    briefId: v.id("intelligence_briefs"),
  },
  returns: v.object({
    success: v.boolean(),
    sources: v.array(v.string()),
    recommendation: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return await ctx.runAction(
      internal.actions.intelligencePipeline.runIntelligencePipeline,
      args
    );
  },
});

export const runIntelligencePipeline = internalAction({
  args: {
    candidateId: v.id("hiring_pipeline"),
    briefId: v.id("intelligence_briefs"),
  },
  returns: v.object({
    success: v.boolean(),
    sources: v.array(v.string()),
    recommendation: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const sources: string[] = [];

    try {
      await ctx.runMutation(api.mutations.updateIntelligenceBrief, {
        briefId: args.briefId,
        status: "running",
      });

      // Invalidate any stale pending autopilot item for this candidate
      const existingItem = await ctx.runQuery(api.queries.getAutopilotItemByCandidate, {
        candidateId: args.candidateId,
      });
      if (existingItem && existingItem.status === "pending") {
        await ctx.runMutation(api.mutations.resolveAutopilotItem, {
          itemId: existingItem._id,
          status: "rejected",
          decidedBy: "joan-pipeline-rerun",
        });
      }

      const candidate = await ctx.runQuery(api.queries.getCandidateById, {
        candidateId: args.candidateId,
      });
      if (!candidate) throw new Error("Candidate not found");

      // ── Stage 0: Fetch interview scores ─────────────────────────
      const interviewScores = await ctx.runQuery(api.queries.getInterviewScores, {
        interviewId: candidate.interviewId,
      });
      if (interviewScores) {
        sources.push("interview_scores");
        console.log("[intelligence] Interview scores loaded:", interviewScores.overallScore);
      }

      // ── Stage 1: Firecrawl deep enrichment ──────────────────────
      let webPresence: WebPresence | undefined;
      const firecrawlKey = process.env.FIRECRAWL_API_KEY;

      if (firecrawlKey && (candidate.linkedinUrl || candidate.githubUrl)) {
        try {
          webPresence = await runFirecrawl(
            firecrawlKey,
            candidate.linkedinUrl,
            candidate.githubUrl
          );
          sources.push("firecrawl");
          console.log("[intelligence] Firecrawl complete:", webPresence?.rawSkills?.length ?? 0, "skills found");
        } catch (e) {
          console.warn("[intelligence] Firecrawl failed:", e);
        }
      }

      // Also use any resume text as enrichment
      if (candidate.resumeText) {
        if (!webPresence) webPresence = {};
        webPresence.linkedinSummary = webPresence.linkedinSummary ||
          candidate.resumeText.slice(0, 2000);
        sources.push("resume");
      }

      // ── Stage 2: Mitosis recall (institutional memory) ──────────
      let memoryContext: MemoryContext | undefined;
      const mitosisKey = process.env.MITOSIS_API_KEY;
      const mitosisOffice = process.env.MITOSIS_OFFICE_ID;

      if (mitosisKey && mitosisOffice) {
        try {
          memoryContext = await recallFromMitosis(
            mitosisKey,
            mitosisOffice,
            candidate.candidateName,
            candidate.position,
            candidate.candidateEmail,
            webPresence
          );
          sources.push("mitosis");
          console.log("[intelligence] Mitosis recall complete");
        } catch (e) {
          console.warn("[intelligence] Mitosis recall failed:", e);
        }
      }

      // ── Stage 3: OpenAI synthesis ───────────────────────────────
      let synthesis: Synthesis;
      const openaiKey = process.env.OPENAI_API_KEY;

      if (!openaiKey) {
        throw new Error("OPENAI_API_KEY not configured -- required for synthesis");
      }

      synthesis = await synthesizeWithOpenAI(
        openaiKey,
        candidate,
        webPresence,
        memoryContext,
        interviewScores
      );
      sources.push("openai");
      console.log("[intelligence] OpenAI synthesis:", synthesis.recommendation, synthesis.confidenceScore);

      // ── Stage 4: Mitosis store (remember this assessment) ───────
      if (mitosisKey && mitosisOffice) {
        try {
          await storeInMitosis(
            mitosisKey,
            mitosisOffice,
            candidate,
            synthesis,
            webPresence
          );
          console.log("[intelligence] Mitosis store complete");
        } catch (e) {
          console.warn("[intelligence] Mitosis store failed:", e);
        }
      }

      // ── Stage 5: Cotal presence registration ────────────────────
      let cotalRegistered = false;
      let cotalAgentId: string | undefined;

      try {
        const cotalResult = await registerWithCotal(candidate, synthesis);
        cotalRegistered = cotalResult.registered;
        cotalAgentId = cotalResult.agentId;
        if (cotalRegistered) sources.push("cotal");
        console.log("[intelligence] Cotal registration:", cotalRegistered);
      } catch (e) {
        console.warn("[intelligence] Cotal registration failed:", e);
      }

      // ── Persist results ─────────────────────────────────────────
      const durationMs = Date.now() - startTime;

      await ctx.runMutation(api.mutations.updateIntelligenceBrief, {
        briefId: args.briefId,
        webPresence,
        memoryContext,
        synthesis,
        cotalRegistered,
        cotalAgentId,
        sources,
        pipelineDurationMs: durationMs,
        status: "complete",
      });

      // Also update the candidate record with enrichment data
      if (webPresence) {
        await ctx.runMutation(api.mutations.enrichCandidate, {
          candidateId: args.candidateId,
          linkedinUrl: candidate.linkedinUrl,
          githubUrl: candidate.githubUrl,
          skills: webPresence.rawSkills,
          experience: webPresence.experience,
        });
      }

      // Log Joan's activity
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: candidate.companyId,
        candidateId: args.candidateId,
        action: "enriched_candidate",
        description: `Joan completed intelligence brief for ${candidate.candidateName}: ${synthesis.recommendation} (${synthesis.confidenceScore}/100) via ${sources.join(", ")}`,
        details: {
          sources,
          recommendation: synthesis.recommendation,
          confidenceScore: synthesis.confidenceScore,
          durationMs,
          strengthCount: synthesis.strengths.length,
          riskCount: synthesis.risks.length,
          questionCount: synthesis.customQuestions.length,
        },
        success: true,
      });

      return {
        success: true,
        sources,
        recommendation: synthesis.recommendation,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);

      await ctx.runMutation(api.mutations.updateIntelligenceBrief, {
        briefId: args.briefId,
        sources,
        pipelineDurationMs: durationMs,
        status: "failed",
        errorMessage: message,
      });

      const candidate = await ctx.runQuery(api.queries.getCandidateById, {
        candidateId: args.candidateId,
      });

      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: candidate?.companyId ?? "unknown",
        candidateId: args.candidateId,
        action: "enriched_candidate",
        description: `Joan intelligence pipeline failed for ${candidate?.candidateName ?? "unknown"}: ${message}`,
        success: false,
        errorMessage: message,
      });

      return { success: false, sources, error: message };
    }
  },
});

// ─────────────────────────────────────────────────────────────────
// Firecrawl: deep web presence scan
// ─────────────────────────────────────────────────────────────────

async function runFirecrawl(
  apiKey: string,
  linkedinUrl?: string,
  githubUrl?: string
): Promise<WebPresence> {
  const result: WebPresence = {};

  const scrape = async (url: string): Promise<string> => {
    const resp = await fetchWithTimeout("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 2000,
        timeout: 30000,
      }),
    });
    if (!resp.ok) throw new Error(`Firecrawl ${resp.status}`);
    const data = await resp.json();
    return data.data?.markdown || "";
  };

  if (linkedinUrl) {
    const md = await scrape(linkedinUrl);
    result.linkedinSummary = md.slice(0, 3000);

    const skills: string[] = [];
    const skillMatches = md.match(/Skills?:?\s*([^\n]+)/gi);
    if (skillMatches) {
      skillMatches.forEach((match) => {
        skills.push(
          ...match
            .replace(/Skills?:?\s*/i, "")
            .split(/[,•·]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && s.length < 50)
        );
      });
    }
    result.rawSkills = [...new Set(skills)].slice(0, 20);

    const expMatch = md.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
    if (expMatch) result.experience = `${expMatch[1]}+ years`;
  }

  if (githubUrl) {
    const md = await scrape(githubUrl);
    result.githubSummary = md.slice(0, 2000);

    const languages = md.match(
      /\b(JavaScript|TypeScript|Python|Java|Go|Rust|C\+\+|Ruby|PHP|Swift|Kotlin|C#)\b/gi
    );
    if (languages) {
      const existing = result.rawSkills || [];
      result.rawSkills = [...new Set([...existing, ...languages.map((l) => l.toLowerCase())])];
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// Mitosis: institutional memory recall + store
// ─────────────────────────────────────────────────────────────────

const MITOSIS_BASE = "https://m.mitosislabs.ai";

async function recallFromMitosis(
  apiKey: string,
  officeId: string,
  candidateName: string,
  position: string,
  email: string,
  webPresence?: WebPresence
): Promise<MemoryContext> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const ask = async (query: string): Promise<string> => {
    const resp = await fetchWithTimeout(`${MITOSIS_BASE}/api/v1/offices/${officeId}/cortex/ask`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });
    if (!resp.ok) return "";
    const data = await resp.json();
    const results = data.results || [];
    return results.map((r: { preview: string }) => r.preview).join("\n").slice(0, 2000);
  };

  const [priorInteractions, similarCandidates, teamPreferences] = await Promise.all([
    ask(`Any prior interactions with ${candidateName} or emails from ${email}?`),
    ask(`Past candidates for ${position} role -- outcomes, patterns, what worked?`),
    ask(`Hiring preferences and requirements for ${position} positions`),
  ]);

  let relevantHistory = "";
  if (webPresence?.rawSkills?.length) {
    relevantHistory = await ask(
      `Candidates with skills: ${webPresence.rawSkills.slice(0, 5).join(", ")} -- how did they perform?`
    );
  }

  return {
    priorInteractions: priorInteractions || undefined,
    similarCandidates: similarCandidates || undefined,
    teamPreferences: teamPreferences || undefined,
    relevantHistory: relevantHistory || undefined,
  };
}

async function storeInMitosis(
  apiKey: string,
  officeId: string,
  candidate: { candidateName: string; candidateEmail: string; position: string; companyId: string },
  synthesis: Synthesis,
  webPresence?: WebPresence
): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const memory = [
    `Candidate assessment: ${candidate.candidateName} (${candidate.candidateEmail}) for ${candidate.position}.`,
    `Recommendation: ${synthesis.recommendation} (confidence: ${synthesis.confidenceScore}/100).`,
    `Strengths: ${synthesis.strengths.join("; ")}.`,
    `Risks: ${synthesis.risks.join("; ")}.`,
    webPresence?.rawSkills?.length
      ? `Skills: ${webPresence.rawSkills.join(", ")}.`
      : null,
    webPresence?.experience ? `Experience: ${webPresence.experience}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  await fetchWithTimeout(`${MITOSIS_BASE}/api/v1/offices/${officeId}/cortex/remember`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      text: memory,
      metadata: {
        type: "candidate_assessment",
        candidateName: candidate.candidateName,
        position: candidate.position,
        recommendation: synthesis.recommendation,
        confidenceScore: synthesis.confidenceScore,
        timestamp: new Date().toISOString(),
      },
    }),
  });
}

// ─────────────────────────────────────────────────────────────────
// OpenAI: synthesize intelligence brief
// ─────────────────────────────────────────────────────────────────

interface InterviewScoreData {
  overallScore: number;
  speechScore: number;
  timingScore: number;
  flowScore: number;
  linguisticScore: number;
  engagement: number;
  confidence: number;
  flagCount: number;
  criticalFlags: number;
}

async function synthesizeWithOpenAI(
  apiKey: string,
  candidate: {
    candidateName: string;
    candidateEmail: string;
    position: string;
    resumeText?: string;
    skills?: string[];
    experience?: string;
  },
  webPresence?: WebPresence,
  memoryContext?: MemoryContext,
  interviewScores?: InterviewScoreData | null
): Promise<Synthesis> {
  const contextSections: string[] = [];

  if (interviewScores) {
    const scoreLines = [
      `- Overall Authenticity Score: ${interviewScores.overallScore}/100`,
      `- Speech Patterns: ${interviewScores.speechScore}/100`,
      `- Response Timing: ${interviewScores.timingScore}/100`,
      `- Conversation Flow: ${interviewScores.flowScore}/100`,
      `- Linguistic Analysis: ${interviewScores.linguisticScore}/100`,
      `- Engagement Level: ${interviewScores.engagement}/100`,
      `- Confidence Level: ${interviewScores.confidence}/100`,
      `- Fraud Flags: ${interviewScores.flagCount} total, ${interviewScores.criticalFlags} critical`,
    ];
    contextSections.push(`## TrueVoice Interview Scores (real-time authenticity analysis)\n${scoreLines.join("\n")}`);
  }

  if (webPresence?.linkedinSummary) {
    contextSections.push(`## LinkedIn Profile\n${webPresence.linkedinSummary.slice(0, 1500)}`);
  }
  if (webPresence?.githubSummary) {
    contextSections.push(`## GitHub Profile\n${webPresence.githubSummary.slice(0, 1000)}`);
  }
  if (webPresence?.rawSkills?.length) {
    contextSections.push(`## Skills Detected\n${webPresence.rawSkills.join(", ")}`);
  }
  if (candidate.resumeText) {
    contextSections.push(`## Resume\n${candidate.resumeText.slice(0, 2000)}`);
  }
  if (memoryContext?.priorInteractions) {
    contextSections.push(`## Prior Interactions (from institutional memory)\n${memoryContext.priorInteractions}`);
  }
  if (memoryContext?.similarCandidates) {
    contextSections.push(`## Similar Past Candidates\n${memoryContext.similarCandidates}`);
  }
  if (memoryContext?.teamPreferences) {
    contextSections.push(`## Team Hiring Preferences\n${memoryContext.teamPreferences}`);
  }
  if (memoryContext?.relevantHistory) {
    contextSections.push(`## Relevant Hiring History\n${memoryContext.relevantHistory}`);
  }

  const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Joan, an AI hiring intelligence analyst. Given all available data about a candidate, produce a structured intelligence brief.

Return ONLY valid JSON matching this exact shape:
{
  "summary": "2-3 paragraph candidate assessment",
  "strengths": ["strength 1", "strength 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "customQuestions": [
    {"question": "Interview question targeting a specific gap", "rationale": "Why this question matters", "targetGap": "What gap it addresses"}
  ],
  "confidenceScore": 0-100,
  "recommendation": "advance" | "review" | "reject"
}

Guidelines:
- confidenceScore reflects how much data you have, not just how good the candidate is. Low data = lower confidence regardless of apparent quality.
- recommendation thresholds: advance (strong profile, 70+), review (mixed signals or insufficient data, 40-69), reject (clear misfit, <40).
- customQuestions should target specific gaps between what the role needs and what the candidate's profile shows. Generate 3-5 questions.
- If institutional memory shows patterns about similar candidates, factor those into your assessment.
- Be specific in strengths and risks -- cite evidence from the data, not generic statements.
- INTERVIEW SCORES ARE CRITICAL: If TrueVoice interview scores are provided, weight them heavily. An overall authenticity score below 50 with critical fraud flags is a strong reject signal. Scores above 80 with zero critical flags strongly support advancing. Flag any mismatch between high profile quality and low authenticity scores as a major risk (potential fraud/impersonation).`,
        },
        {
          role: "user",
          content: `Produce an intelligence brief for this candidate:

**Name:** ${candidate.candidateName}
**Email:** ${candidate.candidateEmail}
**Position:** ${candidate.position}

${contextSections.length > 0 ? contextSections.join("\n\n") : "No enrichment data available -- assess based on name/position only and flag low confidence."}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} -- ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("No content returned from OpenAI");

  const parsed = JSON.parse(content);

  return {
    summary: parsed.summary || "No summary generated",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    customQuestions: Array.isArray(parsed.customQuestions)
      ? parsed.customQuestions.map((q: any) => ({
          question: q.question || "",
          rationale: q.rationale || "",
          targetGap: q.targetGap || "",
        }))
      : [],
    confidenceScore: Math.max(0, Math.min(100, parsed.confidenceScore ?? 50)),
    recommendation: ["advance", "review", "reject"].includes(parsed.recommendation)
      ? parsed.recommendation
      : "review",
  };
}

// ─────────────────────────────────────────────────────────────────
// Cotal: agent presence registration
// ─────────────────────────────────────────────────────────────────

async function registerWithCotal(
  candidate: { candidateName: string; position: string },
  synthesis: Synthesis
): Promise<{ registered: boolean; agentId?: string }> {
  const resp = await fetchWithTimeout("https://api.cotal.ai/v1/multicast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "joan-hiring-agent",
      channel: "hiring-updates",
      priority: synthesis.recommendation === "advance" ? "urgent" : "normal",
      payload: {
        event: "candidate_assessed",
        position: candidate.position,
        recommendation: synthesis.recommendation,
        confidenceScore: synthesis.confidenceScore,
      },
      metadata: {
        requires_ack: false,
      },
    }),
  });

  if (!resp.ok) return { registered: false };

  const data = await resp.json();
  return {
    registered: true,
    agentId: data.recipients?.[0],
  };
}
