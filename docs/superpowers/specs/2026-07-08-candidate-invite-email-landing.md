# TrueVoice HQ — Candidate Invitation Email + Landing Page

**Date:** 2026-07-08
**Status:** Approved

---

## 1. Goal

Send a professional hybrid-tone invitation email to every candidate when an interview is created, with a resend option from the dashboard. Update the candidate-facing welcome step to drop legacy "authenticity detection" language and match the Interview Intelligence Platform rebrand.

---

## 2. Scope

Two independent deliverables:

**Feature A — Invitation email**
- `send-interview-email` edge function migrated from Resend to Postmark
- New `invitation` template type with hardcoded HTML (no DB template lookup needed for this type)
- Auto-fires after `useCreateInterview` mutation succeeds (fire-and-forget)
- "Resend invitation" button on scheduled/in-progress interview cards in the Dashboard

**Feature B — Candidate landing page copy update**
- `CandidateInterview.tsx` welcome step copy updated to remove "authenticity" language
- Bullet points rewritten for clarity and warmth
- No new routes, no new components

---

## 3. Email Spec

### Sender / Headers
- **From:** `{{company_name}} <hello@truevoicehq.com>`
- **Reply-To:** interviewer's email address (fetched from `profiles.email` for `interview.created_by`)
- **To:** `interview.candidate_email`

### Subject
```
You're invited to interview with {{company_name}} — {{position}}
```

### HTML Body

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <!-- Header -->
    <div style="background:#f0fdf4;padding:28px 32px;border-bottom:1px solid #e5e7eb">
      <p style="margin:0;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em">Interview Invitation</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#111827">{{company_name}}</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151">Hi {{candidate_name}},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        <strong>{{company_name}}</strong> has invited you to interview for the
        <strong>{{position}}</strong> role. We're looking forward to the conversation.
      </p>
      <!-- CTA -->
      <div style="text-align:center;margin:28px 0">
        <a href="{{interview_link}}" style="display:inline-block;background:#111827;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none">
          Join your interview →
        </a>
      </div>
      <!-- What to expect -->
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#111827">What to expect</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#4b5563;line-height:1.7">
          <li>Runs in your browser — no app to download</li>
          <li>Takes roughly 30–45 minutes</li>
          <li>Your interviewer will be {{interviewer_name}}</li>
        </ul>
      </div>
      <!-- AI disclosure -->
      <p style="margin:0 0 20px;font-size:13px;color:#6b7280;border-left:3px solid #e5e7eb;padding-left:12px">
        <em>{{company_name}} uses TrueVoice HQ, an AI-assisted interview platform that analyzes communication patterns during the conversation. The same process applies to every candidate.</em>
      </p>
      <p style="margin:0;font-size:14px;color:#374151">
        If you have any questions, reply to this email and we'll get back to you.
      </p>
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
        Powered by <a href="https://truevoicehq.com" style="color:#6b7280;text-decoration:none">TrueVoice HQ</a>
        · A Boxford Partners Company
      </p>
    </div>
  </div>
</body>
</html>
```

### Variable Map
| Variable | Source |
|---|---|
| `{{company_name}}` | `interview.companies.name` |
| `{{candidate_name}}` | `interview.candidate_name` |
| `{{position}}` | `interview.position` |
| `{{interview_link}}` | `${SITE_URL}/interview/${interview.candidate_token}` |
| `{{interviewer_name}}` | `profiles.full_name` for `interview.created_by` |

---

## 4. Edge Function Changes

### Migration: Resend → Postmark

**Remove:**
- `RESEND_API_KEY` usage
- `https://api.resend.com/emails` fetch
- `EMAIL_FROM` env var usage

**Add:**
- `POSTMARK_API_KEY` (already set in Supabase secrets)
- `https://api.postmarkapp.com/email` fetch
- `X-Postmark-Server-Token: ${postmarkKey}` header
- `MessageStream: "outbound"` in body

### New `invitation` template type

When `template_type === "invitation"`, skip the DB `email_templates` lookup entirely. Use the hardcoded HTML above with variable substitution. This avoids requiring a DB row to be set up for every new customer.

### Reply-To header

Fetch `profiles.email` for `interview.created_by` and add to the Postmark payload:
```json
{ "ReplyTo": "interviewer@company.com" }
```

### From field

```
{{company_name}} <hello@truevoicehq.com>
```

Constructed as: `${companyName} <hello@truevoicehq.com>`

### Auto-fire on creation

In `src/hooks/useInterviews.ts`, `useCreateInterview` mutation's `onSuccess` callback, add a fire-and-forget call:

```typescript
onSuccess: (interview) => {
  // Existing invalidations...
  queryClient.invalidateQueries({ queryKey: ["interviews"] });

  // Fire invitation email (non-blocking)
  supabase.functions.invoke("send-interview-email", {
    body: { interview_id: interview.id, template_type: "invitation" },
  }).catch(() => {}); // silent fail — user can resend from dashboard
}
```

---

## 5. Dashboard Resend Button

### Where it appears
On `CandidateCard` components with `type === "scheduled"` or `type === "in_progress"`. Not shown for completed interviews.

### Implementation
`CandidateCard` already receives `id`, `candidate`, `position` props. Add an optional `onResendInvitation?: () => void` prop.

In `Dashboard.tsx`, pass the handler when rendering scheduled/in-progress cards:

```typescript
onResendInvitation={() => {
  supabase.functions.invoke("send-interview-email", {
    body: { interview_id: interview.id, template_type: "invitation" },
  }).then(() => {
    toast({ title: "Invitation resent", description: `Sent to ${interview.candidate_email}` });
  }).catch(() => {
    toast({ title: "Failed to resend", variant: "destructive" });
  });
}}
```

### UI in CandidateCard
Add `Mail` to the lucide-react import in `CandidateCard.tsx`. Small secondary button below the existing card actions:

```tsx
{onResendInvitation && (
  <button
    onClick={(e) => { e.preventDefault(); onResendInvitation(); }}
    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
  >
    <Mail className="h-3 w-3" />
    Resend invitation
  </button>
)}
```

---

## 6. Candidate Landing Page Copy Updates

File: `src/pages/CandidateInterview.tsx`, `step === "welcome"` block.

### Headline — no change
`Interview with {companyName}` — already correct.

### "What to expect" paragraph — replace
**Current:**
> This interview uses AI-powered analysis to evaluate response authenticity. Your speech patterns, response timing, conversational flow, and visual behavior will be analyzed in real-time to produce an authenticity score shared with {companyName}.

**New:**
> This interview uses TrueVoice HQ, an AI-assisted platform that analyzes communication patterns in real-time. A structured intelligence report is shared with {companyName} after the interview. The same process applies to every candidate.

### Four bullet points — replace all four
| Current | New |
|---|---|
| "AI analyzes speech patterns in real-time" | "Join from any browser — no app required" |
| "Authenticity score shared with interviewer" | "Intelligence report shared with {companyName} after the interview" |
| "No audio recordings are stored" | "Audio is analyzed live — no recording is stored" |
| "Same process applied to all candidates" | "The same process applies to every candidate" |

### Consent step disclosure — update one line
**Current:** `I understand that an authenticity score and analysis will be shared with {companyName}.`
**New:** `I understand that an AI-assisted intelligence report will be shared with {companyName}.`

---

## 7. Files Touched

**Modified:**
- `supabase/functions/send-interview-email/index.ts` — Postmark migration + invitation template + Reply-To + company From name
- `src/hooks/useInterviews.ts` — auto-fire email in `useCreateInterview` onSuccess
- `src/components/dashboard/CandidateCard.tsx` — add `onResendInvitation` prop + resend button
- `src/pages/Dashboard.tsx` — pass `onResendInvitation` handler to scheduled/in-progress cards
- `src/pages/CandidateInterview.tsx` — welcome step copy update

**No new files required.**

---

## 8. Out of Scope

- Custom sending domain per customer — build when a customer requests it
- Email open/click tracking — Postmark has this, not wiring it up now
- Scheduled send (send at a specific time) — not needed
- DB-stored invitation template — hardcoded HTML is sufficient; customizable templates already exist for other types
