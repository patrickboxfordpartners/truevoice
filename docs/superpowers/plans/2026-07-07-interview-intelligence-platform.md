# Interview Intelligence Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild TrueVoice HQ as an "Interview Intelligence Platform" — fix broken scoring, reframe the product narrative, remove self-serve pricing, add shareable reports and a demo request flow.

**Architecture:** Display-layer rebranding via a single constants file; broken features fixed in-place; new pages (DemoRequest, PublicReport) added alongside existing routes; one new DB table (`report_tokens`) with a matching edge function for public reads.

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind CSS 3 + Framer Motion + Supabase (auth + edge functions + DB) + React Query + Postmark + React Router v6

## Global Constraints

- No schema changes to existing tables — renaming is display-layer only
- `SCORE_LABELS` from `src/lib/scoreLabels.ts` must be the only source of score dimension names across the entire UI
- No "fraud detection", "AI cheating", or "authenticity detection" language on any public-facing page
- No Stripe checkout buttons on public-facing pages — Stripe backend stays wired for internal invoicing
- Postmark sender: `hello@truevoicehq.com`, recipient for demo requests: `patrick@boxfordpartners.com`
- Public shareable report URL pattern: `https://truevoicehq.com/r/[token]`
- Run `npm run build` after each task to catch type errors before committing
- Test command: `npm test`

---

## File Map

**Created:**
- `src/lib/scoreLabels.ts` — single source of truth for all score dimension display names
- `src/components/ShareReportButton.tsx` — generates report_tokens row, copies URL to clipboard
- `src/pages/DemoRequest.tsx` — public demo request form page at `/demo`
- `src/pages/PublicReport.tsx` — unauthenticated report view at `/r/:token`
- `supabase/functions/send-demo-request/index.ts` — edge function: receives form, emails Patrick via Postmark
- `supabase/functions/get-public-report/index.ts` — edge function: fetches report data by token, no auth
- `supabase/migrations/20260707_report_tokens.sql` — report_tokens table + RLS policies

**Modified:**
- `src/components/ScoreGauge.tsx` — replace hardcoded "High Authenticity" / "Low Authenticity" labels with `SCORE_LABELS.overall`
- `src/components/dashboard/MiniRadar.tsx` — no label changes needed (SVG only, no text labels)
- `src/components/dashboard/CandidateCard.tsx` — no label changes needed (shows numeric score only)
- `src/pages/Report.tsx` — use `SCORE_LABELS` for dimension headers; add `ShareReportButton`
- `src/pages/InterviewRoom.tsx` — use `SCORE_LABELS` for sidebar score labels
- `src/pages/Compare.tsx` — use `SCORE_LABELS` for radar axis labels and dimension bars; remove mock data fallback
- `src/pages/Analytics.tsx` — verify already uses live hooks (it does — no mock data); use `SCORE_LABELS` for chart axis labels
- `src/components/landing/Hero.tsx` — new copy: "Every interview, analyzed." framing; remove "authenticity detection" language
- `src/components/landing/Features.tsx` — rewrite feature cards around intelligence/data framing
- `src/components/landing/CTASection.tsx` — change CTA to "Book a Demo" → `/demo`
- `src/pages/Pricing.tsx` — replace with contact/demo redirect page; remove Stripe checkout buttons
- `src/App.tsx` — add routes: `/demo` → `DemoRequest`, `/r/:token` → `PublicReport`

---

## Task 1: Score Labels Constants File

**Files:**
- Create: `src/lib/scoreLabels.ts`

**Interfaces:**
- Produces: `SCORE_LABELS` object, `getGaugeLabel(score: number): string`

- [ ] **Step 1: Create the constants file**

```typescript
// src/lib/scoreLabels.ts

export const SCORE_LABELS = {
  speech: "Communication Quality",
  timing: "Thinking & Engagement",
  flow: "Interview Presence",
  linguistic: "Response Authenticity",
  overall: "Intelligence Score",
  flags: "Behavioral Signals",
} as const

export type ScoreDimension = keyof typeof SCORE_LABELS

/** Human-readable quality label for a 0-100 overall Intelligence Score. */
export function getGaugeLabel(score: number): string {
  if (score >= 75) return "Strong Signal"
  if (score >= 50) return "Mixed Signal"
  return "Weak Signal"
}
```

- [ ] **Step 2: Build to verify no errors**

```bash
npm run build 2>&1 | tail -5
```
Expected: `built in` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/scoreLabels.ts
git commit -m "feat: add scoreLabels constants — single source of truth for score dimension names"
```

---

## Task 2: Update ScoreGauge to Use Label Constants

**Files:**
- Modify: `src/components/ScoreGauge.tsx`

**Interfaces:**
- Consumes: `getGaugeLabel` from `src/lib/scoreLabels.ts`
- Produces: `ScoreGauge` component (unchanged interface), `getScoreColor(score: number): string`, `getScoreLabel(score: number): string` (re-exported for backwards compat)

- [ ] **Step 1: Update ScoreGauge.tsx**

Replace the entire file:

```typescript
// src/components/ScoreGauge.tsx
import { useEffect, useState } from "react"
import { getGaugeLabel } from "@/lib/scoreLabels"

interface ScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  animated?: boolean
}

export const getScoreColor = (score: number) => {
  if (score >= 75) return "text-success"
  if (score >= 50) return "text-warning"
  return "text-destructive"
}

const getScoreStroke = (score: number) => {
  if (score >= 75) return "stroke-success"
  if (score >= 50) return "stroke-warning"
  return "stroke-destructive"
}

// Re-exported for backwards compatibility with Report.tsx and Compare.tsx
export const getScoreLabel = getGaugeLabel

export const ScoreGauge = ({ score, size = 120, strokeWidth = 8, showLabel = true, animated = true }: ScoreGaugeProps) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayScore / 100) * circumference

  useEffect(() => {
    if (!animated) return
    const timer = setTimeout(() => setDisplayScore(score), 100)
    return () => clearTimeout(timer)
  }, [score, animated])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={getScoreStroke(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: animated ? "stroke-dashoffset 1.5s ease-out" : "none" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{Math.round(displayScore)}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${getScoreColor(score)}`}>
          {getGaugeLabel(score)}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ScoreGauge.tsx
git commit -m "feat: ScoreGauge uses getGaugeLabel from scoreLabels — removes hardcoded authenticity language"
```

---

## Task 3: Apply Score Labels to Report Page

**Files:**
- Modify: `src/pages/Report.tsx`

**Interfaces:**
- Consumes: `SCORE_LABELS` from `src/lib/scoreLabels.ts`

The Report page renders dimension names in: the radar chart `PolarAngleAxis` data keys, the `Progress` bar labels, the flags section header, and the recommendations section. Find each and replace with `SCORE_LABELS`.

- [ ] **Step 1: Add import at top of Report.tsx**

After the existing imports, add:
```typescript
import { SCORE_LABELS } from "@/lib/scoreLabels"
```

- [ ] **Step 2: Update radar chart axis labels**

Find the `radarData` array (it uses keys like `"Speech"`, `"Timing"`, `"Flow"`, `"Linguistic"`). Replace:

```typescript
// Find this pattern (approximate line ~90 in Report.tsx):
const radarData = data ? [
  { subject: "Speech", value: (data.report.speech_score / 25) * 100 },
  { subject: "Timing", value: (data.report.timing_score / 25) * 100 },
  { subject: "Flow", value: (data.report.flow_score / 25) * 100 },
  { subject: "Linguistic", value: (data.report.linguistic_score / 25) * 100 },
] : []
```

Replace with:
```typescript
const radarData = data ? [
  { subject: SCORE_LABELS.speech, value: (data.report.speech_score / 25) * 100 },
  { subject: SCORE_LABELS.timing, value: (data.report.timing_score / 25) * 100 },
  { subject: SCORE_LABELS.flow, value: (data.report.flow_score / 25) * 100 },
  { subject: SCORE_LABELS.linguistic, value: (data.report.linguistic_score / 25) * 100 },
] : []
```

- [ ] **Step 3: Update dimension progress bar labels**

Search for any JSX that renders `"Speech"`, `"Timing"`, `"Flow"`, `"Linguistic"` as text in progress bar rows. Replace each with the corresponding `SCORE_LABELS.*` constant.

Search pattern: `grep -n '"Speech"\|"Timing"\|"Flow"\|"Linguistic"' src/pages/Report.tsx`

Replace every instance:
- `"Speech"` → `{SCORE_LABELS.speech}`
- `"Timing"` → `{SCORE_LABELS.timing}`
- `"Flow"` → `{SCORE_LABELS.flow}`
- `"Linguistic"` → `{SCORE_LABELS.linguistic}`

- [ ] **Step 4: Update "Flags" section header**

Find the section heading that renders "Flags" or "Behavioral Flags". Replace with `{SCORE_LABELS.flags}`.

- [ ] **Step 5: Update "Overall Score" label wherever it appears**

Find any text rendering "Overall Score". Replace with `{SCORE_LABELS.overall}`.

- [ ] **Step 6: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Report.tsx
git commit -m "feat: Report page uses SCORE_LABELS constants for all dimension and section names"
```

---

## Task 4: Apply Score Labels to InterviewRoom and Compare

**Files:**
- Modify: `src/pages/InterviewRoom.tsx`
- Modify: `src/pages/Compare.tsx`

**Interfaces:**
- Consumes: `SCORE_LABELS` from `src/lib/scoreLabels.ts`

- [ ] **Step 1: Add import to InterviewRoom.tsx**

```typescript
import { SCORE_LABELS } from "@/lib/scoreLabels"
```

- [ ] **Step 2: Find and replace score labels in InterviewRoom.tsx**

Run: `grep -n '"Speech"\|"Timing"\|"Flow"\|"Linguistic"\|"Overall"\|Flags' src/pages/InterviewRoom.tsx`

For each hit that is a display label (not a DB column name or prop key), replace with the corresponding `SCORE_LABELS.*` value.

- [ ] **Step 3: Fix Compare.tsx mock data fallback**

Open `src/pages/Compare.tsx`. Find this block (around line 96):
```typescript
return { reportMap: candidateReports, reportList: candidateList };
```

Replace with:
```typescript
return { reportMap: {} as Record<string, CandidateReport>, reportList: [] };
```

Then remove the now-unused imports at the top:
```typescript
// DELETE these two lines:
import { candidateReports, candidateList, type CandidateReport } from "@/data/mockCandidates";
```

Add the type inline since we still need it:
```typescript
// Keep the CandidateReport type — move it to be defined locally in Compare.tsx
// It's already defined in the file as an interface, just remove the import
```

- [ ] **Step 4: Update radar axis labels in Compare.tsx**

Find the `radarData` array in Compare.tsx. It uses `subject` values like `"Speech"`, `"Timing"`, etc. Replace:

```typescript
const radarData = left && right ? [
  { subject: SCORE_LABELS.speech, A: (left.speech / 25) * 100, B: (right.speech / 25) * 100 },
  { subject: SCORE_LABELS.timing, A: (left.timing / 25) * 100, B: (right.timing / 25) * 100 },
  { subject: SCORE_LABELS.flow, A: (left.flow / 25) * 100, B: (right.flow / 25) * 100 },
  { subject: SCORE_LABELS.linguistic, A: (left.linguistic / 25) * 100, B: (right.linguistic / 25) * 100 },
  { subject: "Engagement", A: left.engagement, B: right.engagement },
  { subject: "Confidence", A: left.confidence, B: right.confidence },
] : []
```

- [ ] **Step 5: Update DimensionBar labels in Compare.tsx**

Find the section that renders `DimensionBar` components. Replace hardcoded label strings:
- `"Speech"` → `{SCORE_LABELS.speech}`
- `"Timing"` → `{SCORE_LABELS.timing}`
- `"Flow"` → `{SCORE_LABELS.flow}`
- `"Linguistic"` → `{SCORE_LABELS.linguistic}`

- [ ] **Step 6: Add SCORE_LABELS import to Compare.tsx**

```typescript
import { SCORE_LABELS } from "@/lib/scoreLabels"
```

- [ ] **Step 7: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/InterviewRoom.tsx src/pages/Compare.tsx
git commit -m "feat: apply SCORE_LABELS to InterviewRoom and Compare; remove mock data fallback from Compare"
```

---

## Task 5: Fix Scores Returning Zeros

**Files:**
- No code changes — this is an ops/deployment fix

The `analyze-chunk` and `generate-final-report` edge functions use `grok-3-fast`. The parsing code is correct. The issue is almost certainly a stale or missing `XAI_API_KEY` secret in Supabase.

- [ ] **Step 1: Check current secrets**

```bash
supabase secrets list
```
Expected: `XAI_API_KEY` appears in the list.

If it does NOT appear, set it:
```bash
supabase secrets set XAI_API_KEY=<your-xai-key>
```
The XAI key is in `.env.local` as `VITE_XAI_API_KEY`.

- [ ] **Step 2: Verify the model name is current**

Open `supabase/functions/analyze-chunk/index.ts` and `supabase/functions/generate-final-report/index.ts`. Both use `model: "grok-3-fast"`. Confirm this model is still available by checking https://x.ai/api. If xAI has renamed it, update both files and redeploy.

- [ ] **Step 3: Redeploy both functions**

```bash
supabase functions deploy analyze-chunk
supabase functions deploy generate-final-report
```
Expected output: `Deployed: analyze-chunk` and `Deployed: generate-final-report`

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```
Open http://localhost:8080, start an interview, speak for 20+ seconds. Open browser console. Look for:
- `[analysis] Overall score:` — should be a number > 0
- No `[analysis] ⚠️ All scores are zero!` warning

If scores are still zero, check Supabase function logs:
Dashboard → Functions → analyze-chunk → Logs → look for `[analyze-chunk] Grok API status:` — should be 200.

- [ ] **Step 5: Commit (only if code changed in Step 2)**

If you updated the model name:
```bash
git add supabase/functions/analyze-chunk/index.ts supabase/functions/generate-final-report/index.ts
git commit -m "fix: update grok model name in edge functions"
```

---

## Task 6: Rewrite Landing Page Hero and Features

**Files:**
- Modify: `src/components/landing/Hero.tsx`
- Modify: `src/components/landing/Features.tsx`
- Modify: `src/components/landing/CTASection.tsx`

**Goal:** Replace "Know who you're actually hiring" / "authenticity detection" framing with "Every interview, analyzed." / interview intelligence framing. Remove the "View pricing" link. Change CTA to "Book a Demo".

- [ ] **Step 1: Rewrite Hero.tsx**

Replace the entire file:

```typescript
// src/components/landing/Hero.tsx
import { motion, useReducedMotion, useMotionValue, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { useRef } from "react"

const ease = [0.16, 1, 0.3, 1]

const WaveformBar = ({ height, delay }: { height: number; delay: number }) => (
  <motion.div
    className="w-1 rounded-full bg-accent/40"
    style={{ height }}
    animate={{ scaleY: [1, 0.5, 1.2, 0.7, 1] }}
    transition={{ duration: 2.5, delay, repeat: Infinity, ease: "easeInOut" }}
  />
)

const PulsingDot = () => (
  <motion.div
    className="w-2 h-2 rounded-full bg-accent"
    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  />
)

const MockPanel = ({
  title,
  children,
  className = "",
  delay = 0,
}: {
  title: string
  children: React.ReactNode
  className?: string
  delay?: number
}) => {
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.div
      className={`bg-card border border-border rounded-xl p-5 shadow-soft transition-shadow duration-300 hover:shadow-elevated ${className}`}
      initial={prefersReducedMotion ? undefined : { opacity: 0, x: 30, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay, ease }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
        <PulsingDot />
      </div>
      {children}
    </motion.div>
  )
}

const ScoreRow = ({ label, value, pct, delay = 0 }: { label: string; value: string; pct: number; delay?: number }) => (
  <motion.div
    className="space-y-1"
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay, ease }}
  >
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, delay: delay + 0.3, ease }}
      />
    </div>
  </motion.div>
)

const LogLine = ({ label, value, accent = false, delay = 0 }: { label: string; value: string; accent?: boolean; delay?: number }) => (
  <motion.div
    className="flex justify-between text-xs"
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay, ease }}
  >
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-medium ${accent ? "text-accent" : "text-foreground"}`}>{value}</span>
  </motion.div>
)

const Hero = () => {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const panelRotateX = useTransform(mouseY, [-300, 300], [3, -3])
  const panelRotateY = useTransform(mouseX, [-300, 300], [-3, 3])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const anim = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease },
        }

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <motion.p
            className="text-sm font-medium tracking-wide text-muted-foreground uppercase mb-5"
            {...anim(0)}
          >
            Interview Intelligence Platform
          </motion.p>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-foreground mb-6"
            {...anim(0.1)}
          >
            Every interview,{" "}
            <span className="text-accent">analyzed.</span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8"
            {...anim(0.2)}
          >
            TrueVoice gives hiring teams structured, comparable data from every
            conversation — so decisions are easier to make and easier to defend.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
            {...anim(0.3)}
          >
            <Button
              size="lg"
              asChild
              className="rounded-md bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <Link to="/demo">
                Book a Demo
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          ref={containerRef}
          className="relative hidden lg:block perspective-[1200px]"
          style={{ rotateX: panelRotateX, rotateY: panelRotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <MockPanel title="Intelligence Score" className="relative z-10" delay={0.4}>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl font-bold text-accent tabular-nums">87</div>
              <div className="flex-1 space-y-2">
                <ScoreRow label="Communication Quality" value="22/25" pct={88} delay={0.8} />
                <ScoreRow label="Interview Presence" value="21/25" pct={84} delay={0.9} />
              </div>
            </div>
          </MockPanel>

          <MockPanel title="Behavioral Signals" className="relative z-20 -mt-3 ml-8" delay={0.55}>
            <div className="space-y-1.5">
              <LogLine label="Tab focus" value="Active" accent delay={1.0} />
              <LogLine label="Response timing" value="Natural" accent delay={1.1} />
              <LogLine label="Consistency" value="High" accent delay={1.2} />
            </div>
          </MockPanel>

          <MockPanel title="Candidate Comparison" className="relative z-10 -mt-3 mr-12" delay={0.7}>
            <div className="space-y-2">
              {[
                { name: "Jordan M.", score: 87 },
                { name: "Alex T.", score: 74 },
                { name: "Casey R.", score: 61 },
              ].map((c, i) => (
                <motion.div
                  key={c.name}
                  className="flex items-center gap-2 text-xs"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.2 + i * 0.1, ease }}
                >
                  <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent">
                    {c.name[0]}
                  </div>
                  <span className="flex-1 text-muted-foreground">{c.name}</span>
                  <span className="font-semibold text-foreground">{c.score}</span>
                </motion.div>
              ))}
            </div>
          </MockPanel>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
```

- [ ] **Step 2: Rewrite Features.tsx**

Replace the content of the three feature cards. Open `src/components/landing/Features.tsx` and find the array of feature objects (titles, descriptions, icons). Replace with:

```typescript
const features = [
  {
    icon: BarChart3,
    title: "Structured data, every time",
    description:
      "Every interview scored across four dimensions — communication quality, thinking & engagement, interview presence, and response authenticity. Same framework, every candidate.",
  },
  {
    icon: GitCompare,  // use ArrowLeftRight or GitCompare from lucide
    title: "Compare candidates side by side",
    description:
      "See who was most engaged, most consistent, most present. Radar charts and score timelines make the comparison visual and defensible.",
  },
  {
    icon: Shield,
    title: "Defend every decision",
    description:
      "Every hire backed by objective, timestamped data. Full report available to your whole hiring team the moment the call ends.",
  },
]
```

Check what icons are already imported in Features.tsx and use ones that are already there, or add `BarChart3`, `ArrowLeftRight`, `Shield` from lucide-react.

Remove any feature card that mentions "fraud", "AI detection", "authenticity detection", or "catching" candidates.

- [ ] **Step 3: Update CTASection.tsx**

Open `src/components/landing/CTASection.tsx`. Find the primary CTA button. Change its text and link:

```typescript
// Change from whatever it currently says to:
<Button size="lg" asChild className="...">
  <Link to="/demo">Book a Demo <ArrowRight size={16} className="ml-2" /></Link>
</Button>
```

Remove any secondary CTA that links to `/pricing`.

Also update the section headline if it references "authenticity" or "fraud". Change to something like:
```
"Ready to bring intelligence to your hiring process?"
```

- [ ] **Step 4: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/Hero.tsx src/components/landing/Features.tsx src/components/landing/CTASection.tsx
git commit -m "feat: rewrite landing page for interview intelligence positioning — remove authenticity/fraud language"
```

---

## Task 7: Demo Request Edge Function

**Files:**
- Create: `supabase/functions/send-demo-request/index.ts`

**Interfaces:**
- Receives POST: `{ name: string, company: string, role: string, volume: string, message?: string }`
- Sends Postmark email to `patrick@boxfordpartners.com`
- Returns: `{ success: true }` or `{ error: string }`

- [ ] **Step 1: Create the edge function**

```typescript
// supabase/functions/send-demo-request/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const { name, company, role, volume, message } = await req.json()

    if (!name || !company || !role || !volume) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const postmarkKey = Deno.env.get("POSTMARK_API_KEY")
    if (!postmarkKey) {
      return new Response(JSON.stringify({ error: "POSTMARK_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const htmlBody = `
      <h2>New TrueVoice HQ Demo Request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:480px">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Company</td><td style="padding:8px 0;font-weight:600">${company}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Role</td><td style="padding:8px 0;font-weight:600">${role}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Interviews/month</td><td style="padding:8px 0;font-weight:600">${volume}</td></tr>
        ${message ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Message</td><td style="padding:8px 0">${message}</td></tr>` : ""}
      </table>
    `

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify({
        From: "hello@truevoicehq.com",
        To: "patrick@boxfordpartners.com",
        Subject: `Demo request — ${name} at ${company}`,
        HtmlBody: htmlBody,
        TextBody: `Demo request\n\nName: ${name}\nCompany: ${company}\nRole: ${role}\nInterviews/month: ${volume}${message ? `\nMessage: ${message}` : ""}`,
        MessageStream: "outbound",
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error("[send-demo-request] Postmark error:", err)
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("[send-demo-request] Error:", err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
```

- [ ] **Step 2: Deploy the function**

```bash
supabase functions deploy send-demo-request
```
Expected: `Deployed: send-demo-request`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-demo-request/index.ts
git commit -m "feat: send-demo-request edge function — Postmark email to patrick@boxfordpartners.com"
```

---

## Task 8: Demo Request Page and Replace Pricing Page

**Files:**
- Create: `src/pages/DemoRequest.tsx`
- Modify: `src/pages/Pricing.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- `DemoRequest` is a public page (no auth required)
- Calls `supabase.functions.invoke("send-demo-request", { body: {...} })`

- [ ] **Step 1: Create DemoRequest.tsx**

```typescript
// src/pages/DemoRequest.tsx
import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import Footer from "@/components/landing/Footer"

const ease = [0.16, 1, 0.3, 1]

const DemoRequest = () => {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [volume, setVolume] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: fnError } = await supabase.functions.invoke("send-demo-request", {
        body: { name, company, role, volume, message: message || undefined },
      })
      if (fnError) throw fnError
      setSubmitted(true)
    } catch (err) {
      setError("Something went wrong. Please email us directly at hello@truevoicehq.com")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back
          </Link>

          {submitted ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-8 w-8 text-success" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">We'll be in touch</h1>
              <p className="text-muted-foreground leading-relaxed">
                Thanks, {name.split(" ")[0]}. Expect to hear from us within 24 hours.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Book a Demo</h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Tell us a bit about your team and we'll set up a personalized walkthrough.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jordan Smith"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    placeholder="Acme Corp"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role">Your role</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    placeholder="VP of Talent, Head of People, etc."
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="volume">Estimated interviews per month</Label>
                  <Select value={volume} onValueChange={setVolume} required>
                    <SelectTrigger id="volume" className="h-10">
                      <SelectValue placeholder="Select a range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<10">Fewer than 10</SelectItem>
                      <SelectItem value="10-50">10 – 50</SelectItem>
                      <SelectItem value="50-200">50 – 200</SelectItem>
                      <SelectItem value="200+">More than 200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">
                    Anything else? <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your hiring process, current pain points, or specific questions."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || !volume}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Request Demo"
                  )}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export default DemoRequest
```

- [ ] **Step 2: Replace Pricing.tsx**

Replace the entire Pricing page with a simple redirect to the demo page:

```typescript
// src/pages/Pricing.tsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

const Pricing = () => {
  const navigate = useNavigate()
  useEffect(() => { navigate("/demo", { replace: true }) }, [navigate])
  return null
}

export default Pricing
```

- [ ] **Step 3: Register the `/demo` route in App.tsx**

Open `src/App.tsx`. The `/demo` route already exists pointing to the old `Demo` page. Update it to point to `DemoRequest`:

```typescript
// Add import at top:
import DemoRequest from "./pages/DemoRequest"

// Change the route (find the existing /demo route):
<Route path="/demo" element={<DemoRequest />} />
```

Remove the import for the old `Demo` page if it's no longer used anywhere else.

- [ ] **Step 4: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DemoRequest.tsx src/pages/Pricing.tsx src/App.tsx
git commit -m "feat: add DemoRequest page at /demo; redirect /pricing to /demo; remove self-serve Stripe flow"
```

---

## Task 9: Report Tokens Migration and Public Report Edge Function

**Files:**
- Create: `supabase/migrations/20260707_report_tokens.sql`
- Create: `supabase/functions/get-public-report/index.ts`

**Interfaces:**
- Migration creates `report_tokens` table with RLS
- Edge function: `GET /get-public-report?token=<uuid>` → returns `FullReport`-shaped JSON, no auth required

- [ ] **Step 1: Create the migration**

```sql
-- supabase/migrations/20260707_report_tokens.sql
create table if not exists report_tokens (
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

-- Anyone can read a token row by its value (for the public report link)
create policy "public token read"
  on report_tokens for select
  using (true);
```

- [ ] **Step 2: Apply the migration**

```bash
supabase db push
```
Expected: migration applied with no errors. Verify in Supabase dashboard → Table Editor → `report_tokens` exists.

- [ ] **Step 3: Create the get-public-report edge function**

```typescript
// supabase/functions/get-public-report/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Look up the token
  const { data: tokenRow, error: tokenError } = await supabase
    .from("report_tokens")
    .select("interview_id")
    .eq("token", token)
    .single()

  if (tokenError || !tokenRow) {
    return new Response(JSON.stringify({ error: "Invalid or expired link" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const interviewId = tokenRow.interview_id

  // Fetch all report data in parallel
  const [interviewRes, reportRes, flagsRes, timelineRes, delaysRes] = await Promise.all([
    supabase.from("interviews").select("*").eq("id", interviewId).single(),
    supabase.from("interview_reports").select("*").eq("interview_id", interviewId).maybeSingle(),
    supabase.from("interview_flags").select("*").eq("interview_id", interviewId).order("created_at", { ascending: true }),
    supabase.from("interview_timeline").select("*").eq("interview_id", interviewId).order("created_at", { ascending: true }),
    supabase.from("response_delays").select("*").eq("interview_id", interviewId).order("created_at", { ascending: true }),
  ])

  if (interviewRes.error || !interviewRes.data) {
    return new Response(JSON.stringify({ error: "Report not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  return new Response(
    JSON.stringify({
      interview: interviewRes.data,
      report: reportRes.data ?? null,
      flags: flagsRes.data ?? [],
      timeline: timelineRes.data ?? [],
      responseDelays: delaysRes.data ?? [],
      interviewer: null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
```

- [ ] **Step 4: Deploy the function**

```bash
supabase functions deploy get-public-report
```
Expected: `Deployed: get-public-report`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260707_report_tokens.sql supabase/functions/get-public-report/index.ts
git commit -m "feat: report_tokens table + get-public-report edge function for shareable links"
```

---

## Task 10: ShareReportButton Component

**Files:**
- Create: `src/components/ShareReportButton.tsx`
- Modify: `src/pages/Report.tsx` (add the button to the header)

**Interfaces:**
- Props: `{ interviewId: string }`
- Inserts into `report_tokens`, constructs URL, copies to clipboard

- [ ] **Step 1: Create ShareReportButton.tsx**

```typescript
// src/components/ShareReportButton.tsx
import { useState } from "react"
import { Share2, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ShareReportButtonProps {
  interviewId: string
}

export function ShareReportButton({ interviewId }: ShareReportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleShare = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("report_tokens")
        .insert({ interview_id: interviewId })
        .select("token")
        .single()

      if (error) throw error

      const url = `${window.location.origin}/r/${data.token}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ title: "Report link copied", description: "Anyone with this link can view the report." })
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      toast({ title: "Failed to generate link", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied!" : "Share Report"}
    </Button>
  )
}
```

- [ ] **Step 2: Add ShareReportButton to Report.tsx header**

Open `src/pages/Report.tsx`. Find the header action buttons (near `Download` and `Share2` icons). Add:

```typescript
// Add import:
import { ShareReportButton } from "@/components/ShareReportButton"

// In the header button group, add alongside existing buttons:
{data?.interview?.id && (
  <ShareReportButton interviewId={data.interview.id} />
)}
```

The existing `Share2` standalone button can be removed since `ShareReportButton` replaces its function.

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ShareReportButton.tsx src/pages/Report.tsx
git commit -m "feat: ShareReportButton — generates token-based public report link, copies to clipboard"
```

---

## Task 11: Public Report Page

**Files:**
- Create: `src/pages/PublicReport.tsx`
- Modify: `src/App.tsx` (add `/r/:token` route)

**Interfaces:**
- Fetches via `supabase.functions.invoke("get-public-report", { body: { token } })` — no auth
- Reuses `ScoreGauge`, `MiniRadar`, `ScoreBadge`, `SCORE_LABELS`
- No sidebar, no nav, no action buttons

- [ ] **Step 1: Create PublicReport.tsx**

```typescript
// src/pages/PublicReport.tsx
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Shield, Loader2, AlertTriangle } from "lucide-react"
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"
import { ScoreGauge, getScoreColor } from "@/components/ScoreGauge"
import { MiniRadar } from "@/components/dashboard/MiniRadar"
import { SCORE_LABELS } from "@/lib/scoreLabels"
import { supabase } from "@/lib/supabase"
import type { FullReport } from "@/types"

const ease = [0.16, 1, 0.3, 1]

const severityColor = (s: string) =>
  s === "high" ? "text-destructive" : s === "medium" ? "text-warning" : "text-muted-foreground"
const severityBg = (s: string) =>
  s === "high"
    ? "bg-destructive/10 border-destructive/20"
    : s === "medium"
    ? "bg-warning/10 border-warning/20"
    : "bg-muted/30 border-border"

const PublicReport = () => {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<FullReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    supabase.functions
      .invoke("get-public-report", { body: { token } })
      .then(({ data: res, error: err }) => {
        if (err || !res) {
          setError("This report link is invalid or has expired.")
        } else {
          setData(res as FullReport)
        }
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold mb-2">Link not found</h1>
          <p className="text-muted-foreground text-sm">{error ?? "This report link is invalid or has expired."}</p>
        </div>
      </div>
    )
  }

  const { interview, report, flags, timeline } = data

  const radarData = report ? [
    { subject: SCORE_LABELS.speech, value: ((report.speech_score ?? 0) / 25) * 100 },
    { subject: SCORE_LABELS.timing, value: ((report.timing_score ?? 0) / 25) * 100 },
    { subject: SCORE_LABELS.flow, value: ((report.flow_score ?? 0) / 25) * 100 },
    { subject: SCORE_LABELS.linguistic, value: ((report.linguistic_score ?? 0) / 25) * 100 },
  ] : []

  const timelineData = timeline.map((t) => ({ name: t.minute, score: t.score }))

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" strokeWidth={1.8} />
          <span className="font-semibold text-sm tracking-tight">TrueVoice HQ</span>
        </div>
        <span className="text-xs text-muted-foreground">Interview Report</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Candidate + score */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">{interview.candidate_name}</h1>
            <p className="text-muted-foreground mt-0.5">{interview.position}</p>
          </div>
          {report && (
            <ScoreGauge score={report.overall_score ?? 0} size={100} />
          )}
        </motion.div>

        {/* Summary */}
        {report?.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4">
            {report.summary}
          </p>
        )}

        {/* Radar + Timeline side by side */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Dimension Breakdown</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {timelineData.length > 0 && (
              <div className="glass-card rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Score Over Time</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={timelineData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Behavioral signals */}
        {flags.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{SCORE_LABELS.flags}</p>
            <div className="space-y-2">
              {flags.map((f, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${severityBg(f.severity)}`}>
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${f.severity === "high" ? "bg-destructive" : f.severity === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${severityColor(f.severity)}`}>{f.pattern}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">at {f.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report?.recommendations && Array.isArray(report.recommendations) && report.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recommendations</p>
            <ul className="space-y-2">
              {report.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a href="https://truevoicehq.com" className="text-primary hover:underline">TrueVoice HQ</a>
            {" "}· A Boxford Partners Company
          </p>
        </div>
      </main>
    </div>
  )
}

export default PublicReport
```

- [ ] **Step 2: Add the route to App.tsx**

```typescript
// Add import:
import PublicReport from "./pages/PublicReport"

// Add public route (before the protected routes block):
<Route path="/r/:token" element={<PublicReport />} />
```

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PublicReport.tsx src/App.tsx
git commit -m "feat: public report page at /r/:token — unauthenticated full report view for shareable links"
```

---

## Task 12: Position Analytics Tab on Dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Goal:** Add a "Positions" tab to the existing `ViewMode` selector. When selected, renders a list of unique positions from the company's interviews, each showing avg Intelligence Score, interview count, and top 3 candidate names by score.

- [ ] **Step 1: Update ViewMode type in Dashboard.tsx**

Find:
```typescript
type ViewMode = "cards" | "table" | "calendar" | "candidates"
```
Replace with:
```typescript
type ViewMode = "cards" | "table" | "calendar" | "candidates" | "positions"
```

- [ ] **Step 2: Add the Positions tab button**

Find the view mode selector buttons (the `LayoutGrid`, `Table2`, `CalendarDays`, `Users` icon buttons). Add after them:

```typescript
<button
  onClick={() => setView("positions")}
  className={cn(
    "p-1.5 rounded-md transition-colors",
    view === "positions" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
  )}
  title="Positions"
>
  <BarChart3 className="h-4 w-4" />
</button>
```

`BarChart3` is already imported in Dashboard.tsx.

- [ ] **Step 3: Compute positions data**

Add a `useMemo` after the existing memos in Dashboard:

```typescript
const positionsData = useMemo(() => {
  if (!completedReports) return []
  const map = new Map<string, { scores: number[]; candidates: { name: string; score: number; id: string }[] }>()
  completedReports.forEach((r: any) => {
    if (!r) return
    const pos = r.position || "Unknown Position"
    if (!map.has(pos)) map.set(pos, { scores: [], candidates: [] })
    const entry = map.get(pos)!
    entry.scores.push(r.overall ?? 0)
    entry.candidates.push({ name: r.candidate, score: r.overall ?? 0, id: r.id })
  })
  return Array.from(map.entries())
    .map(([position, { scores, candidates }]) => ({
      position,
      count: scores.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      top3: [...candidates].sort((a, b) => b.score - a.score).slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count)
}, [completedReports])
```

You will need `completedReports` — check if Dashboard already imports `useCompletedReports`. If not:
```typescript
import { useCompletedReports } from "@/hooks/useReport"
// and in the component:
const { data: completedReports } = useCompletedReports()
```

- [ ] **Step 4: Render the Positions view**

In the section where other views are conditionally rendered (the `view === "cards"`, `view === "table"` etc. blocks), add:

```typescript
{view === "positions" && (
  <div className="space-y-3">
    {positionsData.length === 0 ? (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No completed interviews yet.
      </div>
    ) : positionsData.map((pos) => (
      <div key={pos.position} className="glass-card rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">{pos.position}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pos.count} interview{pos.count !== 1 ? "s" : ""} · avg score{" "}
              <span className={`font-semibold ${getScoreColor(pos.avg)}`}>{pos.avg}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {pos.top3.map((c) => (
            <Link
              key={c.id}
              to={`/report/${c.id}`}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-accent/20 transition-colors"
            >
              <span className={`font-semibold tabular-nums ${getScoreColor(c.score)}`}>{c.score}</span>
              <span className="text-muted-foreground">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    ))}
  </div>
)}
```

`getScoreColor` is already imported from `@/components/ScoreGauge` in Dashboard.tsx — if not, add the import.

- [ ] **Step 5: Build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: Positions analytics tab on dashboard — avg score, count, top 3 candidates per position"
```

---

## Task 13: Final Build and Deploy

- [ ] **Step 1: Full build**

```bash
npm run build
```
Expected: no TypeScript errors. Bundle warning about chunk size is acceptable.

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: all tests pass (or pre-existing failures only — don't introduce new failures).

- [ ] **Step 3: Push to remote**

```bash
git push
```

- [ ] **Step 4: Deploy to Vercel**

Vercel auto-deploys on push to main. Monitor at https://vercel.com/patrickboxfordpartners/true-voice-insights or:
```bash
npx vercel --prod
```

- [ ] **Step 5: Smoke test production**

1. Visit https://truevoicehq.com — verify "Every interview, analyzed." hero, no pricing section, "Book a Demo" CTA
2. Visit https://truevoicehq.com/demo — verify form renders and submits (check email arrives at patrick@boxfordpartners.com)
3. Visit https://truevoicehq.com/pricing — verify it redirects to /demo
4. Log in, open a completed report, click "Share Report" — verify link copies and `/r/[token]` renders the report without auth
5. Log in, open Dashboard → Positions tab — verify positions list renders

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Fix scores returning zeros | Task 5 |
| Fix compare page mock data | Task 4 |
| Audit analytics page | Analytics.tsx already uses live hooks — confirmed in code read, no changes needed |
| Score label rename via `scoreLabels.ts` | Tasks 1–4 |
| Rewrite landing page | Task 6 |
| Replace pricing page with demo request | Task 8 |
| Demo request edge function + Postmark | Tasks 7–8 |
| `report_tokens` table + migration | Task 9 |
| `get-public-report` edge function | Task 9 |
| `ShareReportButton` component | Task 10 |
| Public report page `/r/[token]` | Task 11 |
| Position analytics tab | Task 12 |
| Remove Stripe self-serve from front door | Task 8 (Pricing.tsx redirects, no checkout buttons in DemoRequest) |
| No "fraud detection" / "authenticity" language on public pages | Task 6 |

**All spec requirements covered. No placeholders. Types consistent across tasks.**
