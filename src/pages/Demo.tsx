"use client";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ArrowLeft, AlertTriangle, Clock, TrendingUp, BarChart3,
  Activity, Lightbulb, X, Calendar, Users,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, ReferenceDot,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ScoreGauge, getScoreColor } from "@/components/ScoreGauge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { MiniRadar } from "@/components/dashboard/MiniRadar";
import { Progress } from "@/components/ui/progress";
import { candidateReports, type CandidateReport } from "@/data/mockCandidates";

const getDelayColor = (delay: number) => {
  if (delay < 1.5) return "hsl(0, 84%, 60%)";
  if (delay > 4) return "hsl(38, 92%, 50%)";
  return "hsl(160, 84%, 39%)";
};

const severityBg = (s: string) =>
  s === "high"
    ? "bg-destructive/10 border-destructive/20"
    : s === "medium"
    ? "bg-warning/10 border-warning/20"
    : "bg-muted/30 border-border";

const severityIcon = (s: string) =>
  s === "high" ? "bg-destructive" : s === "medium" ? "bg-warning" : "bg-muted-foreground";

const CANDIDATES = Object.values(candidateReports);

const scoreLabel = (s: number) =>
  s >= 75 ? "High Authenticity" : s >= 50 ? "Moderate" : "Low Authenticity";

function DemoReport({
  candidate,
  onBack,
}: {
  candidate: CandidateReport;
  onBack: () => void;
}) {
  const timelineData = candidate.timeline.map((t) => ({ min: t.min, score: t.score }));
  const delayData = candidate.responseDelays;

  const highFlags = candidate.flags.filter((f) => f.severity === "high").length;
  const medFlags = candidate.flags.filter((f) => f.severity === "medium").length;
  const lowFlags = candidate.flags.filter((f) => f.severity === "low").length;

  const sub = {
    speech: candidate.speech,
    timing: candidate.timing,
    flow: candidate.flow,
    linguistic: candidate.linguistic,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg">
              <span className="font-extrabold uppercase">TRUE</span>
              <span className="font-medium text-foreground/70">voice</span>
              <span className="font-medium text-gradient">HQ</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Demo banner */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
        <span className="font-semibold text-primary">Demo Mode</span>
        <span className="text-muted-foreground">—</span>
        <span className="text-muted-foreground">This is sample data. No real candidates.</span>
        <Link to="/signup" className="text-primary font-medium hover:underline ml-2">
          Get started →
        </Link>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{candidate.candidate}</h1>
              <p className="text-muted-foreground">{candidate.position}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {candidate.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {candidate.duration}
                </span>
                <span>Interviewer: {candidate.interviewer}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xl">
                {candidate.notes}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <ScoreGauge score={candidate.overall} size={100} strokeWidth={8} />
              <MiniRadar
                speech={sub.speech}
                timing={sub.timing}
                flow={sub.flow}
                linguistic={sub.linguistic}
                overall={candidate.overall}
                size={100}
              />
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Interview Timeline
            </h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {highFlags > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  {highFlags} high
                </span>
              )}
              {medFlags > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  {medFlags} medium
                </span>
              )}
              {lowFlags > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                  {lowFlags} low
                </span>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timelineData} margin={{ top: 20, right: 10, bottom: 10, left: 10 }}>
              <defs>
                <linearGradient id="demoScoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="min"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Minutes",
                  position: "insideBottomRight",
                  offset: -5,
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload?.length) {
                    return (
                      <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg border border-border">
                        <p className="font-medium">Minute {label}</p>
                        <p className="text-primary">Score: {payload[0].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="url(#demoScoreGrad)"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
              />
              {candidate.flags.map((flag, i) => {
                const parts = flag.time.split(":");
                const min = parts.length >= 2 ? parseInt(parts[0], 10) : 0;
                const color =
                  flag.severity === "high"
                    ? "hsl(0, 84%, 60%)"
                    : flag.severity === "medium"
                    ? "hsl(38, 92%, 50%)"
                    : "hsl(var(--muted-foreground))";
                const point = timelineData.find((t) => {
                  const tMin = parseInt(String(t.min).split(":")[0], 10);
                  return tMin === min || Math.abs(tMin - min) <= 5;
                });
                const score = point?.score ?? 50;
                return (
                  <ReferenceDot
                    key={i}
                    x={point?.min ?? `${min}:00`}
                    y={score}
                    r={6}
                    fill={color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Flags + Score Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Detected Patterns
            </h2>
            {candidate.flags.length > 0 ? (
              <div className="space-y-2">
                {candidate.flags.map((flag, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${severityBg(flag.severity)}`}
                  >
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${severityIcon(flag.severity)}`} />
                    <div>
                      <p className="text-sm leading-relaxed">{flag.pattern}</p>
                      <p className="text-xs text-muted-foreground mt-1">{flag.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No significant patterns detected.</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Score Breakdown
            </h2>
            <div className="space-y-4">
              {[
                { label: "Speech Patterns", score: sub.speech, desc: "Natural cadence vs. scripted delivery" },
                { label: "Response Timing", score: sub.timing, desc: "Natural thinking pauses vs. instant recall" },
                { label: "Conversational Flow", score: sub.flow, desc: "Engaged dialogue vs. monologue" },
                { label: "Linguistic Authenticity", score: sub.linguistic, desc: "Spoken language vs. written/formal" },
              ].map((dim) => (
                <div key={dim.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{dim.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${getScoreColor(dim.score * 4)}`}>
                      {dim.score}/25
                    </span>
                  </div>
                  <Progress value={(dim.score / 25) * 100} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{dim.desc}</p>
                </div>
              ))}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Engagement</span>
                  <span className={`text-sm font-bold tabular-nums ${getScoreColor(candidate.engagement)}`}>
                    {candidate.engagement}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  <span className={`text-sm font-bold tabular-nums ${getScoreColor(candidate.confidence)}`}>
                    {candidate.confidence}/100
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Response Timing Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-xl p-6 mb-6"
        >
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Response Delay Per Question
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            <span className="inline-block h-2 w-2 rounded-full bg-success mr-1" />
            Natural (1.5-4s)
            <span className="inline-block h-2 w-2 rounded-full bg-destructive mr-1 ml-3" />
            Too fast (&lt;1.5s)
            <span className="inline-block h-2 w-2 rounded-full bg-warning mr-1 ml-3" />
            Slow (&gt;4s)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={delayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="question"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                unit="s"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload?.length) {
                    const d = delayData.find((dd) => dd.question === payload[0]?.payload?.question);
                    return (
                      <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg border border-border">
                        <p className="font-medium">{d?.label}</p>
                        <p className="text-primary">{payload[0].value}s response time</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="delay" radius={[4, 4, 0, 0]}>
                {delayData.map((entry, index) => (
                  <Cell key={index} fill={getDelayColor(entry.delay)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6 mb-8"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Suggested Next Steps
          </h2>
          <ul className="space-y-2">
            <li className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-success mt-0.5">&#10003;</span> Review the full transcript for context
            </li>
            <li className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-success mt-0.5">&#10003;</span> Compare with other candidates using the Compare tool
            </li>
            {candidate.flags.some((f) => f.severity === "high") && (
              <li className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-destructive mt-0.5">!</span> High-severity flags detected — consider a follow-up technical screen
              </li>
            )}
          </ul>
          <div className="mt-6">
            <Link to="/signup">
              <Button className="gap-2">
                <Calendar className="h-4 w-4" />
                Get started to interview real candidates
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const selected = selectedId ? candidateReports[selectedId] : null;

  if (selected) {
    return <DemoReport candidate={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg">
              <span className="font-extrabold uppercase">TRUE</span>
              <span className="font-medium text-foreground/70">voice</span>
              <span className="font-medium text-gradient">HQ</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Demo banner */}
      {!dismissed && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm mx-auto">
            <span className="font-semibold text-primary">Demo Mode</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-muted-foreground">
              Explore the dashboard with sample candidates. No signup required.
            </span>
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Get started →
            </Link>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Interviews", value: "4" },
            { label: "Completed", value: "4" },
            { label: "Avg Score", value: "68" },
            { label: "Flags Raised", value: "8" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Candidate cards */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Recent Interviews
          </h2>
          <span className="text-xs text-muted-foreground">{CANDIDATES.length} candidates</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {CANDIDATES.sort((a, b) => b.overall - a.overall).map((c, i) => {
            const highestSeverity = c.flags.length > 0
              ? c.flags.some((f) => f.severity === "high")
                ? "high"
                : c.flags.some((f) => f.severity === "medium")
                ? "medium"
                : "low"
              : null;

            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedId(c.id)}
                className="glass-card rounded-xl p-5 text-left hover:ring-2 hover:ring-primary/30 transition-all group w-full"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate group-hover:text-primary transition-colors">
                      {c.candidate}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{c.position}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.date}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <ScoreBadge score={c.overall} />
                    <span className={`text-xs ${getScoreColor(c.overall)}`}>
                      {scoreLabel(c.overall)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MiniRadar
                      speech={c.speech}
                      timing={c.timing}
                      flow={c.flow}
                      linguistic={c.linguistic}
                      overall={c.overall}
                      size={52}
                    />
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Speech: {c.speech}/25</p>
                      <p>Timing: {c.timing}/25</p>
                      <p>Flow: {c.flow}/25</p>
                    </div>
                  </div>
                  {c.flags.length > 0 && highestSeverity && (
                    <div
                      className={`text-xs px-2 py-1 rounded-full border ${
                        highestSeverity === "high"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : highestSeverity === "medium"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {c.flags.length} flag{c.flags.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground line-clamp-2">
                  {c.notes}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 glass-card rounded-xl p-8 text-center"
        >
          <Shield className="h-10 w-10 text-primary mx-auto mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-2">Ready to analyze your own interviews?</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            TrueVoice HQ detects reading cadence, instant responses, and linguistic patterns that
            flag AI-assisted answers — in real time.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/signup">
              <Button size="lg">Get started</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg">View pricing</Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
