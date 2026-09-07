import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";

const http = httpRouter();

/**
 * AgentMail Webhook Endpoint
 *
 * Receives incoming emails from AgentMail and routes them to candidates
 * Joan analyzes each email and decides where it belongs in the hiring pipeline
 */
http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Verify AgentMail signature (security)
      const signature = request.headers.get("x-agentmail-signature");
      const timestamp = request.headers.get("x-agentmail-timestamp");

      if (!signature || !timestamp) {
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse webhook payload
      const payload = await request.json();

      const {
        messageId,
        threadId,
        from,
        to,
        subject,
        body,
        bodyHtml,
        inReplyTo,
        receivedAt,
        attachments,
      } = payload;

      // Check if this is a resume forwarding email (jobs@, hiring@, careers@)
      const isResumeForwarding = /^(jobs|hiring|careers|resumes)@/i.test(to || "");

      if (isResumeForwarding) {
        // Handle resume forwarding
        const parseResult = await ctx.runAction(api.actions.parseResumeEmail.parseResumeEmail, {
          emailFrom: from,
          emailSubject: subject,
          emailBody: body,
          attachments: attachments || [],
        });

        if (parseResult.success && parseResult.candidateCreated) {
          return new Response(
            JSON.stringify({
              success: true,
              message: `Candidate ${parseResult.candidateName} created from resume`,
              candidateId: parseResult.candidateId,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: parseResult.error || "Failed to parse resume",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // Match email to candidate using Joan's routing logic
      const routing = await routeEmailToCandidate(ctx, from, subject, body);

      if (!routing.candidateId) {
        console.warn("Joan could not route email to candidate:", {
          from,
          subject,
          reason: routing.reason,
        });
      }

      // Store email thread
      await ctx.runMutation(api.mutations.createEmailThread, {
        candidateId: routing.candidateId,
        companyId: routing.companyId,
        from,
        to,
        subject,
        body,
        bodyHtml,
        threadId,
        messageId,
        inReplyTo,
        routingConfidence: routing.confidence,
        routingReason: routing.reason,
        emailType: routing.emailType,
        requiresAction: routing.requiresAction,
        suggestedActionItem: routing.suggestedActionItem,
      });

      // Log Joan's activity
      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId: routing.companyId,
        candidateId: routing.candidateId,
        action: "routed_email",
        description: routing.candidateId
          ? `Joan routed email from ${from} to candidate pipeline`
          : `Joan received email from ${from} but could not match to a candidate`,
        details: {
          from,
          subject,
          confidence: routing.confidence,
          emailType: routing.emailType,
        },
        success: !!routing.candidateId,
      });

      return new Response(JSON.stringify({ success: true, routed: !!routing.candidateId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("AgentMail webhook error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * Joan's email routing logic
 * Matches incoming emails to candidates in the hiring pipeline
 */
async function routeEmailToCandidate(
  ctx: any,
  from: string,
  subject: string,
  body: string
): Promise<{
  candidateId?: string;
  companyId: string;
  confidence: number;
  reason: string;
  emailType?: "scheduling" | "follow_up" | "reference" | "offer" | "rejection" | "question" | "other";
  requiresAction: boolean;
  suggestedActionItem?: string;
}> {
  // Default to first company (in production, extract from subdomain or custom domain)
  const companyId = "default-company";

  // Strategy 1: Direct email match
  // Look for candidate with matching email address
  const allCandidates = await ctx.runQuery(api.queries.getCandidatesByCompany, {
    companyId,
  });

  for (const candidate of allCandidates) {
    if (from.toLowerCase().includes(candidate.candidateEmail.toLowerCase())) {
      return {
        candidateId: candidate._id,
        companyId,
        confidence: 1.0,
        reason: `Email from ${from} matches candidate ${candidate.candidateEmail}`,
        emailType: classifyEmailType(subject, body),
        requiresAction: detectActionRequired(subject, body),
        suggestedActionItem: suggestActionItem(subject, body),
      };
    }
  }

  // Strategy 2: Subject line contains candidate name
  for (const candidate of allCandidates) {
    const nameWords = candidate.candidateName.toLowerCase().split(" ");
    const subjectLower = subject.toLowerCase();

    if (nameWords.every((word) => subjectLower.includes(word))) {
      return {
        candidateId: candidate._id,
        companyId,
        confidence: 0.85,
        reason: `Subject "${subject}" mentions candidate ${candidate.candidateName}`,
        emailType: classifyEmailType(subject, body),
        requiresAction: detectActionRequired(subject, body),
        suggestedActionItem: suggestActionItem(subject, body),
      };
    }
  }

  // Strategy 3: Body contains candidate email or name
  const bodyLower = body.toLowerCase();
  for (const candidate of allCandidates) {
    if (
      bodyLower.includes(candidate.candidateEmail.toLowerCase()) ||
      bodyLower.includes(candidate.candidateName.toLowerCase())
    ) {
      return {
        candidateId: candidate._id,
        companyId,
        confidence: 0.7,
        reason: `Email body mentions candidate ${candidate.candidateName}`,
        emailType: classifyEmailType(subject, body),
        requiresAction: detectActionRequired(subject, body),
        suggestedActionItem: suggestActionItem(subject, body),
      };
    }
  }

  // No match found
  return {
    companyId,
    confidence: 0,
    reason: "Could not match email to any candidate in pipeline",
    emailType: classifyEmailType(subject, body),
    requiresAction: false,
  };
}

/**
 * Classify email type based on content
 */
function classifyEmailType(
  subject: string,
  body: string
): "scheduling" | "follow_up" | "reference" | "offer" | "rejection" | "question" | "other" {
  const combined = `${subject} ${body}`.toLowerCase();

  if (/schedule|calendar|meeting|interview|time|availability/i.test(combined)) {
    return "scheduling";
  }
  if (/reference|recommendation|check|former|previous employer/i.test(combined)) {
    return "reference";
  }
  if (/offer|compensation|salary|start date|onboarding/i.test(combined)) {
    return "offer";
  }
  if (/unfortunately|regret|not moving forward|decided to|other candidates/i.test(combined)) {
    return "rejection";
  }
  if (/\?|question|clarif|wondering|could you|can you/i.test(combined)) {
    return "question";
  }
  if (/following up|checking in|wanted to reach|status|update/i.test(combined)) {
    return "follow_up";
  }

  return "other";
}

/**
 * Detect if email requires action
 */
function detectActionRequired(subject: string, body: string): boolean {
  const combined = `${subject} ${body}`.toLowerCase();

  // Emails that typically need a response
  return /\?|please respond|need|require|urgent|deadline|by when|asap/i.test(combined);
}

/**
 * Suggest action item text based on email content
 */
function suggestActionItem(subject: string, body: string): string | undefined {
  const emailType = classifyEmailType(subject, body);

  switch (emailType) {
    case "scheduling":
      return "Schedule interview time with candidate";
    case "reference":
      return "Complete reference check";
    case "offer":
      return "Prepare and send offer letter";
    case "question":
      return "Respond to candidate question";
    case "follow_up":
      return "Follow up on interview status";
    default:
      return undefined;
  }
}

/**
 * ATS Webhook Endpoint
 *
 * Receives candidate data from external ATS systems (Greenhouse, Lever, etc.)
 * and creates pipeline entries for Joan to process.
 *
 * Expected payload:
 * {
 *   candidateName: string,
 *   candidateEmail: string,
 *   position: string,
 *   companyId: string,
 *   source?: string,          // "greenhouse", "lever", etc.
 *   linkedinUrl?: string,
 *   githubUrl?: string,
 *   resumeText?: string,
 *   resumeUrl?: string,
 *   externalId?: string        // ATS-side candidate ID
 * }
 */
http.route({
  path: "/ats/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const authHeader = request.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Missing or invalid Authorization header" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const payload = await request.json();

      const { candidateName, candidateEmail, position, companyId } = payload;
      if (!candidateName || !candidateEmail || !position || !companyId) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: candidateName, candidateEmail, position, companyId" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const interviewId = payload.externalId || `ats-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const candidateId = await ctx.runMutation(api.mutations.createCandidate, {
        interviewId,
        candidateName,
        candidateEmail,
        position,
        companyId,
        stage: "screening",
        movedBy: "joan",
        linkedinUrl: payload.linkedinUrl,
        githubUrl: payload.githubUrl,
        resumeText: payload.resumeText,
        resumeUrl: payload.resumeUrl,
      });

      await ctx.runMutation(api.mutations.logJoanActivity, {
        companyId,
        candidateId,
        action: "created_from_email",
        description: `Joan imported ${candidateName} from ${payload.source || "ATS"} webhook for ${position}`,
        details: {
          source: payload.source,
          externalId: payload.externalId,
        },
        success: true,
      });

      return new Response(
        JSON.stringify({ success: true, candidateId, interviewId }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("ATS webhook error:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// Register static hosting routes (serves built React app)
registerStaticRoutes(http, components.staticHosting);

export default http;
