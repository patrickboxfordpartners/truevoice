/**
 * Email Templates for Candidate Status Updates
 *
 * Joan sends these automatically when candidates move between stages
 */

interface StageEmailTemplate {
  subject: string;
  body: string;
}

export function getStageTransitionEmail(
  candidateName: string,
  position: string,
  fromStage: string,
  toStage: string,
  companyName: string = "our company"
): StageEmailTemplate | null {
  const firstName = candidateName.split(" ")[0];

  // Moving to Technical Round
  if (toStage === "technical") {
    return {
      subject: `Next Steps: Technical Interview for ${position}`,
      body: `Hi ${firstName},

Great news! We'd like to move forward with your application for ${position}.

Your initial screening went well, and we're excited to schedule a technical interview with our engineering team.

**What to expect:**
• Technical conversation about your experience and approach
• Architecture and system design discussion
• Code review or whiteboarding session (language of your choice)
• Q&A about the role and our tech stack

**To prepare:**
• Review the job description and our technical requirements
• Prepare examples of challenging problems you've solved
• Think about questions you have for the team

We'll send a separate email with scheduling options shortly.

Looking forward to speaking with you!

Best regards,
Joan (AI Hiring Coordinator)
${companyName}

---
This is an automated message from Joan AI. Reply to this email to reach our hiring team.`,
    };
  }

  // Moving to Final Round
  if (toStage === "final") {
    return {
      subject: `Final Round Interview - ${position}`,
      body: `Hi ${firstName},

Excellent news! You've done really well in the technical interview, and we'd like to invite you to our final round for ${position}.

**What to expect:**
• Conversations with leadership and cross-functional partners
• Culture fit and team collaboration discussion
• Your questions about the company, role, and team
• Opportunity to meet potential teammates

**To prepare:**
• Review our company mission and values
• Prepare thoughtful questions about the role and team
• Think about examples that demonstrate your collaboration style

This is typically the last step before an offer decision.

We'll send scheduling details separately.

Congratulations on making it this far!

Best regards,
Joan (AI Hiring Coordinator)
${companyName}

---
This is an automated message from Joan AI. Reply to this email to reach our hiring team.`,
    };
  }

  // Moving to Offer
  if (toStage === "offer") {
    return {
      subject: `Exciting News About Your ${position} Application`,
      body: `Hi ${firstName},

We have great news about your application for ${position}!

Our hiring team has completed the interview process and we'd like to extend you an offer. You'll receive a formal offer letter from our recruiting team within the next 24-48 hours with details on:

• Compensation and benefits package
• Start date options
• Equity/stock options (if applicable)
• Next steps and timeline

We're excited about the possibility of you joining our team!

If you have any questions in the meantime, please don't hesitate to reply to this email.

Congratulations!

Best regards,
Joan (AI Hiring Coordinator)
${companyName}

---
This is an automated message from Joan AI. Reply to this email to reach our hiring team.`,
    };
  }

  // Rejected
  if (toStage === "rejected") {
    return {
      subject: `Update on Your ${position} Application`,
      body: `Hi ${firstName},

Thank you for taking the time to interview for ${position} with ${companyName}.

After careful consideration, we've decided to move forward with other candidates whose experience more closely aligns with our current needs.

This was a difficult decision — we were impressed by your background and skills. We encourage you to apply for future openings that match your expertise.

We'll keep your information on file and reach out if a better-fit role becomes available.

Thank you again for your interest in ${companyName}, and we wish you the best in your job search.

Best regards,
Joan (AI Hiring Coordinator)
${companyName}

---
This is an automated message from Joan AI. Reply to this email to reach our hiring team.`,
    };
  }

  // No email for other transitions (screening, hired, etc.)
  return null;
}
