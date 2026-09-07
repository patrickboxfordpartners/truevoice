"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Joan's Firecrawl Candidate Enrichment Action
 *
 * Scrapes candidate LinkedIn/GitHub profiles to enrich hiring pipeline with:
 * - Skills and technologies
 * - Years of experience
 * - Notable projects
 * - Education and certifications
 *
 * Uses Firecrawl for reliable, structured data extraction
 */

interface EnrichmentResult {
  skills: string[];
  experience: string;
  linkedinData?: {
    headline: string;
    summary: string;
    currentRole?: string;
  };
  githubData?: {
    bio: string;
    topLanguages: string[];
    notableRepos: string[];
  };
}

export const enrichCandidate = action({
  args: {
    candidateId: v.id("hiring_pipeline"),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    enriched: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get Firecrawl API key from environment
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        throw new Error("FIRECRAWL_API_KEY not configured in Convex environment variables");
      }

      // Get candidate details
      const candidate = await ctx.runQuery(api.queries.getCandidateById, {
        candidateId: args.candidateId,
      });

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      let enrichmentData: EnrichmentResult = {
        skills: [],
        experience: "Unknown",
      };

      let scrapedAny = false;

      // Scrape LinkedIn if URL provided
      if (args.linkedinUrl) {
        try {
          const linkedinData = await scrapeWithFirecrawl(apiKey, args.linkedinUrl, "linkedin");
          enrichmentData = {
            ...enrichmentData,
            ...extractLinkedInData(linkedinData),
          };
          scrapedAny = true;
        } catch (error) {
          console.warn("Failed to scrape LinkedIn:", error);
        }
      }

      // Scrape GitHub if URL provided
      if (args.githubUrl) {
        try {
          const githubData = await scrapeWithFirecrawl(apiKey, args.githubUrl, "github");
          enrichmentData = {
            ...enrichmentData,
            ...extractGitHubData(githubData),
          };
          scrapedAny = true;
        } catch (error) {
          console.warn("Failed to scrape GitHub:", error);
        }
      }

      if (!scrapedAny) {
        return {
          success: true,
          enriched: false,
          error: "No valid URLs provided for enrichment",
        };
      }

      // Update candidate with enriched data
      await ctx.runMutation(api.mutations.enrichCandidate, {
        candidateId: args.candidateId,
        linkedinUrl: args.linkedinUrl,
        githubUrl: args.githubUrl,
        skills: enrichmentData.skills.length > 0 ? enrichmentData.skills : undefined,
        experience: enrichmentData.experience,
      });

      // Log Joan's activity
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: candidate.companyId,
        candidateId: args.candidateId,
        action: "enriched_candidate",
        description: `Joan enriched ${candidate.candidateName}'s profile with ${enrichmentData.skills.length} skills from ${args.linkedinUrl ? "LinkedIn" : ""}${args.linkedinUrl && args.githubUrl ? " and " : ""}${args.githubUrl ? "GitHub" : ""}`,
        details: {
          skillsFound: enrichmentData.skills.length,
          sources: [args.linkedinUrl && "linkedin", args.githubUrl && "github"].filter(Boolean),
        },
        success: true,
      });

      return { success: true, enriched: true };
    } catch (error) {
      console.error("Failed to enrich candidate:", error);

      // Log failure
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: "unknown",
        candidateId: args.candidateId,
        action: "enriched_candidate",
        description: `Joan failed to enrich candidate: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        enriched: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Call Firecrawl API to scrape a URL
 */
async function scrapeWithFirecrawl(
  apiKey: string,
  url: string,
  platform: "linkedin" | "github"
): Promise<any> {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html"],
      onlyMainContent: true,
      waitFor: 2000, // Wait for JS to render
      timeout: 30000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Extract structured data from LinkedIn scrape
 */
function extractLinkedInData(scrapedData: any): Partial<EnrichmentResult> {
  const markdown = scrapedData.data?.markdown || "";
  const html = scrapedData.data?.html || "";

  // Extract skills (LinkedIn typically lists them)
  const skills: string[] = [];
  const skillMatches = markdown.match(/Skills?:?\s*([^\n]+)/gi);
  if (skillMatches) {
    skillMatches.forEach((match) => {
      const extracted = match
        .replace(/Skills?:?\s*/i, "")
        .split(/[,•·]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length < 50);
      skills.push(...extracted);
    });
  }

  // Extract experience summary
  let experience = "Unknown";
  const expMatch = markdown.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
  if (expMatch) {
    experience = `${expMatch[1]}+ years`;
  }

  // Extract headline/summary
  const lines = markdown.split("\n").filter((l) => l.trim());
  const headline = lines[1] || ""; // Usually line 2 after name
  const summary = lines.slice(2, 5).join(" ").substring(0, 200);

  return {
    skills: [...new Set(skills)].slice(0, 15), // Dedupe and limit
    experience,
    linkedinData: {
      headline,
      summary,
    },
  };
}

/**
 * Extract structured data from GitHub scrape
 */
function extractGitHubData(scrapedData: any): Partial<EnrichmentResult> {
  const markdown = scrapedData.data?.markdown || "";

  // Extract programming languages from repo list
  const languages: string[] = [];
  const langMatches = markdown.match(/\b(JavaScript|TypeScript|Python|Java|Go|Rust|C\+\+|Ruby|PHP|Swift|Kotlin)\b/gi);
  if (langMatches) {
    languages.push(...langMatches.map((l) => l.toLowerCase()));
  }

  // Extract bio
  const bioMatch = markdown.match(/Bio:?\s*([^\n]+)/i);
  const bio = bioMatch ? bioMatch[1].trim() : "";

  // Extract repo names (lines starting with repo icon or link pattern)
  const repoMatches = markdown.match(/(?:^|\n)[\s*]*([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/g);
  const repos = repoMatches
    ? repoMatches.map((r) => r.trim()).slice(0, 10)
    : [];

  return {
    skills: [...new Set(languages)].slice(0, 10),
    githubData: {
      bio,
      topLanguages: [...new Set(languages)].slice(0, 5),
      notableRepos: repos,
    },
  };
}
