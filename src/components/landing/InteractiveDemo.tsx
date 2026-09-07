import { useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Play,
  BarChart3,
  Globe,
  Brain,
  Sparkles,
  Radio,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Eye,
  ChevronRight,
  RotateCcw,
  Shield,
  Zap,
  Mail,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDemo, type DemoAct } from "@/hooks/useDemo";
import ScrollReveal from "@/components/ScrollReveal";

const ease = [0.16, 1, 0.3, 1];

const STAGE_ICONS: Record<string, React.ElementType> = {
  chart: BarChart3,
  globe: Globe,
  brain: Brain,
  sparkles: Sparkles,
  radio: Radio,
};

// ── Score Ring ─────────────────────────────────────────────────

function ScoreRing({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 80 ? "hsl(160, 84%, 39%)" : value >= 60 ? "hsl(40, 90%, 50%)" : "hsl(0, 84%, 60%)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={4} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease }}
        />
      </svg>
      <motion.span
        className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums"
        animate={{ color }}
        transition={{ duration: 0.3 }}
      >
        {value}
      </motion.span>
    </div>
  );
}

// ── Score Bar ──────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-accent" : value >= 60 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease }}
        />
      </div>
    </div>
  );
}

// ── Act 1: Interview Simulation ───────────────────────────────

function ActInterview({ demo }: { demo: ReturnType<typeof useDemo> }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Transcript panel */}
      <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5 shadow-soft min-h-[320px]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Interview</span>
        </div>
        <div className="space-y-3 max-h-[280px] overflow-hidden">
          <AnimatePresence>
            {demo.transcript.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="flex gap-3"
              >
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  line.speaker === "interviewer"
                    ? "bg-accent/20 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {line.speaker === "interviewer" ? "I" : "C"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium">
                      {line.speaker === "interviewer" ? "Interviewer" : "Candidate"}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{line.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{line.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Scores panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Authenticity Score</p>
          <div className="flex items-center gap-4 mb-4">
            <ScoreRing value={demo.scores.overall} />
            <div className="flex-1 space-y-2">
              <ScoreBar label="Speech" value={demo.scores.speech} />
              <ScoreBar label="Timing" value={demo.scores.timing} />
              <ScoreBar label="Flow" value={demo.scores.flow} />
              <ScoreBar label="Linguistic" value={demo.scores.linguistic} />
            </div>
          </div>
        </div>

        {/* Flags */}
        <AnimatePresence>
          {demo.flags.map((flag, i) => (
            <motion.div
              key={flag}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-destructive">Flag Detected</p>
                <p className="text-xs text-muted-foreground mt-0.5">{flag}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Act 2: Pipeline Visualization ─────────────────────────────

function ActPipeline({ demo }: { demo: ReturnType<typeof useDemo> }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intelligence Pipeline</span>
        </div>

        <div className="space-y-3">
          {demo.pipelineStages.map((stage, i) => {
            const Icon = STAGE_ICONS[stage.icon] || Sparkles;
            return (
              <motion.div
                key={stage.id}
                className={`flex items-center gap-4 rounded-lg p-3 transition-colors ${
                  stage.status === "running"
                    ? "bg-accent/10 border border-accent/20"
                    : stage.status === "complete"
                      ? "bg-accent/5 border border-transparent"
                      : "bg-muted/30 border border-transparent"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease }}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  stage.status === "complete"
                    ? "bg-accent/20"
                    : stage.status === "running"
                      ? "bg-accent/30"
                      : "bg-muted"
                }`}>
                  {stage.status === "complete" ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : stage.status === "running" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Icon className="h-4 w-4 text-accent" />
                    </motion.div>
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    stage.status === "waiting" ? "text-muted-foreground" : "text-foreground"
                  }`}>
                    {stage.label}
                  </p>
                  {stage.status === "complete" && stage.detail && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground"
                    >
                      {stage.detail}
                    </motion.p>
                  )}
                </div>

                {stage.status === "complete" && stage.duration && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {(stage.duration / 1000).toFixed(1)}s
                  </span>
                )}
                {stage.status === "running" && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-accent"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Act 3: Approval Queue ─────────────────────────────────────

function ActApproval({ demo }: { demo: ReturnType<typeof useDemo> }) {
  const recConfig = {
    advance: { color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", label: "Advance" },
    review: { color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Review" },
    reject: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Reject" },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-accent" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Joan's Recommendations</span>
        <Badge variant="secondary" className="text-[10px]">
          {demo.candidates.filter(c => !c.resolved).length} pending
        </Badge>
      </div>

      <AnimatePresence mode="popLayout">
        {demo.candidates.map((candidate, i) => {
          if (candidate.resolved) return null;
          const cfg = recConfig[candidate.brief.recommendation];
          const isActive = i === demo.activeCandidateIndex;

          return (
            <motion.div
              key={candidate.name}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -80, transition: { duration: 0.3 } }}
              className={`bg-card border rounded-xl p-5 shadow-soft transition-all ${
                isActive ? `${cfg.border} border` : "border-border"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${cfg.color}`}>{candidate.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground">{candidate.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border} border text-[10px]`}>
                    {cfg.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Brain className="h-3.5 w-3.5" />
                    <span className="font-medium tabular-nums">{candidate.brief.confidenceScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{candidate.brief.summary}</p>

              {/* Evidence */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, ease }}
                  className="mb-4 space-y-2"
                >
                  {candidate.brief.strengths.length > 0 && (
                    <div className="space-y-1">
                      {candidate.brief.strengths.map((s, j) => (
                        <div key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                  {candidate.brief.risks.length > 0 && (
                    <div className="space-y-1">
                      {candidate.brief.risks.map((r, j) => (
                        <div key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                          {r}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                    <Zap className="h-3 w-3" />
                    Sources: {candidate.brief.sources.join(", ")}
                  </div>
                </motion.div>
              )}

              {/* Action buttons */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <Button
                    size="sm"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5 text-xs"
                    onClick={() => demo.resolveCandidate(i, "approved")}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5 text-xs"
                    onClick={() => demo.resolveCandidate(i, "rejected")}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => demo.resolveCandidate(i, "modified")}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Modify
                  </Button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ── Act labels ────────────────────────────────────────────────

const ACT_LABELS: Record<DemoAct, { num: string; title: string; subtitle: string }> = {
  idle: { num: "", title: "", subtitle: "" },
  interview: { num: "01", title: "The Interview", subtitle: "Real-time authenticity scoring as the conversation unfolds" },
  pipeline: { num: "02", title: "The Intelligence", subtitle: "Four agents analyze the candidate in parallel" },
  approval: { num: "03", title: "The Decision", subtitle: "Joan recommends. You decide." },
  complete: { num: "", title: "That's TrueVoice.", subtitle: "Every interview analyzed. Every decision defended." },
};

// ── Main Component ────────────────────────────────────────────

export default function InteractiveDemo() {
  const demo = useDemo();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const actLabel = ACT_LABELS[demo.act];

  return (
    <section ref={sectionRef} className="py-24 sm:py-28 px-4 sm:px-6" id="demo">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-12">
          <p className="text-sm font-medium tracking-wide text-accent uppercase mb-3">See it in action</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Watch Joan work
          </h2>
          <p className="text-muted-foreground text-lg mt-4 max-w-xl mx-auto">
            From live interview to hiring decision in under 30 seconds.
          </p>
        </ScrollReveal>

        {/* Demo container */}
        <div className="relative">
          {/* Act header */}
          <AnimatePresence mode="wait">
            {demo.act !== "idle" && (
              <motion.div
                key={demo.act}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.4, ease }}
                className="text-center mb-8"
              >
                {actLabel.num && (
                  <span className="text-xs font-semibold tracking-widest text-accent uppercase">
                    Act {actLabel.num}
                  </span>
                )}
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">{actLabel.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{actLabel.subtitle}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idle state */}
          {demo.act === "idle" && (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button
                size="lg"
                onClick={demo.start}
                className="rounded-md bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated gap-2"
              >
                <Play size={16} />
                Start Demo
              </Button>
            </motion.div>
          )}

          {/* Acts */}
          <AnimatePresence mode="wait">
            {demo.act === "interview" && (
              <motion.div
                key="interview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ActInterview demo={demo} />
              </motion.div>
            )}
            {demo.act === "pipeline" && (
              <motion.div
                key="pipeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ActPipeline demo={demo} />
              </motion.div>
            )}
            {demo.act === "approval" && (
              <motion.div
                key="approval"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ActApproval demo={demo} />
              </motion.div>
            )}
            {demo.act === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease }}
                className="text-center py-12"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={demo.reset}
                  className="gap-2 mb-8"
                >
                  <RotateCcw size={14} />
                  Watch again
                </Button>
                <div className="mt-4">
                  <Button
                    size="lg"
                    asChild
                    className="rounded-md bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
                  >
                    <a href="https://cal.com/boxfordpartners/truevoice-demo" target="_blank" rel="noopener noreferrer">
                      Book a Demo
                      <ChevronRight size={16} className="ml-1" />
                    </a>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
