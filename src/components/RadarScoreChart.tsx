import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BarChart3 } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarScoreChartProps {
  candidateId?: string;
  interviewId?: string;
  className?: string;
}

const ACCENT = "hsl(160, 84%, 39%)";

const DIMENSIONS = [
  { key: "speechScore", label: "Speech" },
  { key: "timingScore", label: "Timing" },
  { key: "flowScore", label: "Flow" },
  { key: "linguisticScore", label: "Linguistic" },
  { key: "engagement", label: "Engagement" },
  { key: "confidence", label: "Confidence" },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["key"];

function getScoreColor(value: number): string {
  if (value >= 80) return "text-emerald-600";
  if (value >= 60) return "text-blue-600";
  if (value >= 40) return "text-amber-600";
  return "text-red-500";
}

export function RadarScoreChart({
  candidateId,
  interviewId,
  className = "",
}: RadarScoreChartProps) {
  const scores = useQuery(
    api.queries.getScoreBreakdown,
    candidateId || interviewId
      ? { candidateId, interviewId }
      : "skip"
  );

  if (scores === undefined) {
    return (
      <div className={`glass-card p-6 rounded-xl ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-sm">Score Breakdown</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="h-48 w-48 rounded-full bg-muted/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (scores === null) {
    return (
      <div className={`glass-card p-6 rounded-xl ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-muted-foreground">
            Score Breakdown
          </h3>
        </div>
        <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-2 opacity-30" />
          <p className="text-sm">No score data available</p>
        </div>
      </div>
    );
  }

  const data = DIMENSIONS.map((d) => ({
    dimension: d.label,
    score: Math.round(scores[d.key as DimensionKey]),
    fullMark: 100,
  }));

  return (
    <div className={`glass-card p-6 rounded-xl ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm">Score Breakdown</h3>
        </div>
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
            scores.overallScore >= 80
              ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
              : scores.overallScore >= 60
                ? "border-blue-500 text-blue-600 bg-blue-500/10"
                : scores.overallScore >= 40
                  ? "border-amber-500 text-amber-600 bg-amber-500/10"
                  : "border-red-500 text-red-500 bg-red-500/10"
          }`}
        >
          {Math.round(scores.overallScore)}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={ACCENT}
            fill={ACCENT}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${value}/100`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-2 mt-2">
        {DIMENSIONS.map((d) => {
          const val = Math.round(scores[d.key as DimensionKey]);
          return (
            <span
              key={d.key}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50 ${getScoreColor(val)}`}
            >
              {d.label}
              <span className="font-bold">{val}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default RadarScoreChart;
