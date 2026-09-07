import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed mutation for Joan hackathon demo
 *
 * Populates Convex tables with realistic demo data:
 * - 10 candidates across all pipeline stages
 * - 20 action items with varying statuses
 * - 8 email threads routed by Joan
 * - Interview scores for authenticity analysis
 * - Joan activity audit trail
 *
 * Run once: `npx convex run seedData:seed '{"companyId":"demo-company"}'`
 */

export const seed = mutation({
  args: {
    companyId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    candidatesCreated: v.number(),
    actionItemsCreated: v.number(),
    emailThreadsCreated: v.number(),
    scoresCreated: v.number(),
    activitiesCreated: v.number(),
  }),
  handler: async (ctx, args) => {
    const { companyId } = args;
    const now = Date.now();

    console.log("🌱 Seeding demo data for company:", companyId);

    // ─────────────────────────────────────────────────────────────────
    // 1. CREATE CANDIDATES (10 across all stages)
    // ─────────────────────────────────────────────────────────────────

    const candidates = [
      {
        name: "Sarah Chen",
        email: "sarah.chen@techcorp.com",
        position: "Senior Full Stack Engineer",
        stage: "screening" as const,
        overallScore: 87,
        flagCount: 0,
        linkedinUrl: "https://linkedin.com/in/sarahchen",
        githubUrl: "https://github.com/sarahchen",
        twitterUrl: "https://twitter.com/sarahchen",
        resumeText: `SARAH CHEN
Senior Full Stack Engineer

EXPERIENCE
Google | Senior Software Engineer | 2020-2024
- Led React and Node.js development for Google Cloud Console
- Built real-time collaborative features serving 1M+ users
- Mentored 5 junior engineers

Meta | Software Engineer | 2018-2020
- Developed React Native components for Instagram
- Optimized rendering performance by 40%

SKILLS
React, TypeScript, Node.js, Python, AWS, Docker

EDUCATION
Stanford University | B.S. Computer Science | 2018`,
      },
      {
        name: "Marcus Johnson",
        email: "marcus.j@startupco.io",
        position: "Product Manager",
        stage: "screening" as const,
        overallScore: 92,
        flagCount: 0,
        linkedinUrl: "https://linkedin.com/in/marcusjohnson",
        mediumUrl: "https://medium.com/@marcusj",
        substackUrl: "https://marcusjohnson.substack.com",
        resumeText: `MARCUS JOHNSON
Product Manager

EXPERIENCE
Stripe | Senior Product Manager | 2021-Present
- Led payments infrastructure roadmap ($2B volume)
- Shipped 15+ features with 95% satisfaction
- Managed cross-functional team of 12

Uber | Product Manager | 2019-2021
- Launched driver incentive program (20% retention increase)
- Led A/B testing framework adoption

EDUCATION
UC Berkeley | MBA | 2019
MIT | B.S. Computer Science | 2017`,
      },
      {
        name: "Elena Rodriguez",
        email: "elena.r@designstudio.com",
        position: "Senior Frontend Engineer",
        stage: "technical" as const,
        overallScore: 78,
        flagCount: 1,
        linkedinUrl: "https://linkedin.com/in/elenarodriguez",
        githubUrl: "https://github.com/elenarodriguez",
        instagramUrl: "https://instagram.com/elenardesign",
        resumeText: `ELENA RODRIGUEZ
Senior Frontend Engineer

EXPERIENCE
Figma | Frontend Engineer | 2022-Present
- Built real-time collaboration features
- Contributed to design system (used by 50+ teams)

Airbnb | Frontend Engineer | 2020-2022
- Developed React components for host dashboard
- Improved accessibility (WCAG 2.1 AA compliance)

SKILLS
React, Vue, TypeScript, CSS, Figma, Storybook

EDUCATION
Georgia Tech | B.S. Computer Science | 2020`,
      },
      {
        name: "David Kim",
        email: "david.kim@bigcorp.com",
        position: "Engineering Manager",
        stage: "technical" as const,
        overallScore: 95,
        flagCount: 0,
        linkedinUrl: "https://linkedin.com/in/davidkim",
        githubUrl: "https://github.com/davidkim",
        resumeText: `DAVID KIM
Engineering Manager

EXPERIENCE
Amazon | Engineering Manager | 2021-Present
- Lead team of 12 engineers building AWS Lambda infrastructure
- Reduced deployment times by 60% through CI/CD improvements
- Managed $5M annual budget

Microsoft | Senior Engineer | 2018-2021
- Built distributed systems for Azure services
- Mentored 8 engineers to senior level

SKILLS
Leadership, System Design, Kubernetes, Go, Python

EDUCATION
Carnegie Mellon | M.S. Computer Science | 2018
UC Berkeley | B.S. Computer Science | 2016`,
      },
      {
        name: "Priya Patel",
        email: "priya.patel@consulting.com",
        position: "Senior Backend Engineer",
        stage: "technical" as const,
        overallScore: 88,
        flagCount: 0,
        linkedinUrl: "https://linkedin.com/in/priyapatel",
        githubUrl: "https://github.com/priya-patel",
        resumeText: `PRIYA PATEL
Senior Backend Engineer

EXPERIENCE
Databricks | Senior Backend Engineer | 2022-Present
- Built real-time data processing pipelines (100TB+/day)
- Designed microservices architecture serving 10K+ customers
- Led migration from monolith to event-driven architecture

Uber | Backend Engineer | 2019-2022
- Developed payment processing systems ($1B+ volume)
- Optimized database queries (50% latency reduction)

SKILLS
Python, Go, Kubernetes, PostgreSQL, Kafka, Redis

EDUCATION
MIT | M.S. Computer Science | 2019
IIT Delhi | B.Tech Computer Science | 2017`,
      },
      {
        name: "Alex Thompson",
        email: "alex.t@freelance.dev",
        position: "Full Stack Engineer",
        stage: "final" as const,
        overallScore: 65,
        flagCount: 3,
        linkedinUrl: "https://linkedin.com/in/alexthompson",
        githubUrl: "https://github.com/alexthompson",
        resumeText: `ALEX THOMPSON
Full Stack Engineer

EXPERIENCE
Freelance Developer | 2020-Present
- Built web applications for various clients
- Worked with React, Node.js, and MongoDB
- Projects range from e-commerce to SaaS

Startup Co | Full Stack Engineer | 2018-2020
- Developed features for MVP product
- Worked across frontend and backend

SKILLS
React, Node.js, MongoDB, Docker

EDUCATION
Code Academy | Full Stack Bootcamp | 2018`,
      },
      {
        name: "Lisa Martinez",
        email: "lisa.martinez@saascompany.com",
        position: "Senior DevOps Engineer",
        stage: "final" as const,
        overallScore: 91,
        flagCount: 0,
        linkedinUrl: "https://linkedin.com/in/lisamartinez",
        githubUrl: "https://github.com/lisamartinez",
        resumeText: `LISA MARTINEZ
Senior DevOps Engineer

EXPERIENCE
Netflix | Senior DevOps Engineer | 2021-Present
- Manage Kubernetes infrastructure (10K+ containers)
- Built CI/CD pipelines reducing deploy time by 70%
- On-call lead for production incidents

Spotify | DevOps Engineer | 2019-2021
- Automated infrastructure provisioning with Terraform
- Implemented monitoring and alerting systems
- Cost optimization saved $2M annually

SKILLS
Kubernetes, Docker, Terraform, AWS, Python, Grafana

EDUCATION
Texas A&M | B.S. Computer Science | 2019`,
      },
      {
        name: "James Wilson",
        email: "james.w@agency.co",
        position: "Technical Lead",
        stage: "offer" as const,
        overallScore: 94,
        flagCount: 0,
        linkedinUrl: "https://linkedin.com/in/jameswilson",
        githubUrl: "https://github.com/jameswilson",
        resumeText: `JAMES WILSON
Technical Lead

EXPERIENCE
Shopify | Technical Lead | 2020-Present
- Lead team of 15 engineers across 3 product squads
- Architected checkout system handling $100M+ daily
- Drove technical strategy and roadmap planning

Square | Senior Engineer | 2017-2020
- Built payment processing infrastructure
- Led cross-team technical initiatives
- Mentored 6 engineers to senior roles

SKILLS
System Design, React, Ruby, PostgreSQL, Leadership

EDUCATION
University of Waterloo | B.S. Computer Science | 2017`,
      },
      {
        name: "Aisha Mohammed",
        email: "aisha.m@enterprise.com",
        position: "Principal Engineer",
        stage: "hired" as const,
        overallScore: 96,
        flagCount: 0,
        linkedinUrl: "https://linkedin.com/in/aishamohammed",
        githubUrl: "https://github.com/aishamohammed",
        resumeText: `AISHA MOHAMMED
Principal Engineer

EXPERIENCE
Google | Principal Engineer | 2018-Present
- Technical lead for Google Cloud Platform core services
- Designed distributed systems serving billions of requests
- Filed 5 patents in distributed computing
- Led technical direction for 100+ engineer organization

Facebook | Staff Engineer | 2015-2018
- Built infrastructure for News Feed serving 2B+ users
- Optimized backend systems (10x throughput improvement)

SKILLS
Distributed Systems, System Design, C++, Go, Python

EDUCATION
MIT | Ph.D. Computer Science | 2015
Stanford | B.S. Computer Science | 2011`,
      },
      {
        name: "Ryan O'Brien",
        email: "ryan.obrien@contractor.net",
        position: "Senior Full Stack Engineer",
        stage: "rejected" as const,
        overallScore: 42,
        flagCount: 8,
        linkedinUrl: "https://linkedin.com/in/ryanobrien",
        resumeText: `RYAN O'BRIEN
Senior Full Stack Engineer

EXPERIENCE
Various Contracts | 2020-Present
- Built web applications for clients
- Full stack development with modern frameworks

Tech Startup | Engineer | 2018-2020
- Worked on various features
- Frontend and backend development

SKILLS
JavaScript, React, Node.js

EDUCATION
Online Courses | 2018`,
      },
    ];

    const candidateIds: { [key: string]: string } = {};

    for (const candidate of candidates) {
      const interviewId = `demo-interview-${candidate.name.toLowerCase().replace(/\s+/g, "-")}`;

      const candidateId = await ctx.db.insert("hiring_pipeline", {
        interviewId,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        position: candidate.position,
        companyId,
        stage: candidate.stage,
        previousStage: undefined,
        stageChangedAt: now - Math.random() * 7 * 24 * 60 * 60 * 1000, // Within last week
        stageChangedBy: Math.random() > 0.5 ? "joan" : "manual",
        linkedinUrl: (candidate as any).linkedinUrl,
        githubUrl: (candidate as any).githubUrl,
        twitterUrl: (candidate as any).twitterUrl,
        mediumUrl: (candidate as any).mediumUrl,
        substackUrl: (candidate as any).substackUrl,
        facebookUrl: (candidate as any).facebookUrl,
        instagramUrl: (candidate as any).instagramUrl,
        resumeText: (candidate as any).resumeText,
        overallScore: candidate.overallScore,
        flagCount: candidate.flagCount,
        actionItemsComplete: 0,
        actionItemsTotal: 0,
        createdAt: now - Math.random() * 14 * 24 * 60 * 60 * 1000, // Within last 2 weeks
        updatedAt: now,
      });

      candidateIds[candidate.name] = candidateId;
    }

    console.log("✅ Created 10 candidates across all pipeline stages");

    // ─────────────────────────────────────────────────────────────────
    // 2. CREATE ACTION ITEMS (20 items with various statuses)
    // ─────────────────────────────────────────────────────────────────

    const actionItems = [
      {
        candidate: "Sarah Chen",
        title: "Reference check with former manager at Google",
        type: "reference_check" as const,
        status: "pending" as const,
        priority: "high" as const,
        dueDate: now + 2 * 24 * 60 * 60 * 1000, // 2 days from now
        confidence: 0.95,
      },
      {
        candidate: "Sarah Chen",
        title: "Follow up on React Native experience",
        type: "follow_up" as const,
        status: "pending" as const,
        priority: "medium" as const,
        dueDate: now + 3 * 24 * 60 * 60 * 1000,
        confidence: 0.88,
      },
      {
        candidate: "Marcus Johnson",
        title: "Review product roadmap case study",
        type: "documentation" as const,
        status: "in_progress" as const,
        priority: "high" as const,
        dueDate: now + 1 * 24 * 60 * 60 * 1000,
        confidence: 0.92,
      },
      {
        candidate: "Marcus Johnson",
        title: "Schedule stakeholder presentation",
        type: "follow_up" as const,
        status: "pending" as const,
        priority: "urgent" as const,
        dueDate: now + 12 * 60 * 60 * 1000, // 12 hours
        confidence: 0.89,
      },
      {
        candidate: "Elena Rodriguez",
        title: "Verify LinkedIn profile discrepancies",
        type: "other" as const,
        status: "pending" as const,
        priority: "high" as const,
        dueDate: now + 1 * 24 * 60 * 60 * 1000,
        confidence: 0.78,
      },
      {
        candidate: "Elena Rodriguez",
        title: "Technical assessment review",
        type: "decision" as const,
        status: "in_progress" as const,
        priority: "medium" as const,
        dueDate: now + 2 * 24 * 60 * 60 * 1000,
        confidence: 0.91,
      },
      {
        candidate: "David Kim",
        title: "Reference check with direct reports",
        type: "reference_check" as const,
        status: "completed" as const,
        priority: "high" as const,
        dueDate: now - 1 * 24 * 60 * 60 * 1000, // Yesterday
        confidence: 0.94,
      },
      {
        candidate: "David Kim",
        title: "Review leadership case study",
        type: "documentation" as const,
        status: "completed" as const,
        priority: "medium" as const,
        dueDate: now - 2 * 24 * 60 * 60 * 1000,
        confidence: 0.87,
      },
      {
        candidate: "Priya Patel",
        title: "System design deep-dive follow-up",
        type: "follow_up" as const,
        status: "in_progress" as const,
        priority: "high" as const,
        dueDate: now + 1 * 24 * 60 * 60 * 1000,
        confidence: 0.93,
      },
      {
        candidate: "Priya Patel",
        title: "Verify Python expertise claims",
        type: "documentation" as const,
        status: "pending" as const,
        priority: "medium" as const,
        dueDate: now + 3 * 24 * 60 * 60 * 1000,
        confidence: 0.85,
      },
      {
        candidate: "Alex Thompson",
        title: "Investigate authentication inconsistencies",
        type: "other" as const,
        status: "in_progress" as const,
        priority: "urgent" as const,
        dueDate: now + 6 * 60 * 60 * 1000, // 6 hours
        confidence: 0.71,
      },
      {
        candidate: "Alex Thompson",
        title: "Additional reference check recommended",
        type: "reference_check" as const,
        status: "pending" as const,
        priority: "high" as const,
        dueDate: now + 1 * 24 * 60 * 60 * 1000,
        confidence: 0.82,
      },
      {
        candidate: "Lisa Martinez",
        title: "Kubernetes certification verification",
        type: "documentation" as const,
        status: "completed" as const,
        priority: "medium" as const,
        dueDate: now - 1 * 24 * 60 * 60 * 1000,
        confidence: 0.96,
      },
      {
        candidate: "Lisa Martinez",
        title: "Schedule final team introduction",
        type: "follow_up" as const,
        status: "pending" as const,
        priority: "high" as const,
        dueDate: now + 2 * 24 * 60 * 60 * 1000,
        confidence: 0.91,
      },
      {
        candidate: "James Wilson",
        title: "Prepare offer letter package",
        type: "documentation" as const,
        status: "in_progress" as const,
        priority: "urgent" as const,
        dueDate: now + 1 * 24 * 60 * 60 * 1000,
        confidence: 0.98,
      },
      {
        candidate: "James Wilson",
        title: "Coordinate start date with HR",
        type: "follow_up" as const,
        status: "pending" as const,
        priority: "high" as const,
        dueDate: now + 2 * 24 * 60 * 60 * 1000,
        confidence: 0.95,
      },
      {
        candidate: "Aisha Mohammed",
        title: "Onboarding checklist completion",
        type: "documentation" as const,
        status: "completed" as const,
        priority: "medium" as const,
        dueDate: now - 5 * 24 * 60 * 60 * 1000,
        confidence: 1.0,
      },
      {
        candidate: "Aisha Mohammed",
        title: "First week check-in",
        type: "follow_up" as const,
        status: "completed" as const,
        priority: "low" as const,
        dueDate: now - 3 * 24 * 60 * 60 * 1000,
        confidence: 1.0,
      },
      {
        candidate: "Ryan O'Brien",
        title: "Investigate voice pattern anomalies",
        type: "other" as const,
        status: "completed" as const,
        priority: "urgent" as const,
        dueDate: now - 2 * 24 * 60 * 60 * 1000,
        confidence: 0.65,
      },
      {
        candidate: "Ryan O'Brien",
        title: "Send rejection letter",
        type: "documentation" as const,
        status: "completed" as const,
        priority: "medium" as const,
        dueDate: now - 1 * 24 * 60 * 60 * 1000,
        confidence: 1.0,
      },
    ];

    for (const item of actionItems) {
      const candidateId = candidateIds[item.candidate];
      const interviewId = `demo-interview-${item.candidate.toLowerCase().replace(/\s+/g, "-")}`;

      await ctx.db.insert("action_items", {
        interviewId,
        candidateId,
        companyId,
        title: item.title,
        type: item.type,
        status: item.status,
        priority: item.priority,
        dueDate: item.dueDate,
        reminderSent: false,
        extractedBy: "joan",
        extractedAt: now - Math.random() * 5 * 24 * 60 * 60 * 1000,
        confidence: item.confidence,
        createdAt: now - Math.random() * 5 * 24 * 60 * 60 * 1000,
        updatedAt: now,
        completedAt: item.status === "completed" ? now - Math.random() * 3 * 24 * 60 * 60 * 1000 : undefined,
      });
    }

    console.log("✅ Created 20 action items with varying statuses");

    // ─────────────────────────────────────────────────────────────────
    // 3. CREATE EMAIL THREADS (8 routed emails)
    // ─────────────────────────────────────────────────────────────────

    const emailThreads = [
      {
        candidate: "Sarah Chen",
        from: "sarah.chen@techcorp.com",
        subject: "Re: Interview availability next week",
        body: "Hi team! I'm available Tuesday or Thursday afternoon for the next round. Looking forward to diving deeper into your React architecture.",
        emailType: "scheduling" as const,
        requiresAction: true,
        suggestedActionItem: "Schedule technical interview with Sarah",
        routingConfidence: 1.0,
      },
      {
        candidate: "Marcus Johnson",
        from: "marcus.j@startupco.io",
        subject: "Product roadmap case study attached",
        body: "As requested, I've attached my product roadmap case study from my last role. Let me know if you need any clarification on the approach.",
        emailType: "follow_up" as const,
        requiresAction: false,
        routingConfidence: 1.0,
      },
      {
        candidate: "Elena Rodriguez",
        from: "hiring@designstudio.com",
        subject: "Reference for Elena Rodriguez",
        body: "Elena worked on our design systems team for 3 years. She's an excellent engineer but had some inconsistencies in her project delivery timeline.",
        emailType: "reference" as const,
        requiresAction: true,
        suggestedActionItem: "Review Elena's reference feedback and assess",
        routingConfidence: 0.85,
      },
      {
        candidate: "David Kim",
        from: "david.kim@bigcorp.com",
        subject: "Thank you for the interview!",
        body: "Really enjoyed our conversation about engineering culture. I'm excited about the opportunity and happy to provide any additional information you need.",
        emailType: "follow_up" as const,
        requiresAction: false,
        routingConfidence: 1.0,
      },
      {
        candidate: "Priya Patel",
        from: "priya.patel@consulting.com",
        subject: "Question about system design exercise",
        body: "Quick question: for the system design round, should I focus more on scalability or developer experience trade-offs?",
        emailType: "question" as const,
        requiresAction: true,
        suggestedActionItem: "Respond to Priya's system design question",
        routingConfidence: 1.0,
      },
      {
        candidate: "Lisa Martinez",
        from: "lisa.martinez@saascompany.com",
        subject: "Re: Final round scheduling",
        body: "I can do next Friday morning for the final round. Should I prepare anything specific for the team meet-and-greet?",
        emailType: "scheduling" as const,
        requiresAction: true,
        suggestedActionItem: "Confirm final round schedule with Lisa",
        routingConfidence: 1.0,
      },
      {
        candidate: "James Wilson",
        from: "james.w@agency.co",
        subject: "Offer acceptance timeline",
        body: "I'm very excited about the offer! I'd like to discuss the start date - my current notice period is 4 weeks. Can we chat tomorrow?",
        emailType: "offer" as const,
        requiresAction: true,
        suggestedActionItem: "Schedule call to discuss James's start date",
        routingConfidence: 1.0,
      },
      {
        candidate: "Ryan O'Brien",
        from: "ryan.obrien@contractor.net",
        subject: "Re: Interview feedback request",
        body: "I'm disappointed with the decision but I understand. Could you provide specific feedback on what I could improve for future opportunities?",
        emailType: "rejection" as const,
        requiresAction: false,
        routingConfidence: 1.0,
      },
    ];

    for (const email of emailThreads) {
      const candidateId = candidateIds[email.candidate];

      await ctx.db.insert("email_threads", {
        candidateId,
        companyId,
        from: email.from,
        to: "hiring@demo-company.com",
        subject: email.subject,
        body: email.body,
        threadId: `thread-${Math.random().toString(36).substring(7)}`,
        messageId: `msg-${Math.random().toString(36).substring(7)}`,
        routedBy: "joan",
        routingConfidence: email.routingConfidence,
        routingReason: `Email from ${email.from} matches candidate email`,
        emailType: email.emailType,
        requiresAction: email.requiresAction,
        suggestedActionItem: email.suggestedActionItem,
        read: Math.random() > 0.3, // 70% read
        replied: Math.random() > 0.6, // 40% replied
        repliedAt: Math.random() > 0.6 ? now - Math.random() * 2 * 24 * 60 * 60 * 1000 : undefined,
        receivedAt: now - Math.random() * 4 * 24 * 60 * 60 * 1000,
        createdAt: now - Math.random() * 4 * 24 * 60 * 60 * 1000,
      });
    }

    console.log("✅ Created 8 email threads routed by Joan");

    // ─────────────────────────────────────────────────────────────────
    // 4. CREATE INTERVIEW SCORES (for authenticity analysis)
    // ─────────────────────────────────────────────────────────────────

    const scoredCandidates = [
      { name: "Sarah Chen", overall: 87, speech: 90, timing: 85, flow: 88, linguistic: 85, flags: 0, critical: 0 },
      { name: "Marcus Johnson", overall: 92, speech: 93, timing: 91, flow: 94, linguistic: 90, flags: 0, critical: 0 },
      { name: "Elena Rodriguez", overall: 78, speech: 82, timing: 75, flow: 76, linguistic: 80, flags: 1, critical: 0 },
      { name: "David Kim", overall: 95, speech: 96, timing: 94, flow: 95, linguistic: 95, flags: 0, critical: 0 },
      { name: "Priya Patel", overall: 88, speech: 87, timing: 89, flow: 88, linguistic: 88, flags: 0, critical: 0 },
      { name: "Alex Thompson", overall: 65, speech: 58, timing: 68, flow: 70, linguistic: 64, flags: 3, critical: 1 },
      { name: "Lisa Martinez", overall: 91, speech: 92, timing: 90, flow: 91, linguistic: 91, flags: 0, critical: 0 },
      { name: "James Wilson", overall: 94, speech: 95, timing: 93, flow: 94, linguistic: 94, flags: 0, critical: 0 },
      { name: "Aisha Mohammed", overall: 96, speech: 97, timing: 96, flow: 95, linguistic: 96, flags: 0, critical: 0 },
      { name: "Ryan O'Brien", overall: 42, speech: 38, timing: 45, flow: 40, linguistic: 45, flags: 8, critical: 3 },
    ];

    for (const score of scoredCandidates) {
      const candidateId = candidateIds[score.name];
      const interviewId = `demo-interview-${score.name.toLowerCase().replace(/\s+/g, "-")}`;

      await ctx.db.insert("interview_scores", {
        interviewId,
        candidateId,
        companyId,
        overallScore: score.overall,
        speechScore: score.speech,
        timingScore: score.timing,
        flowScore: score.flow,
        linguisticScore: score.linguistic,
        engagement: score.overall - 5 + Math.random() * 10,
        confidence: score.overall - 3 + Math.random() * 6,
        flagCount: score.flags,
        criticalFlags: score.critical,
        lastUpdated: now - Math.random() * 7 * 24 * 60 * 60 * 1000,
        updateSource: "batch",
        createdAt: now - Math.random() * 7 * 24 * 60 * 60 * 1000,
      });
    }

    console.log("✅ Created interview scores for 10 candidates");

    // ─────────────────────────────────────────────────────────────────
    // 5. CREATE JOAN ACTIVITY LOG (audit trail)
    // ─────────────────────────────────────────────────────────────────

    const joanActivities = [
      {
        action: "extracted_action_items" as const,
        description: "Joan extracted 2 action items from Sarah Chen's screening interview",
        candidateName: "Sarah Chen",
        success: true,
        details: { itemsCreated: 2, confidence: 0.92 },
      },
      {
        action: "routed_email" as const,
        description: "Joan routed email from marcus.j@startupco.io to Marcus Johnson's pipeline",
        candidateName: "Marcus Johnson",
        success: true,
        details: { confidence: 1.0, emailType: "follow_up" },
      },
      {
        action: "routed_email" as const,
        description: "Joan routed reference email to Elena Rodriguez with medium confidence",
        candidateName: "Elena Rodriguez",
        success: true,
        details: { confidence: 0.85, emailType: "reference" },
      },
      {
        action: "extracted_action_items" as const,
        description: "Joan extracted 2 action items from David Kim's technical interview",
        candidateName: "David Kim",
        success: true,
        details: { itemsCreated: 2, confidence: 0.91 },
      },
      {
        action: "moved_pipeline_stage" as const,
        description: "Joan moved David Kim from screening to technical based on completed action items",
        candidateName: "David Kim",
        success: true,
        details: { fromStage: "screening", toStage: "technical", reason: "All screening tasks completed" },
      },
      {
        action: "enriched_candidate" as const,
        description: "Joan enriched Priya Patel's profile with LinkedIn and GitHub data",
        candidateName: "Priya Patel",
        success: true,
        details: { linkedinUrl: "linkedin.com/in/priyapatel", githubUrl: "github.com/priya-patel", skills: ["Python", "System Design", "Kubernetes"] },
      },
      {
        action: "flagged_risk" as const,
        description: "Joan flagged authentication inconsistencies in Alex Thompson's interview",
        candidateName: "Alex Thompson",
        success: true,
        details: { riskLevel: "medium", flags: 3 },
      },
      {
        action: "sent_reminder" as const,
        description: "Joan sent deadline reminder for Lisa Martinez's final round scheduling",
        candidateName: "Lisa Martinez",
        success: true,
        details: { actionItem: "Schedule final team introduction", dueIn: "2 days" },
      },
      {
        action: "routed_email" as const,
        description: "Joan routed offer acceptance email from James Wilson",
        candidateName: "James Wilson",
        success: true,
        details: { confidence: 1.0, emailType: "offer" },
      },
      {
        action: "moved_pipeline_stage" as const,
        description: "Joan moved Aisha Mohammed to hired status after onboarding completion",
        candidateName: "Aisha Mohammed",
        success: true,
        details: { fromStage: "offer", toStage: "hired", reason: "Onboarding checklist completed" },
      },
      {
        action: "flagged_risk" as const,
        description: "Joan flagged critical authenticity issues for Ryan O'Brien",
        candidateName: "Ryan O'Brien",
        success: true,
        details: { riskLevel: "critical", flags: 8, overallScore: 42 },
      },
      {
        action: "moved_pipeline_stage" as const,
        description: "Joan moved Ryan O'Brien to rejected based on authenticity score",
        candidateName: "Ryan O'Brien",
        success: true,
        details: { fromStage: "screening", toStage: "rejected", reason: "Authenticity score below threshold" },
      },
    ];

    for (const activity of joanActivities) {
      const candidateId = activity.candidateName ? candidateIds[activity.candidateName] : undefined;
      const interviewId = activity.candidateName
        ? `demo-interview-${activity.candidateName.toLowerCase().replace(/\s+/g, "-")}`
        : undefined;

      await ctx.db.insert("joan_activity", {
        companyId,
        interviewId,
        candidateId,
        action: activity.action,
        description: activity.description,
        details: activity.details,
        success: activity.success,
        timestamp: now - Math.random() * 7 * 24 * 60 * 60 * 1000,
      });
    }

    console.log("✅ Created 12 Joan activity log entries");

    // ─────────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────────

    console.log("\n🎉 Demo data seeding complete!");
    console.log("─────────────────────────────────────");
    console.log("✅ 10 candidates across all pipeline stages");
    console.log("✅ 20 action items (pending, in-progress, completed)");
    console.log("✅ 8 email threads routed by Joan");
    console.log("✅ 10 interview authenticity scores");
    console.log("✅ 12 Joan activity audit log entries");
    console.log("\nView the demo at: https://fleet-spider-112.convex.site/joan-pipeline");

    return {
      success: true,
      candidatesCreated: candidates.length,
      actionItemsCreated: actionItems.length,
      emailThreadsCreated: emailThreads.length,
      scoresCreated: scoredCandidates.length,
      activitiesCreated: joanActivities.length,
    };
  },
});
