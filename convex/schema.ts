import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Schema for TrueVoice HQ + Joan AI Coordinator
 *
 * Supports:
 * - Joan: AI hiring coordinator (action items, email routing, pipeline management)
 * - Real-time collaboration: multi-viewer dashboards, shared notes, live scores
 */

export default defineSchema({
  // ─────────────────────────────────────────────────────────────────
  // HIRING PIPELINE (Joan's Core Data)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Candidates moving through hiring stages
   * Joan updates stages based on action completion + email signals
   */
  hiring_pipeline: defineTable({
    // Identity
    interviewId: v.string(), // Links to Supabase interviews.id
    candidateName: v.string(),
    candidateEmail: v.string(),
    position: v.string(),
    companyId: v.string(), // Links to Supabase companies.id

    // Pipeline state
    stage: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("final"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected")
    ),
    previousStage: v.optional(v.string()),
    stageChangedAt: v.number(), // Unix timestamp
    stageChangedBy: v.union(
      v.literal("joan"), // AI agent moved them
      v.literal("manual") // User dragged them
    ),

    // Enrichment data (from Firecrawl)
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    experience: v.optional(v.string()), // Years or role summary
    lastEnriched: v.optional(v.number()),

    // Social media profiles
    twitterUrl: v.optional(v.string()),
    mediumUrl: v.optional(v.string()),
    substackUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),

    // Resume
    resumeUrl: v.optional(v.string()), // PDF/DOC file URL (Supabase Storage)
    resumeText: v.optional(v.string()), // Extracted text for AI analysis

    // Status
    overallScore: v.optional(v.number()), // 0-100 authenticity score
    flagCount: v.number(), // Number of fraud flags
    actionItemsComplete: v.number(),
    actionItemsTotal: v.number(),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_stage", ["stage"])
    .index("by_interview", ["interviewId"])
    .index("by_email", ["candidateEmail"]),

  // ─────────────────────────────────────────────────────────────────
  // ACTION ITEMS (Joan extracts from transcripts via OpenAI)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Tasks extracted from interview transcripts
   * Joan monitors these for deadline reminders
   */
  action_items: defineTable({
    // Ownership
    interviewId: v.string(),
    candidateId: v.optional(v.string()), // hiring_pipeline._id (optional - may not be in pipeline yet)
    companyId: v.string(),
    assignedTo: v.optional(v.string()), // profile_id from Supabase

    // Content
    title: v.string(), // "Reference check with John Doe"
    description: v.optional(v.string()),
    type: v.union(
      v.literal("reference_check"),
      v.literal("follow_up"),
      v.literal("decision"),
      v.literal("documentation"),
      v.literal("other")
    ),

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),

    // Deadlines
    dueDate: v.optional(v.number()),
    reminderSent: v.boolean(),
    reminderSentAt: v.optional(v.number()),

    // AI extraction metadata
    extractedBy: v.literal("joan"),
    extractedAt: v.number(),
    confidence: v.number(), // 0-1 confidence from OpenAI
    transcriptTimestamp: v.optional(v.string()), // When in interview this was mentioned

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"])
    .index("by_company", ["companyId"]),

  // ─────────────────────────────────────────────────────────────────
  // EMAIL THREADS (AgentMail routes to candidates)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Email conversations routed by Joan
   * AgentMail webhooks create these, Joan enriches with context
   */
  email_threads: defineTable({
    // Routing
    candidateId: v.optional(v.string()), // hiring_pipeline._id (Joan matches this)
    companyId: v.string(),

    // Email data
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    bodyHtml: v.optional(v.string()),

    // Thread management
    threadId: v.string(), // AgentMail thread ID
    messageId: v.string(), // Unique message ID
    inReplyTo: v.optional(v.string()),

    // Joan's routing decision
    routedBy: v.literal("joan"),
    routingConfidence: v.number(), // 0-1 confidence in candidate match
    routingReason: v.string(), // "Email from john@acme.com matches candidate email"

    // Classification (Joan's analysis)
    emailType: v.optional(v.union(
      v.literal("scheduling"),
      v.literal("follow_up"),
      v.literal("reference"),
      v.literal("offer"),
      v.literal("rejection"),
      v.literal("question"),
      v.literal("other")
    )),
    requiresAction: v.boolean(),
    suggestedActionItem: v.optional(v.string()), // Joan can auto-create action items

    // Status
    read: v.boolean(),
    replied: v.boolean(),
    repliedAt: v.optional(v.number()),

    // Metadata
    receivedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_thread", ["threadId"])
    .index("by_company", ["companyId"])
    .index("by_received", ["receivedAt"]),

  // ─────────────────────────────────────────────────────────────────
  // LIVE SESSIONS (Real-time collaboration)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Tracks who's watching interviews in real-time
   * Powers presence indicators and collaborative viewing
   */
  live_sessions: defineTable({
    // Session
    interviewId: v.string(), // Supabase interviews.id
    userId: v.string(), // Supabase profiles.id
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    companyId: v.string(),

    // Presence
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("disconnected")
    ),
    lastHeartbeat: v.number(), // Unix timestamp

    // Metadata
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
  })
    .index("by_interview", ["interviewId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_heartbeat", ["lastHeartbeat"]),

  // ─────────────────────────────────────────────────────────────────
  // SHARED NOTES (Collaborative annotations)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Notes that multiple interviewers can see and edit in real-time
   * Supports @mentions and threading
   */
  shared_notes: defineTable({
    // Ownership
    interviewId: v.string(),
    authorId: v.string(), // Supabase profiles.id
    authorName: v.string(),
    companyId: v.string(),

    // Content
    content: v.string(),
    type: v.union(
      v.literal("note"),
      v.literal("flag"),
      v.literal("question"),
      v.literal("decision")
    ),

    // Threading
    parentNoteId: v.optional(v.id("shared_notes")), // Replies

    // Mentions
    mentions: v.array(v.string()), // userId[]

    // Reactions
    reactions: v.optional(v.object({
      thumbsUp: v.number(),
      eyes: v.number(),
      warning: v.number(),
    })),

    // Timestamp linking
    transcriptTimestamp: v.optional(v.string()), // "12:34" in interview
    videoTimestamp: v.optional(v.number()), // Seconds into recording

    // Status
    pinned: v.boolean(),
    resolved: v.boolean(),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_interview", ["interviewId"])
    .index("by_author", ["authorId"])
    .index("by_type", ["type"])
    .index("by_parent", ["parentNoteId"]),

  // ─────────────────────────────────────────────────────────────────
  // INTERVIEW SCORES (Real-time authenticity scores)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Live-updating authenticity scores during interviews
   * Supports real-time dashboard gauges
   */
  interview_scores: defineTable({
    // Identity
    interviewId: v.string(),
    candidateId: v.optional(v.string()), // hiring_pipeline._id
    companyId: v.string(),

    // Scores (0-100)
    overallScore: v.number(),
    speechScore: v.number(), // Voice pattern analysis
    timingScore: v.number(), // Response delay patterns
    flowScore: v.number(), // Natural conversation flow
    linguisticScore: v.number(), // Language complexity

    // Confidence metrics
    engagement: v.number(), // 0-100
    confidence: v.number(), // 0-100 (candidate's confidence, not our confidence)

    // Fraud indicators
    flagCount: v.number(),
    criticalFlags: v.number(),

    // Update metadata
    lastUpdated: v.number(),
    updateSource: v.union(
      v.literal("realtime"), // Live analysis during interview
      v.literal("batch"), // Post-interview processing
      v.literal("manual") // Admin override
    ),

    // Metadata
    createdAt: v.number(),
  })
    .index("by_interview", ["interviewId"])
    .index("by_candidate", ["candidateId"])
    .index("by_company", ["companyId"])
    .index("by_overall_score", ["overallScore"]),

  // ─────────────────────────────────────────────────────────────────
  // JOAN ACTIVITY LOG (Audit trail)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Everything Joan does for transparency and debugging
   * Users can see "Joan moved candidate X to Final Round"
   */
  joan_activity: defineTable({
    // Context
    companyId: v.string(),
    interviewId: v.optional(v.string()),
    candidateId: v.optional(v.string()),

    // Activity
    action: v.union(
      v.literal("extracted_action_items"),
      v.literal("routed_email"),
      v.literal("moved_pipeline_stage"),
      v.literal("sent_reminder"),
      v.literal("sent_status_email"),
      v.literal("created_from_email"),
      v.literal("enriched_candidate"),
      v.literal("flagged_risk"),
      v.literal("created_note")
    ),
    description: v.string(), // Human-readable: "Joan extracted 3 action items from interview"

    // Details (flexible JSON)
    details: v.optional(v.any()),

    // Outcome
    success: v.boolean(),
    errorMessage: v.optional(v.string()),

    // Metadata
    timestamp: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_interview", ["interviewId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),

  // ─────────────────────────────────────────────────────────────────
  // ASYNC INTERVIEWS (Pre-recorded question system)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Question bank for async interviews
   * AI-voiced questions read by ElevenLabs
   */
  interview_questions: defineTable({
    // Content
    text: v.string(), // Question text
    audioUrl: v.optional(v.string()), // ElevenLabs generated MP3
    position: v.number(), // Order in interview

    // Classification
    category: v.union(
      v.literal("behavioral"),
      v.literal("technical"),
      v.literal("culture-fit"),
      v.literal("situational"),
      v.literal("general")
    ),

    // Company ownership
    companyId: v.string(), // Company-specific questions

    // Metadata
    isActive: v.boolean(), // Can be toggled on/off
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_position", ["position"])
    .index("by_category", ["category"])
    .index("by_company_active", ["companyId", "isActive"]),

  /**
   * Candidate responses to async interview questions
   * Video recordings analyzed for authenticity
   */
  candidate_responses: defineTable({
    // Links
    interviewId: v.string(), // Supabase interviews.id
    questionId: v.id("interview_questions"),
    candidateId: v.string(), // hiring_pipeline._id
    companyId: v.string(),

    // Response data
    videoUrl: v.optional(v.string()), // Recorded response (Supabase Storage)
    transcriptText: v.optional(v.string()), // From Deepgram

    // Analysis
    authenticityScore: v.optional(v.number()), // 0-100
    flagCount: v.optional(v.number()),
    analysisDetails: v.optional(v.any()), // XAI Grok analysis results

    // Metadata
    timestamp: v.number(),
    duration: v.optional(v.number()), // Response duration in seconds
    createdAt: v.number(),
  })
    .index("by_interview", ["interviewId"])
    .index("by_question", ["questionId"])
    .index("by_candidate", ["candidateId"])
    .index("by_company", ["companyId"])
    .index("by_interview_question", ["interviewId", "questionId"]),

  // ─────────────────────────────────────────────────────────────────
  // PEER REVIEWS (Manager-to-Manager)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Peer reviews for candidates
   * Hiring managers can request reviews from other managers for second opinions
   */
  peer_reviews: defineTable({
    // Ownership
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    requestedBy: v.string(), // User ID of requesting manager
    requestedByName: v.string(), // Display name
    reviewerId: v.string(), // User ID of reviewer
    reviewerName: v.string(), // Display name

    // Review content
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("declined")
    ),

    // Assessment
    recommendation: v.optional(
      v.union(
        v.literal("strong_hire"),
        v.literal("hire"),
        v.literal("no_hire"),
        v.literal("strong_no_hire")
      )
    ),
    confidence: v.optional(v.number()), // 0-100

    // Detailed feedback
    strengths: v.optional(v.array(v.string())),
    concerns: v.optional(v.array(v.string())),
    additionalInsights: v.optional(v.string()),
    agreeWithOriginal: v.optional(v.boolean()), // Do they agree with the requesting manager's assessment?

    // Metadata
    requestedAt: v.number(),
    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_company", ["companyId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_status", ["status"])
    .index("by_candidate_status", ["candidateId", "status"]),

  // ─────────────────────────────────────────────────────────────────
  // INTELLIGENCE BRIEFS (Multi-agent candidate analysis)
  // ─────────────────────────────────────────────────────────────────

  intelligence_briefs: defineTable({
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),

    // Firecrawl: deep web presence scan
    webPresence: v.optional(v.object({
      linkedinSummary: v.optional(v.string()),
      githubSummary: v.optional(v.string()),
      personalSites: v.optional(v.array(v.string())),
      publications: v.optional(v.array(v.string())),
      credentialFlags: v.optional(v.array(v.string())),
      rawSkills: v.optional(v.array(v.string())),
      experience: v.optional(v.string()),
    })),

    // Mitosis: institutional memory context
    memoryContext: v.optional(v.object({
      priorInteractions: v.optional(v.string()),
      similarCandidates: v.optional(v.string()),
      teamPreferences: v.optional(v.string()),
      relevantHistory: v.optional(v.string()),
      citedSources: v.optional(v.array(v.string())),
    })),

    // OpenAI: synthesized intelligence brief
    synthesis: v.object({
      summary: v.string(),
      strengths: v.array(v.string()),
      risks: v.array(v.string()),
      customQuestions: v.array(v.object({
        question: v.string(),
        rationale: v.string(),
        targetGap: v.string(),
      })),
      confidenceScore: v.number(),
      recommendation: v.union(
        v.literal("advance"),
        v.literal("review"),
        v.literal("reject")
      ),
    }),

    // Cotal: agent presence registration
    cotalRegistered: v.boolean(),
    cotalAgentId: v.optional(v.string()),

    // Pipeline metadata
    sources: v.array(v.string()),
    pipelineDurationMs: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_company", ["companyId"])
    .index("by_status", ["status"]),

  // ─────────────────────────────────────────────────────────────────
  // AUTOPILOT QUEUE (Joan's pending recommendations)
  // ─────────────────────────────────────────────────────────────────

  autopilot_queue: defineTable({
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    briefId: v.id("intelligence_briefs"),

    recommendation: v.union(
      v.literal("advance"),
      v.literal("review"),
      v.literal("reject")
    ),
    confidenceScore: v.number(),
    evidenceSummary: v.string(),

    // Draft email for rejections
    draftEmailSubject: v.optional(v.string()),
    draftEmailBody: v.optional(v.string()),

    // Human decision
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("modified")
    ),
    decidedBy: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
    modifiedAction: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_candidate", ["candidateId"])
    .index("by_status", ["status"])
    .index("by_company_status", ["companyId", "status"]),

  // ─────────────────────────────────────────────────────────────────
  // JOAN SETTINGS (Per-company configuration)
  // ─────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────
  // SHARED BRIEFS (Public intelligence brief links)
  // ─────────────────────────────────────────────────────────────────

  shared_briefs: defineTable({
    briefId: v.id("intelligence_briefs"),
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    token: v.string(),
    candidateName: v.string(),
    position: v.string(),
    synthesis: v.object({
      summary: v.string(),
      strengths: v.array(v.string()),
      risks: v.array(v.string()),
      customQuestions: v.array(v.object({
        question: v.string(),
        rationale: v.string(),
        targetGap: v.string(),
      })),
      confidenceScore: v.number(),
      recommendation: v.union(
        v.literal("advance"),
        v.literal("review"),
        v.literal("reject")
      ),
    }),
    webPresence: v.optional(v.object({
      linkedinSummary: v.optional(v.string()),
      githubSummary: v.optional(v.string()),
      rawSkills: v.optional(v.array(v.string())),
      experience: v.optional(v.string()),
    })),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_brief", ["briefId"])
    .index("by_company", ["companyId"]),

  email_templates: defineTable({
    companyId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("advance"),
      v.literal("reject"),
      v.literal("invitation"),
      v.literal("reminder"),
      v.literal("followup"),
      v.literal("custom")
    ),
    subject: v.string(),
    body: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_type", ["companyId", "type"]),

  stage_rules: defineTable({
    companyId: v.string(),
    name: v.string(),
    fromStage: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("final"),
      v.literal("offer"),
      v.literal("any")
    ),
    toStage: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("final"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected")
    ),
    conditions: v.object({
      minScore: v.optional(v.number()),
      allActionItemsComplete: v.optional(v.boolean()),
      briefComplete: v.optional(v.boolean()),
      minConfidence: v.optional(v.number()),
      recommendation: v.optional(v.union(
        v.literal("advance"),
        v.literal("review"),
        v.literal("reject")
      )),
    }),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_active", ["companyId", "isActive"]),

  candidate_notes: defineTable({
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    authorName: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("note"),
      v.literal("flag"),
      v.literal("question"),
      v.literal("decision")
    ),
    isPinned: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_company", ["companyId"]),

  candidate_tags: defineTable({
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    tag: v.string(),
    color: v.string(),
    addedBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_company", ["companyId"])
    .index("by_tag", ["tag"]),

  interview_feedback: defineTable({
    candidateId: v.id("hiring_pipeline"),
    companyId: v.string(),
    interviewerId: v.string(),
    interviewerName: v.string(),
    interviewType: v.union(
      v.literal("screening"),
      v.literal("technical"),
      v.literal("behavioral"),
      v.literal("final"),
      v.literal("culture")
    ),
    recommendation: v.union(
      v.literal("strong_hire"),
      v.literal("hire"),
      v.literal("no_hire"),
      v.literal("strong_no_hire")
    ),
    scores: v.object({
      technical: v.optional(v.number()),
      communication: v.optional(v.number()),
      problemSolving: v.optional(v.number()),
      cultureFit: v.optional(v.number()),
      leadership: v.optional(v.number()),
    }),
    strengths: v.array(v.string()),
    concerns: v.array(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_company", ["companyId"])
    .index("by_interviewer", ["interviewerId"]),

  joan_settings: defineTable({
    companyId: v.string(),
    companyName: v.optional(v.string()),
    autoRouting: v.boolean(),
    autoActionItems: v.boolean(),
    autoStageMovement: v.boolean(),
    reminderTiming: v.union(
      v.literal("immediate"),
      v.literal("1hour"),
      v.literal("3hours"),
      v.literal("1day")
    ),
    notificationPreference: v.union(
      v.literal("all"),
      v.literal("important"),
      v.literal("none")
    ),
    advanceThreshold: v.optional(v.number()),
    rejectThreshold: v.optional(v.number()),
    slackWebhookUrl: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"]),
});
