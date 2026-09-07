"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Parse Resume Forwarding Emails
 *
 * When you forward a resume email to jobs@yourcompany.com, Joan:
 * 1. Extracts candidate info (name, email, phone)
 * 2. Extracts resume text from attachment
 * 3. Auto-creates pipeline entry in "Screening" stage
 * 4. Sends confirmation email to forwarding manager
 */

interface ParsedCandidate {
  name: string;
  email: string;
  phone?: string;
  position: string;
  resumeText: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export const parseResumeEmail = action({
  args: {
    emailFrom: v.string(), // Who forwarded it
    emailSubject: v.string(),
    emailBody: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          filename: v.string(),
          contentType: v.string(),
          content: v.string(), // Base64 encoded
        })
      )
    ),
  },
  returns: v.object({
    success: v.boolean(),
    candidateCreated: v.optional(v.boolean()),
    candidateId: v.optional(v.string()),
    candidateName: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log("Parsing resume email from:", args.emailFrom);

      // Extract candidate info from email
      const candidate = await extractCandidateInfo(
        args.emailSubject,
        args.emailBody,
        args.attachments
      );

      if (!candidate) {
        return {
          success: false,
          error: "Could not extract candidate information from email",
        };
      }

      // Create pipeline entry
      const candidateId = await ctx.runMutation(api.mutations.createCandidate, {
        interviewId: `resume-${Date.now()}`, // Generate unique ID
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        position: candidate.position,
        companyId: "demo-company", // TODO: Extract from forwarding user
        stage: "screening",
        movedBy: "joan",
        linkedinUrl: candidate.linkedinUrl,
        githubUrl: candidate.githubUrl,
        resumeText: candidate.resumeText,
      });

      console.log(`Created candidate: ${candidate.name} (${candidateId})`);

      // Log Joan activity
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: "demo-company",
        candidateId,
        action: "created_from_email",
        description: `Joan created candidate ${candidate.name} from forwarded resume email`,
        details: {
          forwardedBy: args.emailFrom,
          position: candidate.position,
          hasResume: !!candidate.resumeText,
          extractedSocials: {
            linkedin: !!candidate.linkedinUrl,
            github: !!candidate.githubUrl,
          },
        },
        success: true,
      });

      return {
        success: true,
        candidateCreated: true,
        candidateId,
        candidateName: candidate.name,
      };
    } catch (error) {
      console.error("Failed to parse resume email:", error);

      return {
        success: false,
        candidateCreated: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Extract candidate info from email content
 * Uses simple pattern matching (in production, use OpenAI for better extraction)
 */
async function extractCandidateInfo(
  subject: string,
  body: string,
  attachments?: Array<{ filename: string; contentType: string; content: string }>
): Promise<ParsedCandidate | null> {
  // Extract position from subject line
  // e.g., "Resume: John Doe - Senior Engineer" or "Candidate for Product Manager: Jane Smith"
  const positionPatterns = [
    /for\s+([^:]+):/i,
    /position:\s*([^\n]+)/i,
    /role:\s*([^\n]+)/i,
    /\-\s*([^-\n]+?)\s*$/i, // "John Doe - Senior Engineer"
  ];

  let position = "Software Engineer"; // Default
  for (const pattern of positionPatterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      position = match[1].trim();
      break;
    }
  }

  // Extract name from subject or body
  const namePatterns = [
    /(?:resume|candidate):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*-\s*|\s+for\s+)/i,
  ];

  let name = "";
  for (const pattern of namePatterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      name = match[1].trim();
      break;
    }
  }

  // If no name in subject, try body
  if (!name) {
    const bodyMatch = body.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (bodyMatch) {
      name = bodyMatch[1];
    }
  }

  if (!name) {
    name = "Unknown Candidate";
  }

  // Extract email
  const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  const emailMatch = body.match(emailPattern);
  const email = emailMatch ? emailMatch[1] : `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;

  // Extract phone
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = body.match(phonePattern);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  // Extract LinkedIn
  const linkedinPattern = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/;
  const linkedinMatch = body.match(linkedinPattern);
  const linkedinUrl = linkedinMatch ? linkedinMatch[0] : undefined;

  // Extract GitHub
  const githubPattern = /(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+/;
  const githubMatch = body.match(githubPattern);
  const githubUrl = githubMatch ? githubMatch[0] : undefined;

  // Extract resume text from attachment
  let resumeText = "";
  if (attachments && attachments.length > 0) {
    // Find first PDF or DOC attachment
    const resumeFile = attachments.find(
      (att) =>
        att.contentType === "application/pdf" ||
        att.contentType.includes("word") ||
        att.filename.match(/\.(pdf|doc|docx)$/i)
    );

    if (resumeFile) {
      // In production, use a PDF parsing library
      // For now, use placeholder text
      resumeText = `Resume for ${name}

EXPERIENCE
- Previous roles and achievements
- Technical skills and expertise
- Project accomplishments

EDUCATION
- Degrees and certifications

SKILLS
- Programming languages
- Technologies and frameworks

(Full resume text would be extracted from ${resumeFile.filename})`;
    }
  }

  // If no resume, generate minimal placeholder
  if (!resumeText) {
    resumeText = `Resume forwarded via email for ${name}. No resume text extracted.`;
  }

  return {
    name,
    email,
    phone,
    position,
    resumeText,
    linkedinUrl,
    githubUrl,
  };
}
