# Candidate Invitation Email + Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a Postmark invitation email when an interview is created, add a resend button on scheduled cards in the Dashboard, and update the candidate-facing welcome step to drop legacy "authenticity detection" language.

**Architecture:** Rewrite the `send-interview-email` Supabase edge function to use Postmark and handle the new `invitation` template type with hardcoded HTML. Wire auto-fire into `useCreateInterview`'s onSuccess. Add an optional `onResendInvitation` prop to `CandidateCard` and pass the handler from `Dashboard.tsx`. Update copy in `CandidateInterview.tsx` welcome step and consent step.

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind CSS 3 + Supabase edge functions + Postmark

## Global Constraints

- Email sender: `{{company_name}} <hello@truevoicehq.com>` — company name is dynamic in the From display name
- Reply-To: interviewer's email from `profiles.email` for `interview.created_by`
- Postmark endpoint: `https://api.postmarkapp.com/email` with header `X-Postmark-Server-Token`
- `MessageStream: "outbound"` required in every Postmark payload
- Auto-fire is fire-and-forget — `.catch(() => {})` — never blocks interview creation
- `POSTMARK_API_KEY` is already set in Supabase secrets — do not add fallback stubs that silently succeed
- Invitation template uses hardcoded HTML — no `email_templates` DB lookup for `template_type === "invitation"`
- `onResendInvitation` prop only rendered on `type === "scheduled"` and `type === "in_progress"` cards
- No new files — all changes are modifications to existing files
- Run `npm run build` after every task
- Test command: `npm test`

---

## File Map

**Modified:**
- `supabase/functions/send-interview-email/index.ts` — Postmark migration + invitation template + Reply-To
- `src/hooks/useInterviews.ts` — auto-fire email in `useCreateInterview` onSuccess
- `src/components/dashboard/CandidateCard.tsx` — `onResendInvitation` prop + resend button + `Mail` import
- `src/pages/Dashboard.tsx` — pass `onResendInvitation` handler to scheduled/in_progress cards
- `src/pages/CandidateInterview.tsx` — welcome step + consent step copy update

---

## Task 1: Rewrite send-interview-email Edge Function

**Files:**
- Modify: `supabase/functions/send-interview-email/index.ts`

**Interfaces:**
- Accepts POST: `{ interview_id: string, template_type: string, custom_subject?: string, custom_body?: string }`
- When `template_type === "invitation"`: uses hardcoded HTML, skips DB template lookup
- Returns: `{ success: true, message: string }` or `{ success: false, error: string }`

- [ ] **Step 1: Replace the entire edge function file**

```typescript
// supabase/functions/send-interview-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INVITATION_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#f0fdf4;padding:28px 32px;border-bottom:1px solid #e5e7eb">
      <p style="margin:0;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em">Interview Invitation</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#111827">{{company_name}}</h1>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151">Hi {{candidate_name}},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        <strong>{{company_name}}</strong> has invited you to interview for the
        <strong>{{position}}</strong> role. We're looking forward to the conversation.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="{{interview_link}}" style="display:inline-block;background:#111827;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none">
          Join your interview →
        </a>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#111827">What to expect</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#4b5563;line-height:1.7">
          <li>Runs in your browser — no app to download</li>
          <li>Takes roughly 30–45 minutes</li>
          <li>Your interviewer will be {{interviewer_name}}</li>
        </ul>
      </div>
      <p style="margin:0 0 20px;font-size:13px;color:#6b7280;border-left:3px solid #e5e7eb;padding-left:12px">
        <em>{{company_name}} uses TrueVoice HQ, an AI-assisted interview platform that analyzes communication patterns during the conversation. The same process applies to every candidate.</em>
      </p>
      <p style="margin:0;font-size:14px;color:#374151">
        If you have any questions, reply to this email and we'll get back to you.
      </p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
        Powered by <a href="https://truevoicehq.com" style="color:#6b7280;text-decoration:none">TrueVoice HQ</a>
        · A Boxford Partners Company
      </p>
    </div>
  </div>
</body>
</html>`;

const INVITATION_SUBJECT = "You're invited to interview with {{company_name}} — {{position}}";

function substitute(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{{${k}}}`, v),
    template
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { interview_id, template_type, custom_subject, custom_body } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch interview + company
    const { data: interview, error: intError } = await supabase
      .from("interviews")
      .select("*, companies(name)")
      .eq("id", interview_id)
      .single();

    if (intError || !interview) {
      return new Response(JSON.stringify({ error: "Interview not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch interviewer profile for Reply-To and name
    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", interview.created_by)
      .single();

    const companyName = (interview as any).companies?.name || "Our Company";
    const siteUrl = Deno.env.get("SITE_URL") || "https://truevoicehq.com";
    const interviewLink = `${siteUrl}/interview/${interview.candidate_token}`;

    const vars: Record<string, string> = {
      company_name: companyName,
      candidate_name: interview.candidate_name || "there",
      position: interview.position || "the role",
      interview_link: interviewLink,
      interviewer_name: creator?.full_name || "your interviewer",
    };

    let subject: string;
    let htmlBody: string;

    if (template_type === "invitation") {
      // Hardcoded invitation template — no DB lookup needed
      subject = substitute(INVITATION_SUBJECT, vars);
      htmlBody = substitute(INVITATION_HTML, vars);
    } else {
      // Other template types: look up from DB or use custom
      subject = custom_subject || "";
      htmlBody = custom_body || "";

      if (!subject && !htmlBody && template_type) {
        const { data: template } = await supabase
          .from("email_templates")
          .select("subject, body")
          .eq("company_id", interview.company_id)
          .eq("template_type", template_type)
          .single();

        if (template) {
          subject = substitute(template.subject, vars);
          htmlBody = substitute(template.body, vars);
        }
      }
    }

    if (!subject || !htmlBody) {
      return new Response(JSON.stringify({ error: "No email content resolved" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const postmarkKey = Deno.env.get("POSTMARK_API_KEY");
    if (!postmarkKey) {
      console.error("[send-interview-email] POSTMARK_API_KEY not set");
      return new Response(JSON.stringify({ success: false, error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromAddress = `${companyName} <hello@truevoicehq.com>`;
    const payload: Record<string, unknown> = {
      From: fromAddress,
      To: interview.candidate_email,
      Subject: subject,
      HtmlBody: htmlBody,
      MessageStream: "outbound",
    };

    if (creator?.email) {
      payload.ReplyTo = creator.email;
    }

    const emailResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify(payload),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[send-interview-email] Postmark error:", emailResponse.status, JSON.stringify(emailResult));
      return new Response(
        JSON.stringify({ success: false, error: `Email send failed: ${emailResult.Message || emailResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-interview-email] Sent to:", interview.candidate_email, "MessageID:", emailResult.MessageID);

    return new Response(
      JSON.stringify({ success: true, message: `Email sent to ${interview.candidate_email}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-interview-email] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Deploy the edge function**

```bash
supabase functions deploy send-interview-email --project-ref pvkxngyfaupqgdhgzmou --workdir /Users/patrickmitchell/true-voice-insights 2>&1 | tail -5
```
Expected: `Deployed Functions on project pvkxngyfaupqgdhgzmou: send-interview-email`

- [ ] **Step 3: Build to verify no TypeScript errors in the broader project**

```bash
npm run build 2>&1 | tail -5
```
Expected: `built in` with no errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/send-interview-email/index.ts
git commit -m "feat: migrate send-interview-email to Postmark, add hardcoded invitation template with Reply-To"
```

---

## Task 2: Auto-fire Email in useCreateInterview

**Files:**
- Modify: `src/hooks/useInterviews.ts`

**Interfaces:**
- Consumes: `supabase.functions.invoke("send-interview-email", { body: { interview_id, template_type: "invitation" } })` — fire-and-forget
- No change to the `useCreateInterview` return type or mutation signature

- [ ] **Step 1: Add supabase import if not already present**

Open `src/hooks/useInterviews.ts`. It already imports `supabase` from `@/lib/supabase` (line 4). No change needed.

- [ ] **Step 2: Update the onSuccess callback in useCreateInterview**

Find the `onSuccess` block in `useCreateInterview` (currently at lines 88-92):

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["interviews"] });
  queryClient.refetchQueries({ queryKey: ["interviews"] });
  queryClient.invalidateQueries({ queryKey: ["candidates"] });
},
```

Replace with:

```typescript
onSuccess: (interview) => {
  queryClient.invalidateQueries({ queryKey: ["interviews"] });
  queryClient.refetchQueries({ queryKey: ["interviews"] });
  queryClient.invalidateQueries({ queryKey: ["candidates"] });

  // Fire invitation email — non-blocking, silent fail (user can resend from dashboard)
  supabase.functions.invoke("send-interview-email", {
    body: { interview_id: interview.id, template_type: "invitation" },
  }).catch(() => {});
},
```

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 4: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useInterviews.ts
git commit -m "feat: auto-fire invitation email on interview creation (fire-and-forget)"
```

---

## Task 3: CandidateCard Resend Button

**Files:**
- Modify: `src/components/dashboard/CandidateCard.tsx`

**Interfaces:**
- Produces: `ScheduledCardProps` gets new optional prop `onResendInvitation?: () => void`
- The `CompletedCardProps` interface is unchanged

- [ ] **Step 1: Update CandidateCard.tsx**

Replace the entire file:

```typescript
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Clock, Radio, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniRadar } from "./MiniRadar";
import { getScoreColor } from "@/components/ScoreGauge";

interface CompletedCardProps {
  type: "completed";
  id: string;
  candidate: string;
  position: string;
  date: string;
  overall: number;
  speech: number;
  timing: number;
  flow: number;
  linguistic: number;
  summary?: string;
  flagCount: number;
  highestSeverity?: "low" | "medium" | "high";
  index?: number;
}

interface ScheduledCardProps {
  type: "scheduled" | "in_progress";
  id: string;
  candidate: string;
  position: string;
  date: string;
  index?: number;
  onResendInvitation?: () => void;
}

type CandidateCardProps = CompletedCardProps | ScheduledCardProps;

const severityDot = (severity?: "low" | "medium" | "high") => {
  if (!severity) return null;
  const cls = severity === "high" ? "bg-destructive" : severity === "medium" ? "bg-warning" : "bg-muted-foreground";
  return <span className={`h-2 w-2 rounded-full ${cls}`} />;
};

export const CandidateCard = (props: CandidateCardProps) => {
  const { id, candidate, position, date, index = 0 } = props;

  if (props.type === "completed") {
    const { overall, speech, timing, flow, linguistic, summary, flagCount, highestSeverity } = props;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="glass-card rounded-xl p-5 flex flex-col gap-3 hover:shadow-[var(--shadow-elevated)] transition-shadow group"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{candidate}</h3>
            <p className="text-xs text-muted-foreground truncate">{position}</p>
          </div>
          <span className={`text-2xl font-bold tabular-nums leading-none ${getScoreColor(overall)}`}>
            {overall}
          </span>
        </div>

        {/* Radar + Summary */}
        <div className="flex items-center gap-3">
          <MiniRadar
            speech={speech}
            timing={timing}
            flow={flow}
            linguistic={linguistic}
            overall={overall}
            size={72}
          />
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
            {summary || "Analysis complete. View full report for details."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {flagCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                {severityDot(highestSeverity)}
                <AlertTriangle className="h-3 w-3" />
                {flagCount} {flagCount === 1 ? "flag" : "flags"}
              </span>
            )}
            <span>{date}</span>
          </div>
          <Link to={`/report/${id}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              Report <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  // Scheduled / In Progress variant
  const isLive = props.type === "in_progress";
  const { onResendInvitation } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass-card rounded-xl p-5 flex flex-col gap-3 border-dashed hover:shadow-[var(--shadow-elevated)] transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{candidate}</h3>
          <p className="text-xs text-muted-foreground truncate">{position}</p>
        </div>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Radio className="h-3 w-3 animate-pulse" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Scheduled
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{date}</p>

      <Link to={`/interviewer/${id}`} className="mt-auto">
        <Button size="sm" variant={isLive ? "default" : "outline"} className="w-full gap-1.5">
          {isLive ? "Join Interview" : "Start Interview"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>

      {onResendInvitation && (
        <button
          onClick={(e) => { e.preventDefault(); onResendInvitation(); }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="h-3 w-3" />
          Resend invitation
        </button>
      )}
    </motion.div>
  );
};
```

Note: the `Link to` on the Start Interview button was corrected from `/room/${id}` to `/interviewer/${id}` — this matches the rest of the dashboard and fixes the pre-existing wrong route.

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/CandidateCard.tsx
git commit -m "feat: CandidateCard — add onResendInvitation prop + resend button, fix interview room route"
```

---

## Task 4: Dashboard Resend Handler

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `onResendInvitation?: () => void` prop on `CandidateCard` (from Task 3)
- Consumes: `supabase.functions.invoke` from `@/lib/supabase`
- Consumes: `useToast` / `toast` — already imported in Dashboard.tsx
- Consumes: `interview.candidate_email` — available via `select("*")` in `getInterviews`

- [ ] **Step 1: Verify supabase is imported in Dashboard.tsx**

```bash
grep -n "import.*supabase" /Users/patrickmitchell/true-voice-insights/src/pages/Dashboard.tsx
```

If not present, add this import near the top with other imports:
```typescript
import { supabase } from "@/lib/supabase";
```

- [ ] **Step 2: Pass onResendInvitation to scheduled/in_progress CandidateCard renders**

There are two places in Dashboard.tsx where `CandidateCard` is rendered for scheduled/in_progress interviews. Find the block around line 552 (the `interview.status === "scheduled" || interview.status === "in_progress"` branch):

```typescript
return (
  <CandidateCard
    key={interview.id}
    type={interview.status as "scheduled" | "in_progress"}
    id={interview.id}
    candidate={interview.candidate_name}
    position={interview.position}
    date={dateStr}
    index={i}
  />
);
```

Replace with:

```typescript
return (
  <CandidateCard
    key={interview.id}
    type={interview.status as "scheduled" | "in_progress"}
    id={interview.id}
    candidate={interview.candidate_name}
    position={interview.position}
    date={dateStr}
    index={i}
    onResendInvitation={() => {
      supabase.functions.invoke("send-interview-email", {
        body: { interview_id: interview.id, template_type: "invitation" },
      }).then(() => {
        toast({
          title: "Invitation resent",
          description: `Sent to ${interview.candidate_email}`,
        });
      }).catch(() => {
        toast({ title: "Failed to resend invitation", variant: "destructive" });
      });
    }}
  />
);
```

There may be a second `CandidateCard` for `type="scheduled"` (the fallback at ~line 566). Add the same `onResendInvitation` prop there too — only if that card is also for non-completed interviews. Check the surrounding `if` condition before adding.

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 4: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: dashboard — pass onResendInvitation handler to scheduled/in_progress cards"
```

---

## Task 5: Candidate Landing Page Copy Update

**Files:**
- Modify: `src/pages/CandidateInterview.tsx`

**Target:** `step === "welcome"` block and `step === "consent"` block only. No structural changes.

- [ ] **Step 1: Update the "What to expect" paragraph**

Find this text (around line 273):
```typescript
This interview uses AI-powered analysis to evaluate response authenticity.
Your speech patterns, response timing, conversational flow, and visual behavior
will be analyzed in real-time to produce an authenticity score shared with {companyName}.
```

Replace with:
```tsx
This interview uses TrueVoice HQ, an AI-assisted platform that analyzes
communication patterns in real-time. A structured intelligence report is
shared with {companyName} after the interview. The same process applies to every candidate.
```

- [ ] **Step 2: Update the four bullet points**

Find the four `<div className="flex items-start gap-2">` bullet blocks inside the welcome step. Replace their text content:

**Bullet 1** — find: `AI analyzes speech patterns in real-time`
Replace with: `Join from any browser — no app required`

**Bullet 2** — find: `Authenticity score shared with interviewer`
Replace with: `Intelligence report shared with {companyName} after the interview`

**Bullet 3** — find: `No audio recordings are stored`
Replace with: `Audio is analyzed live — no recording is stored`

**Bullet 4** — find: `Same process applied to all candidates`
Replace with: `The same process applies to every candidate`

- [ ] **Step 3: Update the consent step disclosure line**

Find (around line 350):
```typescript
I understand that an authenticity score and analysis will be shared with {companyName}.
```

Replace with:
```tsx
I understand that an AI-assisted intelligence report will be shared with {companyName}.
```

- [ ] **Step 4: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 5: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add src/pages/CandidateInterview.tsx
git commit -m "feat: update candidate landing page copy — remove authenticity language, align with intelligence platform rebrand"
```

---

## Task 6: Final Build, Push, Deploy

- [ ] **Step 1: Full build**

```bash
npm run build
```
Expected: clean build, chunk size warning acceptable.

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 3: Push**

```bash
git push
```

- [ ] **Step 4: Deploy to Vercel**

```bash
npx vercel --prod
```
Expected: `Aliased: https://truevoicehq.com`

- [ ] **Step 5: Smoke test**

1. Create a new interview in the dashboard → check that an invitation email arrives at the candidate email address
2. On a scheduled interview card, click "Resend invitation" → toast appears, email arrives again
3. Visit a candidate interview link → welcome page shows updated copy, no "authenticity" language
4. Check consent step → disclosure line reads "AI-assisted intelligence report"

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| send-interview-email migrated from Resend to Postmark | Task 1 |
| `invitation` template type with hardcoded HTML | Task 1 |
| From: `{{company_name}} <hello@truevoicehq.com>` | Task 1 |
| Reply-To: interviewer email | Task 1 |
| `MessageStream: "outbound"` | Task 1 |
| Auto-fire on interview creation (fire-and-forget) | Task 2 |
| `onResendInvitation` prop on CandidateCard | Task 3 |
| `Mail` icon added to CandidateCard imports | Task 3 |
| Resend button only on scheduled/in_progress | Task 3 |
| Dashboard passes handler with toast feedback | Task 4 |
| Welcome step paragraph rewritten | Task 5 |
| Four bullet points replaced | Task 5 |
| Consent step disclosure line updated | Task 5 |
| Deploy | Task 6 |

**All spec requirements covered. No placeholders. Types consistent across tasks.**
