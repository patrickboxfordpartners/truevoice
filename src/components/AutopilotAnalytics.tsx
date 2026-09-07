import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  );
}

function RecBreakdown({
  label,
  data,
  color,
}: {
  label: string;
  data: { total: number; approved: number; rejected: number; modified: number };
  color: string;
}) {
  if (data.total === 0) return null;
  const resolved = data.approved + data.rejected + data.modified;
  const rate = resolved > 0 ? Math.round((data.approved / resolved) * 100) : 0;

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">({data.total})</span>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="text-green-600">{data.approved} approved</span>
        <span className="text-red-600">{data.rejected} rejected</span>
        <span className="text-amber-600">{data.modified} modified</span>
        {resolved > 0 && (
          <span className="font-medium text-foreground">{rate}% approval</span>
        )}
      </div>
    </div>
  );
}

export default function AutopilotAnalytics() {
  const { company } = useAuth();
  const companyId = company?.id || "demo-company";

  const analytics = useQuery(api.queries.getAutopilotAnalytics, { companyId });

  if (!analytics || analytics.total === 0) return null;

  const resolved = analytics.approved + analytics.rejected + analytics.modified;
  if (resolved === 0) return null;

  return (
    <Card className="border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Joan Accuracy</h3>
          <span className="text-xs text-muted-foreground">
            {resolved} decisions
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <StatCard
            label="Approval rate"
            value={`${analytics.approvalRate}%`}
            icon={analytics.approvalRate >= 70 ? TrendingUp : TrendingDown}
            color={analytics.approvalRate >= 70 ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}
          />
          <StatCard
            label="Override rate"
            value={`${analytics.overrideRate}%`}
            sub={`${analytics.rejected + analytics.modified} overridden`}
            icon={Eye}
            color="bg-amber-500/10 text-amber-600"
          />
          <StatCard
            label="Avg confidence (approved)"
            value={analytics.avgConfidenceApproved}
            icon={CheckCircle2}
            color="bg-green-500/10 text-green-600"
          />
          <StatCard
            label="Avg confidence (overridden)"
            value={analytics.avgConfidenceOverridden}
            icon={XCircle}
            color="bg-red-500/10 text-red-600"
          />
        </div>

        <div className="space-y-2 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">By recommendation type</p>
          <RecBreakdown label="Advance" data={analytics.byRecommendation.advance} color="bg-green-500" />
          <RecBreakdown label="Review" data={analytics.byRecommendation.review} color="bg-amber-500" />
          <RecBreakdown label="Reject" data={analytics.byRecommendation.reject} color="bg-red-500" />
        </div>

        {analytics.approvalRate >= 80 && resolved >= 5 && (
          <div className="mt-3 rounded-md bg-green-500/10 border border-green-500/20 p-2.5 flex items-start gap-2">
            <Brain className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
            <p className="text-xs text-green-700">
              Joan's recommendations align with your team {analytics.approvalRate}% of the time across {resolved} decisions.
            </p>
          </div>
        )}

        {analytics.overrideRate >= 40 && resolved >= 5 && (
          <div className="mt-3 rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2">
            <Brain className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Your team overrides Joan {analytics.overrideRate}% of the time. Consider adjusting the autopilot thresholds in settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
