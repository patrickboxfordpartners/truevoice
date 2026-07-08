# TrueVoice HQ — First-Run Onboarding Design

**Date:** 2026-07-08
**Status:** Approved

---

## 1. Goal

When a new customer logs in for the first time — whether provisioned by Patrick (white-glove) or self-installing — they complete a guided 4-step wizard that ends with a candidate interview link ready to send. The primary success action is: create your first interview and share the link with a colleague to try it out.

---

## 2. Trigger Logic

`ProtectedRoute` redirects to `/onboarding` when either condition is true:
- `company.name` is blank, OR
- `profile.has_completed_onboarding` is `false`

Once `has_completed_onboarding = true`, navigating to `/onboarding` redirects to `/dashboard`. The flag is set only when the wizard completes (Step 4 reached).

**White-glove path:** Patrick pre-fills `company.name` before the client's first login. Step 2 (Workspace) is auto-skipped. The wizard advances from Step 1 directly to Step 3 with Step 2 marked complete in the progress indicator.

---

## 3. New Database Column

```sql
alter table profiles add column if not exists has_completed_onboarding boolean not null default false;
```

Applied via Supabase MCP. No migration file needed — applied directly.

---

## 4. Wizard Steps

### Step 1 — Welcome
- Full-screen, centered layout
- TrueVoice logo top-left
- Headline: "Welcome to TrueVoice HQ."
- Subhead: "Let's get you set up in 3 minutes."
- Three horizontal steps visualized as icon + label: "Set up workspace → Create your first interview → Send the candidate link"
- Single CTA: "Let's go →"
- No skip, no back

### Step 2 — Workspace *(auto-skipped if `company.name` already set)*
- Headline: "Tell us about your team."
- Fields: Company name (text, pre-filled if set), Industry (select dropdown)
- Continue button: saves via `useUpdateCompany`, advances on success
- Back button: returns to Step 1

### Step 3 — Create Your First Interview
- Headline: "Create your first interview."
- Subhead: "Try it with a colleague first — low stakes, real results."
- Fields: Position (text, placeholder "e.g. Senior Engineer"), Candidate name (text), Candidate email (email)
- Callout below fields: "We'll generate a private link your colleague opens to join the interview."
- "Create Interview →" button: calls `createInterview` mutation (same as CreateInterviewDialog), shows spinner on loading
- On success: stores the created interview ID + candidate token, advances to Step 4
- On failure: inline error message below the button (no toast), button re-enables for retry
- Back button: returns to Step 2 (or Step 1 if Step 2 was skipped)

### Step 4 — Ready
- Headline: "Your interview is ready."
- Candidate link displayed in a read-only input with a "Copy link" button
- Copy button uses `navigator.clipboard.writeText`, shows "Copied!" feedback for 2s
- Body text: "Share this link with [candidate name]. When they click it, they'll join the interview from their browser — no app required."
- Two actions: "Copy link" (primary button), "Go to Dashboard →" (text link)
- On "Go to Dashboard": sets `has_completed_onboarding = true` in Supabase, then navigates to `/dashboard`
- No back button

---

## 5. Progress Indicator

4-dot stepper at top: Welcome · Workspace · Interview · Ready

- Active step: accent color, slightly enlarged
- Completed step: accent fill with checkmark
- Future step: muted border
- Step 2 shows as completed (with checkmark) from the moment of arrival when auto-skipped

---

## 6. Updated ProtectedRoute

```typescript
// Current condition:
if (company && !company.name && location.pathname !== "/onboarding") {
  return <Navigate to="/onboarding" replace />
}

// New condition:
const needsOnboarding = (company && !company.name) || (profile && !profile.has_completed_onboarding)
if (needsOnboarding && location.pathname !== "/onboarding") {
  return <Navigate to="/onboarding" replace />
}

// Re-entry prevention (add to Onboarding page itself):
if (profile?.has_completed_onboarding) {
  return <Navigate to="/dashboard" replace />
}
```

---

## 7. Dashboard Empty State Upgrade

**When `interviews.length === 0`:**
> "Create your first interview" with a button that opens `CreateInterviewDialog`.

**When interviews exist but none are completed (e.g. just came from onboarding):**
> Card showing the most recent scheduled interview: "Your first interview is ready."
> Body: "Share the candidate link and open the interview room when you're on the call."
> Button: "Open Interview Room →" → navigates to `/room/[id]`

Implementation: `useDashboardStats` already loads interview counts. Add a check in the Dashboard component: if `completedInterviews.length === 0 && scheduledInterviews.length > 0`, render the contextual guidance card above the empty list.

---

## 8. Interview Creation in Wizard

Uses the existing `createInterview` API function from `src/lib/api/interviews.ts`. The wizard needs:
- `position` (string)
- `candidate_name` (string)
- `candidate_email` (string)
- `company_id` from `useAuth().company.id`

On success, the API returns the interview `id`. The candidate token URL is constructed as:
```
${import.meta.env.VITE_SITE_URL}/interview/${interview.candidate_token}
```

The `candidate_token` field must be selected in the `createInterview` response. Check `src/lib/api/interviews.ts` — if it doesn't return `candidate_token`, update the select to include it.

---

## 9. Files Touched

**Modified:**
- `src/pages/Onboarding.tsx` — complete rewrite (4 steps, remove Plan step, add interview creation)
- `src/components/ProtectedRoute.tsx` — updated redirect condition
- `src/pages/Dashboard.tsx` — upgraded empty state with contextual guidance card
- `src/contexts/AuthContext.tsx` — ensure `profile.has_completed_onboarding` is included in the profile fetch

**No new files required.**

---

## 10. Out of Scope

- Team invite step in onboarding — Settings already has this; no need to duplicate in the wizard
- Email to candidate from within the wizard — they copy the link manually
- Animated demo/video in the welcome step — text-only for now
