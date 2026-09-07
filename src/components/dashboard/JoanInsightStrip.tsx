import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Users, Clock, CheckCircle2, TrendingUp, FileSearch, Zap } from "lucide-react";

export const JoanInsightStrip = () => {
  const { company } = useAuth();
  const companyId = company?.id || "demo-company";

  const candidates = useQuery(api.queries.getCandidatesByCompany, { companyId });
  const analytics = useQuery(api.queries.getAutopilotAnalytics, { companyId });
  const briefs = useQuery(api.queries.getBriefsByCompany, { companyId });

  const stats = useMemo(() => {
    if (!candidates || candidates.length === 0) return null;

    const stageCounts: Record<string, number> = {};
    let totalDaysInStage = 0;
    let activeCount = 0;

    for (const c of candidates) {
      stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;

      if (c.stage !== "rejected" && c.stage !== "hired") {
        const days = (Date.now() - c.updatedAt) / (1000 * 60 * 60 * 24);
        totalDaysInStage += days;
        activeCount++;
      }
    }

    const avgDays = activeCount > 0 ? Math.round(totalDaysInStage / activeCount) : 0;

    return {
      total: candidates.length,
      screening: stageCounts["screening"] || 0,
      technical: stageCounts["technical"] || 0,
      final: stageCounts["final"] || 0,
      offer: stageCounts["offer"] || 0,
      hired: stageCounts["hired"] || 0,
      avgDays,
    };
  }, [candidates]);

  const briefStats = useMemo(() => {
    if (!briefs || briefs.length === 0) return null;
    const complete = briefs.filter((b: any) => b.status === "complete").length;
    const running = briefs.filter((b: any) => b.status === "running").length;
    return { total: briefs.length, complete, running };
  }, [briefs]);

  if (!stats) return null;

  const approvalRate = analytics && analytics.total > 0 ? analytics.approvalRate : null;

  return (
    <div className="glass-card rounded-xl px-6 py-3 flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2">
        <Brain className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs text-muted-foreground">Joan Pipeline</span>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Candidates</span>
        <span className="text-sm font-semibold tabular-nums">{stats.total}</span>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-1.5 text-xs">
        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium tabular-nums">{stats.screening}</span>
        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 font-medium tabular-nums">{stats.technical}</span>
        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium tabular-nums">{stats.final}</span>
        <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-medium tabular-nums">{stats.offer}</span>
        {stats.hired > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-success/10 text-success font-medium tabular-nums">{stats.hired}</span>
        )}
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Avg in stage</span>
        <span className="text-sm font-semibold tabular-nums">{stats.avgDays}d</span>
      </div>

      {briefStats && (
        <>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <FileSearch className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Briefs</span>
            <span className="text-sm font-semibold tabular-nums">
              {briefStats.complete}/{briefStats.total}
            </span>
            {briefStats.running > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Zap className="h-3 w-3" />
                {briefStats.running}
              </span>
            )}
          </div>
        </>
      )}

      {approvalRate !== null && (
        <>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            {approvalRate >= 70 ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="text-xs text-muted-foreground">Joan accuracy</span>
            <span className={`text-sm font-semibold tabular-nums ${approvalRate >= 70 ? "text-success" : "text-amber-500"}`}>
              {approvalRate}%
            </span>
          </div>
        </>
      )}
    </div>
  );
};
