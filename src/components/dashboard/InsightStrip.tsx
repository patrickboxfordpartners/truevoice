import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { Interview } from "@/types";

interface CompletedReport {
  overall: number;
  flags: { severity: string }[];
  date: string;
}

interface InsightStripProps {
  interviews: Interview[] | undefined;
  completedReports: CompletedReport[] | undefined;
}

export const InsightStrip = ({ interviews, completedReports }: InsightStripProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const all = interviews ?? [];
    const reports = completedReports ?? [];

    const completedThisWeek = all.filter(
      (i) => i.status === "completed" && new Date(i.created_at) >= weekAgo
    ).length;

    const upcoming = all.filter(
      (i) => i.status === "scheduled" && new Date(i.scheduled_at ?? i.created_at) >= now
    ).length;

    const scores = reports.map((r) => r.overall).filter((s) => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Trend: compare first half vs second half of scores
    const mid = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, mid);
    const secondHalf = scores.slice(mid);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    const trending = secondAvg >= firstAvg ? "up" : "down";

    const totalFlags = reports.reduce((sum, r) => sum + r.flags.length, 0);
    const highFlags = reports.reduce(
      (sum, r) => sum + r.flags.filter((f) => f.severity === "high").length, 0
    );

    // Sparkline data: last 10 completed reports' scores
    const sparkline = reports
      .slice(0, 10)
      .reverse()
      .map((r, i) => ({ i, score: r.overall }));

    return { avgScore, trending, completedThisWeek, upcoming, totalFlags, highFlags, sparkline };
  }, [interviews, completedReports]);

  const scoreColor = stats.avgScore >= 75 ? "text-success" : stats.avgScore >= 50 ? "text-warning" : "text-destructive";
  const sparkStroke = stats.avgScore >= 75 ? "hsl(160, 84%, 39%)" : stats.avgScore >= 50 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)";
  const sparkFill = stats.avgScore >= 75 ? "hsl(160, 84%, 39%)" : stats.avgScore >= 50 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)";

  return (
    <div className="glass-card rounded-xl px-6 py-3 flex items-center gap-6 flex-wrap">
      {/* Avg Score */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Avg Score</span>
        <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>{stats.avgScore}</span>
        {stats.trending === "up" ? (
          <TrendingUp className="h-3.5 w-3.5 text-success" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
        )}
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Flags */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Flags</span>
        <span className="text-sm font-semibold tabular-nums">{stats.totalFlags}</span>
        {stats.highFlags > 0 && (
          <span className="text-xs font-medium text-destructive">({stats.highFlags} high)</span>
        )}
      </div>

      <div className="h-6 w-px bg-border" />

      {/* This Week */}
      <div className="flex items-center gap-2">
        <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">This week</span>
        <span className="text-sm font-semibold tabular-nums">{stats.completedThisWeek}</span>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Upcoming */}
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Upcoming</span>
        <span className="text-sm font-semibold tabular-nums">{stats.upcoming}</span>
      </div>

      {/* Sparkline */}
      {stats.sparkline.length >= 2 && (
        <>
          <div className="h-6 w-px bg-border" />
          <div className="w-24 h-8 ml-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sparkline} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkFill} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={sparkFill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={sparkStroke}
                  strokeWidth={1.5}
                  fill="url(#sparkGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};
