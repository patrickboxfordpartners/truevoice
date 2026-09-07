import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Users,
  TrendingUp,
  UserCheck,
  UserX,
  Printer,
  CheckCircle2,
  Mail,
  ArrowRight,
  Bell,
  AlertTriangle,
  StickyNote,
  UserPlus,
  Zap,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JoanAvatar } from "@/components/JoanAvatar";
import { format, subDays } from "date-fns";

const ACCENT = "hsl(160, 84%, 39%)";

const STAGE_COLORS: Record<string, string> = {
  screening: "#3b82f6",
  technical: "#a855f7",
  final: "#f59e0b",
  offer: "#22c55e",
  hired: "#0fba81",
  rejected: "#ef4444",
};

const STAGE_LABELS: Record<string, string> = {
  screening: "Screening",
  technical: "Technical",
  final: "Final",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  extracted_action_items: CheckCircle2,
  routed_email: Mail,
  moved_pipeline_stage: ArrowRight,
  sent_reminder: Bell,
  enriched_candidate: UserPlus,
  flagged_risk: AlertTriangle,
  created_note: StickyNote,
};

const card = "glass-card rounded-xl border border-border/50 p-6";
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function JoanDigest() {
  const navigate = useNavigate();
  const stats = useQuery(api.queries.getDashboardStats, { companyId: "demo-company" });
  const activities = useQuery(api.queries.getJoanActivity, { companyId: "demo-company", limit: 30 });

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 7);
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }, []);

  const recentActivities = useMemo(() => {
    if (!activities) return [];
    return activities.slice(0, 10);
  }, [activities]);

  const stageOrder = ["screening", "technical", "final", "offer", "hired", "rejected"] as const;

  if (!stats || activities === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Generating digest...</span>
        </div>
      </div>
    );
  }

  const maxStageCount = Math.max(
    ...stageOrder.map((s) => stats.byStage[s]),
    1
  );

  const maxPosition = stats.positionBreakdown.length > 0
    ? Math.max(...stats.positionBreakdown.map((p) => p.count), 1)
    : 1;

  const scoreDist = stats.scoreDistribution;
  const scoreTotal = scoreDist.excellent + scoreDist.good + scoreDist.fair + scoreDist.poor;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/joan-pipeline")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Pipeline
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold">Weekly Hiring Digest</h1>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">{dateRange}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Section 1: Pipeline Snapshot */}
        <motion.div className={card} {...fadeUp} transition={{ delay: 0 }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Pipeline Snapshot
          </h2>
          <div className="space-y-3">
            {stageOrder.map((stage) => {
              const count = stats.byStage[stage];
              const pct = (count / maxStageCount) * 100;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-20 text-right text-muted-foreground">
                    {STAGE_LABELS[stage]}
                  </span>
                  <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full flex items-center justify-end pr-2"
                      style={{ backgroundColor: STAGE_COLORS[stage] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 8)}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      <span className="text-[10px] font-bold text-white">{count}</span>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-muted-foreground text-right">
            {stats.totalCandidates} total candidates
          </div>
        </motion.div>

        {/* Section 2: Key Metrics */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className={card}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Total Candidates</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.totalCandidates}</span>
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              </div>
            </div>

            <div className={card}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Avg Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold ${
                    (stats.avgScore ?? 0) >= 80
                      ? "text-emerald-600"
                      : (stats.avgScore ?? 0) >= 60
                        ? "text-blue-600"
                        : "text-amber-600"
                  }`}
                >
                  {stats.avgScore ?? "N/A"}
                </span>
                {stats.avgScore != null && (
                  <span className="text-xs text-muted-foreground">/100</span>
                )}
              </div>
            </div>

            <div className={card}>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Recent Hires</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.recentHires}</span>
              <span className="text-xs text-muted-foreground ml-1">last 30d</span>
            </div>

            <div className={card}>
              <div className="flex items-center gap-2 mb-2">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Recent Rejects</span>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">{stats.recentRejects}</span>
              <span className="text-xs text-muted-foreground ml-1">last 30d</span>
            </div>
          </div>
        </motion.div>

        {/* Section 3: Score Distribution */}
        <motion.div className={card} {...fadeUp} transition={{ delay: 0.2 }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Score Distribution
          </h2>
          {scoreTotal > 0 ? (
            <>
              <div className="h-8 rounded-full overflow-hidden flex">
                {[
                  { key: "excellent", color: "#22c55e", label: "80+" },
                  { key: "good", color: "#3b82f6", label: "60-79" },
                  { key: "fair", color: "#f59e0b", label: "40-59" },
                  { key: "poor", color: "#ef4444", label: "<40" },
                ].map(({ key, color }) => {
                  const val = scoreDist[key as keyof typeof scoreDist];
                  const pct = (val / scoreTotal) * 100;
                  if (pct === 0) return null;
                  return (
                    <motion.div
                      key={key}
                      className="h-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      {pct > 12 && (
                        <span className="text-[10px] font-bold text-white">{val}</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" /> Excellent ({scoreDist.excellent})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Good ({scoreDist.good})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Fair ({scoreDist.fair})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Poor ({scoreDist.poor})
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No scored candidates yet.</p>
          )}
        </motion.div>

        {/* Section 4: Joan's Activity */}
        <motion.div className={card} {...fadeUp} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-4">
            <JoanAvatar size="sm" showPulse={false} />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Joan's Activity
            </h2>
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-2">
              {recentActivities.map((a: any) => {
                const Icon = ACTION_ICONS[a.action] || Zap;
                return (
                  <div
                    key={a._id}
                    className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
                  >
                    <Icon
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        a.success ? "text-accent" : "text-destructive"
                      }`}
                    />
                    <p className="text-sm flex-1 leading-snug">{a.description}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {format(new Date(a.timestamp), "MMM d")}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
        </motion.div>

        {/* Section 5: Positions Overview */}
        <motion.div className={card} {...fadeUp} transition={{ delay: 0.4 }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Positions Overview
          </h2>
          {stats.positionBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.positionBreakdown.map((pos, i) => {
                const pct = (pos.count / maxPosition) * 100;
                return (
                  <div key={pos.position} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-32 truncate text-right text-muted-foreground">
                      {pos.position}
                    </span>
                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full flex items-center justify-end pr-2"
                        style={{ backgroundColor: ACCENT }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 12)}%` }}
                        transition={{ duration: 0.5, delay: 0.05 * i }}
                      >
                        <span className="text-[10px] font-bold text-white">{pos.count}</span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No positions tracked yet.</p>
          )}
        </motion.div>

        {/* Section 6: Insights */}
        <motion.div className={card} {...fadeUp} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Insights
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                text: `Top-scoring candidate pool — ${scoreDist.excellent} candidates scored 80+`,
                color: "border-green-500/30 bg-green-500/5",
              },
              {
                text: `${stats.byStage.offer + stats.byStage.final} candidates ready for advancement`,
                color: "border-blue-500/30 bg-blue-500/5",
              },
              {
                text: `${stats.byStage.rejected} candidates flagged or rejected`,
                color: "border-amber-500/30 bg-amber-500/5",
              },
            ].map((insight, i) => (
              <div
                key={i}
                className={`border rounded-lg px-4 py-3 text-sm ${insight.color}`}
              >
                {insight.text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center py-8 space-y-3"
          {...fadeUp}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-muted-foreground">
            Generated by Joan AI — {format(new Date(), "MMMM d, yyyy")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print Digest
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
