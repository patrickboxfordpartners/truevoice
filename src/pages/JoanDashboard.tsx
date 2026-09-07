import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  Target,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  UserX,
  Orbit,
  GitCompareArrows,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { JoanAvatar } from "@/components/JoanAvatar";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const STAGE_COLORS: Record<string, string> = {
  screening: "#3b82f6",
  technical: "#a855f7",
  final: "#f59e0b",
  offer: "#22c55e",
  hired: "#0fa968",
  rejected: "#ef4444",
};

const STAGE_LABELS: Record<string, string> = {
  screening: "Screening",
  technical: "Technical",
  final: "Final Round",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const SCORE_COLORS = {
  excellent: "#0fa968",
  good: "#3b82f6",
  fair: "#f59e0b",
  poor: "#ef4444",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function JoanDashboard() {
  const { company } = useAuth();
  const companyId = company?.id || "demo-company";
  const stats = useQuery(api.queries.getDashboardStats, { companyId });

  const stageData = useMemo(() => {
    if (!stats) return [];
    return (["screening", "technical", "final", "offer", "hired"] as const).map(
      (key) => ({
        name: STAGE_LABELS[key],
        value: stats.byStage[key],
        color: STAGE_COLORS[key],
      })
    );
  }, [stats]);

  const scoreData = useMemo(() => {
    if (!stats) return [];
    const d = stats.scoreDistribution;
    return [
      { name: "Excellent", value: d.excellent, color: SCORE_COLORS.excellent },
      { name: "Good", value: d.good, color: SCORE_COLORS.good },
      { name: "Fair", value: d.fair, color: SCORE_COLORS.fair },
      { name: "Poor", value: d.poor, color: SCORE_COLORS.poor },
    ].filter((s) => s.value > 0);
  }, [stats]);

  const positionData = useMemo(() => {
    if (!stats) return [];
    return stats.positionBreakdown.slice(0, 6);
  }, [stats]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const totalActive =
    stats.byStage.screening +
    stats.byStage.technical +
    stats.byStage.final +
    stats.byStage.offer;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/joan-pipeline"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <JoanAvatar size="sm" showPulse={false} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Joan Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Hiring Intelligence Overview
              </p>
            </div>
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {/* Pipeline Overview */}
          <motion.div variants={item} className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Pipeline Overview
              </h3>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-foreground">
                {stats.totalCandidates}
              </span>
              <span className="text-sm text-muted-foreground">total</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {totalActive} active in pipeline
            </p>
            <div className="space-y-2">
              {(
                [
                  "screening",
                  "technical",
                  "final",
                  "offer",
                  "hired",
                  "rejected",
                ] as const
              ).map((key) => {
                const count = stats.byStage[key];
                const pct =
                  stats.totalCandidates > 0
                    ? (count / stats.totalCandidates) * 100
                    : 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-16 text-right">
                      {STAGE_LABELS[key]}
                    </span>
                    <div className="flex-1 h-2.5 bg-muted/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: STAGE_COLORS[key] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums w-6 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Score Distribution */}
          <motion.div variants={item} className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Score Distribution
              </h3>
            </div>
            {stats.avgScore !== null && (
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-foreground">
                  {stats.avgScore}
                </span>
                <span className="text-sm text-muted-foreground">avg score</span>
              </div>
            )}
            {scoreData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={scoreData}
                      innerRadius={32}
                      outerRadius={52}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {scoreData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {scoreData.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {s.name}
                      </span>
                      <span className="text-xs font-semibold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No scored candidates yet
              </p>
            )}
          </motion.div>

          {/* Hiring Velocity */}
          <motion.div variants={item} className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Hiring Velocity
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Last 30 days</p>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">
                    {stats.recentHires}
                  </span>
                  <p className="text-[11px] text-muted-foreground">Hired</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">
                    {stats.recentRejects}
                  </span>
                  <p className="text-[11px] text-muted-foreground">Rejected</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-lg font-bold text-foreground">
                  {stats.avgTimeInStage ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  days avg in stage
                </span>
              </div>
            </div>
          </motion.div>

          {/* Position Breakdown */}
          <motion.div
            variants={item}
            className="glass-card p-6 rounded-xl md:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Positions
              </h3>
            </div>
            {positionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={positionData}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="position"
                    width={120}
                    tick={{ fontSize: 12, fill: "hsl(30, 8%, 46%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(35, 10%, 93%, 0.4)" }}
                    contentStyle={{
                      background: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(35, 12%, 90%)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                    {positionData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === 0
                            ? "#0fa968"
                            : i === 1
                              ? "#3b82f6"
                              : i === 2
                                ? "#a855f7"
                                : "#f59e0b"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No positions yet</p>
            )}
          </motion.div>

          {/* Stage Funnel */}
          <motion.div variants={item} className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Stage Funnel
              </h3>
            </div>
            <div className="space-y-1.5">
              {stageData.map((stage, i) => {
                const maxVal = Math.max(...stageData.map((s) => s.value), 1);
                const width = (stage.value / maxVal) * 100;
                return (
                  <div key={stage.name} className="relative">
                    <div
                      className="h-9 rounded-md flex items-center px-3 justify-between transition-all"
                      style={{
                        width: `${Math.max(width, 20)}%`,
                        backgroundColor: stage.color,
                        opacity: 0.85 + i * 0.03,
                      }}
                    >
                      <span className="text-xs font-medium text-white truncate">
                        {stage.name}
                      </span>
                      <span className="text-xs font-bold text-white tabular-nums">
                        {stage.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Navigation */}
          <motion.div
            variants={item}
            className="glass-card p-6 rounded-xl lg:col-span-3 md:col-span-2"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/joan-pipeline"
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Pipeline
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Manage candidates
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                to="/joan-orbit"
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Orbit className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Orbit View
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Visual pipeline
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                to="/joan-compare"
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <GitCompareArrows className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Compare
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Side-by-side review
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
