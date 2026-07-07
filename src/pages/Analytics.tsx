import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, BarChart3, TrendingUp, Users, CheckCircle2, Clock, AlertTriangle, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Cell, LineChart, Line, PieChart, Pie, Legend,
} from "recharts";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompletedReports } from "@/hooks/useReport";
import { getScoreColor } from "@/components/ScoreGauge";
import { SCORE_LABELS } from "@/lib/scoreLabels";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg border border-border">
        <p className="font-medium">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) => (
  <div className="glass-card rounded-xl p-5">
    <div className="flex items-start justify-between mb-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.8} />
      </div>
    </div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const Analytics = () => {
  const { data: interviews = [], isLoading: interviewsLoading } = useInterviews();
  const { data: reports = [], isLoading: reportsLoading } = useCompletedReports();

  const isLoading = interviewsLoading || reportsLoading;

  const stats = useMemo(() => {
    const total = interviews.length;
    const completed = interviews.filter((i: any) => i.status === "completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgScore = reports && reports.length > 0
      ? Math.round((reports as any[]).reduce((sum, r) => sum + (r?.overall ?? 0), 0) / reports.length)
      : 0;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = interviews.filter((i: any) => new Date(i.created_at) >= thisMonthStart).length;

    return { total, completed, completionRate, avgScore, thisMonth };
  }, [interviews, reports]);

  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];
    (reports as any[]).forEach((r) => {
      if (!r) return;
      const s = r.overall ?? 0;
      if (s <= 20) buckets[0].count++;
      else if (s <= 40) buckets[1].count++;
      else if (s <= 60) buckets[2].count++;
      else if (s <= 80) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [reports]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, { total: number; sum: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = { total: 0, sum: 0 };
    }
    (reports as any[]).forEach((r) => {
      if (!r) return;
      // use interview date from the reports object
      const date = r.date ? new Date(r.date) : null;
      if (!date) return;
      const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key]) {
        months[key].total++;
        months[key].sum += r.overall ?? 0;
      }
    });
    return Object.entries(months).map(([month, { total, sum }]) => ({
      month,
      avg: total > 0 ? Math.round(sum / total) : 0,
      count: total,
    }));
  }, [reports]);

  const byPosition = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    (reports as any[]).forEach((r) => {
      if (!r?.position) return;
      if (!map[r.position]) map[r.position] = { sum: 0, count: 0 };
      map[r.position].sum += r.overall ?? 0;
      map[r.position].count++;
    });
    return Object.entries(map)
      .map(([position, { sum, count }]) => ({
        position: position.length > 20 ? position.slice(0, 20) + "…" : position,
        avg: Math.round(sum / count),
        count,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);
  }, [reports]);

  const topFlags = useMemo(() => {
    const map: Record<string, number> = {};
    (reports as any[]).forEach((r) => {
      if (!r?.flags) return;
      r.flags.forEach((f: any) => {
        const key = f.pattern;
        map[key] = (map[key] ?? 0) + 1;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));
  }, [reports]);

  const funnel = useMemo(() => {
    const created = interviews.length;
    const consented = interviews.filter((i: any) => i.candidate_consented).length;
    const completed = interviews.filter((i: any) => i.status === "completed").length;
    return [
      { stage: "Created", count: created, pct: 100 },
      { stage: "Consented", count: consented, pct: created > 0 ? Math.round((consented / created) * 100) : 0 },
      { stage: "Completed", count: completed, pct: created > 0 ? Math.round((completed / created) * 100) : 0 },
    ];
  }, [interviews]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />Interview Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Aggregate insights across all your interviews</p>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <StatCard icon={Users} label="Total Interviews" value={stats.total} />
          <StatCard icon={TrendingUp} label={`Avg ${SCORE_LABELS.overall}`} value={`${stats.avgScore}/100`} color={getScoreColor(stats.avgScore)} />
          <StatCard icon={CheckCircle2} label="Completion Rate" value={`${stats.completionRate}%`} sub={`${stats.completed} of ${stats.total} completed`} />
          <StatCard icon={Clock} label="This Month" value={stats.thisMonth} sub="interviews created" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Score distribution */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Score Distribution</h2>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed interviews yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Monthly trend */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Average Score Trend (6 months)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="avg" name="Avg Score" stroke="hsl(var(--primary))" fill="url(#trendGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* By position */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Avg Score by Position</h2>
            {byPosition.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byPosition} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="position" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg" name="Avg Score" radius={[0, 4, 4, 0]} fill="hsl(160, 84%, 39%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Funnel */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Interview Funnel</h2>
            <div className="space-y-4 mt-4">
              {funnel.map((stage, i) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="tabular-nums text-muted-foreground">{stage.count} <span className="text-xs">({stage.pct}%)</span></span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${stage.pct}%`,
                        backgroundColor: i === 0 ? "hsl(var(--primary))" : i === 1 ? "hsl(160, 84%, 39%)" : "hsl(38, 92%, 50%)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top flags */}
        {topFlags.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Most Common Flag Patterns
            </h2>
            <div className="space-y-2">
              {topFlags.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 tabular-nums">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm truncate">{f.pattern}</span>
                      <span className="text-xs font-semibold text-muted-foreground ml-2 tabular-nums shrink-0">{f.count}×</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-warning/70"
                        style={{ width: `${(f.count / topFlags[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
