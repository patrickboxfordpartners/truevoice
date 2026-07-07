# TrueVoice HQ — Interview Intelligence Platform

**Date:** 2026-07-07
**Status:** Approved

---

## 1. Overview

TrueVoice HQ pivots from "AI fraud detection" to "Interview Intelligence Platform." The core technology is unchanged — real-time speech analysis, webcam monitoring, behavioral signals — but the narrative, positioning, and go-to-market motion are rebuilt around the positive value: structured, comparable data for every interview that makes hiring decisions easier to make and easier to defend.

**Core value proposition:**
> "We give hiring teams a structured intelligence report for every interview — communication, engagement, consistency, behavioral signals. Same data, every candidate, every time."

**Sales motion:** Contact-us / book-a-demo. No self-serve. Patrick sells directly. First 5 customers come from warm relationships in the hiring world. Pricing is negotiated per engagement (volume, company size, use case).

**Beachhead:** Horizontal — problem permeates industries. Let the first conversations reveal where the easiest wins are rather than over-committing to a vertical.

**Upsell path:** Option B (compliance layer) for enterprise accounts once initial wins are in place.

---

## 2. Positioning Changes

### What leads
- "Interview Intelligence" — structured data from every interview
- Comparable candidates — same dimensions scored the same way every time
- Defensible decisions — a report anyone on the hiring team can read
- Better process over time — trend analytics per position

### What steps back
- "AI fraud detection" — removed from all marketing copy. Remains an internal product description and a real capability, but not the front door.
- Adversarial framing — no "catch cheaters" language anywhere in the UI or landing page

### Score label rename (display layer only, no schema changes)

| Current label | New label |
|---|---|
| Speech | Communication Quality |
| Timing | Thinking & Engagement |
| Flow | Interview Presence |
| Linguistic | Response Authenticity |
| Overall Score | Intelligence Score |
| Flags | Behavioral Signals |

Applied via a single constants file (`src/lib/scoreLabels.ts`) referenced everywhere scores are displayed.

---

## 3. Architecture

### What stays
- `InterviewRoom` — live analysis engine, real-time transcription, scoring sidebar, flag log
- `CandidateInterview` — consent flow, system check, waiting room, behavior + webcam monitoring
- `Dashboard` — table/card/calendar views, bulk CSV import, email invitations, position filter
- `Report` — radar chart, score gauge, timeline, flag log, response delay analysis, panelists
- Panel interview support (`usePanelists`)
- All Supabase edge functions: `analyze-chunk`, `analyze-frame`, `analyze-resume`, `generate-questions`, `generate-final-report`, `send-interview-email`
- Stripe backend — stays wired for manual invoicing, removed from user-facing onboarding

### What gets fixed (broken today)
1. **Scores returning zeros** — verify XAI API key and `grok-3-fast` model availability; redeploy `analyze-chunk` and `generate-final-report`
2. **Compare page on mock data** — replace `candidateReports` / `candidateList` mock imports with live `useCompletedReports` hook queries
3. **Analytics page** — audit to confirm it reads live Supabase data, fix any mock data leaks

### What gets changed
1. **Landing page (`src/pages/Index.tsx`)** — complete rewrite. Hero: report screenshot + single headline + "Book a Demo" CTA. Three value props. How it works (invite → analyze → report). Demo request form. No pricing section.
2. **Pricing page (`src/pages/Pricing.tsx`)** — replaced with a simple "Contact Us" / demo request page. Stripe checkout links removed from user-facing flow.
3. **Score labels** — global rename via `scoreLabels.ts` constants, applied to: `Report.tsx`, `InterviewRoom.tsx`, `ScoreGauge.tsx`, `MiniRadar.tsx`, `CandidateCard.tsx`, `ScoreBadge.tsx`, `Compare.tsx`, `Analytics.tsx`
4. **Stripe self-serve removed** — `Pricing.tsx` no longer shows checkout buttons. `useBilling.ts` / `usePlan.ts` remain for internal plan gating but are not exposed in the new UI.

### What gets added
1. **Shareable report links** — token-based public URL at `/r/[token]`. One "Share Report" button in the report header generates a token, copies URL to clipboard. The `/r/[token]` route renders the full report read-only, no auth required.
2. **Demo request flow** — form at `/demo` (name, company, role, est. interviews/month, message). On submit, fires Postmark email to `patrick@boxfordpartners.com`. No Supabase write, no CRM. Manual follow-up.
3. **Position analytics view** — new "Positions" tab on the dashboard. For each unique position in the company's interviews, shows: avg Intelligence Score, interview count, top 3 candidates. Uses existing data, aggregated client-side from `useInterviews`.

---

## 4. Data Model

### No schema changes to existing tables
All score columns retain their current names (`speech_score`, `timing_score`, `flow_score`, `linguistic_score`). Renaming is display-layer only.

### New table: `report_tokens`

```sql
create table report_tokens (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique(token)
);

alter table report_tokens enable row level security;

-- Authenticated users can create tokens for their own company's interviews
create policy "users can insert tokens for own interviews"
  on report_tokens for insert
  with check (
    exists (
      select 1 from interviews i
      join companies c on c.id = i.company_id
      join profiles p on p.company_id = c.id
      where i.id = interview_id and p.id = auth.uid()
    )
  );

-- Anyone can read by token (public shareable link)
create policy "public token read"
  on report_tokens for select
  using (true);
```

### New Supabase edge function: `api-get-report` (already exists)
Check if it already handles unauthenticated token-based reads. If not, update it to accept `?token=<uuid>` and skip auth check when a valid token is provided.

---

## 5. New Components & Routes

### `/r/[token]` — Public Report View
- New route in `App.tsx`
- New page `src/pages/PublicReport.tsx` — reuses `useReport` logic but fetches via token rather than auth session
- Renders: score gauge, radar chart, timeline, behavioral signals, recommendations
- Header: TrueVoice logo, "Powered by TrueVoice HQ" badge, no nav
- No edit actions (no share button, no delete, no "book follow-up")

### `/demo` — Demo Request Page
- New page `src/pages/DemoRequest.tsx`
- Form fields: Full name, Company, Your role, Estimated interviews/month (dropdown: <10, 10-50, 50-200, 200+), Message (optional)
- Submit calls Postmark directly via a Supabase edge function `send-demo-request`
- Success state: "We'll be in touch within 24 hours."
- No auth required

### `src/lib/scoreLabels.ts` — Label Constants
```typescript
export const SCORE_LABELS = {
  speech: "Communication Quality",
  timing: "Thinking & Engagement",
  flow: "Interview Presence",
  linguistic: "Response Authenticity",
  overall: "Intelligence Score",
  flags: "Behavioral Signals",
} as const
```

### `src/components/ShareReportButton.tsx`
- Generates a token via Supabase insert into `report_tokens`
- Constructs `https://truevoicehq.com/r/[token]`
- Copies to clipboard, shows toast "Report link copied"
- Placed in `Report.tsx` header alongside existing Download and Share2 buttons

---

## 6. Landing Page Design Direction

**Hero:**
- Headline: "Every interview, analyzed." or "Turn interviews into intelligence."
- Subhead: "TrueVoice gives every hiring team structured, comparable data from every conversation — so decisions are easier to make and easier to defend."
- CTA: Single button — "Book a Demo" → `/demo`
- Visual: Screenshot of a completed report (radar chart + score gauge + behavioral signals timeline)

**Three value props (below hero):**
1. Structured data from every interview — same dimensions, every candidate, every time
2. Compare candidates side by side — see who was most engaged, most consistent, most present
3. Defend your decisions — every hire backed by objective, timestamped data

**How it works (three steps):**
1. Invite your candidate — send a link, they join from any browser
2. Interview as normal — TrueVoice runs silently in the background
3. Review the report — full intelligence report ready the moment the call ends

**Demo request section:**
- "Ready to see it?" → form inline or link to `/demo`

**Footer:** Consistent with Boxford Partners family. "A Boxford Partners Company."

**What's removed:** Pricing section, plan comparison table, Stripe checkout buttons, any mention of "fraud detection" or "AI cheating."

---

## 7. Implementation Priority

| Priority | Item | Effort |
|---|---|---|
| P0 | Fix scores returning zeros | Small — API key + redeploy |
| P0 | Fix compare page mock data | Small |
| P0 | Audit analytics page | Small |
| P1 | Rename score labels via constants | Small |
| P1 | Rewrite landing page | Medium |
| P1 | Replace pricing page with demo request | Small |
| P1 | Demo request edge function + email | Small |
| P2 | Shareable report links (table + route + button) | Medium |
| P2 | Position analytics tab on dashboard | Medium |
| P3 | Public report page `/r/[token]` | Medium |

---

## 8. What's Out of Scope (for now)

- ATS integrations (Greenhouse, Lever, Workday) — meaningful but requires partnerships and webhooks; revisit after first customers
- Async/self-serve interview mode (candidate answers without live interviewer) — strong feature, but changes the UX significantly; Phase 2
- White-label / agency reseller — different business model; only pursue if an agency comes inbound
- Mobile app — not needed for the sales motion; browser-based is fine for enterprise
