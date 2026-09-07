import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface AutoStageRecommendationsProps {
  candidateId: Id<"hiring_pipeline">;
  currentStage: string;
  overallScore?: number;
  actionItemsComplete: number;
  actionItemsTotal: number;
  onApply?: (nextStage: string) => void;
  className?: string;
}

const STAGE_COLORS: Record<string, string> = {
  screening: "#3b82f6",
  technical: "#a855f7",
  final: "#f59e0b",
  offer: "#22c55e",
  hired: "hsl(160,84%,39%)",
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

const NEXT_STAGE: Record<string, string> = {
  screening: "technical",
  technical: "final",
  final: "offer",
  offer: "hired",
};

type Recommendation = {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
};

function computeRecommendation(
  score: number | undefined,
  complete: number,
  total: number
): Recommendation {
  const allDone = total > 0 && complete >= total;
  const halfDone = total > 0 && complete / total >= 0.5;

  if (score !== undefined && score >= 80 && allDone) {
    return {
      label: "Ready to advance",
      color: "#22c55e",
      bgClass: "bg-green-500/10",
      textClass: "text-green-600",
      borderClass: "border-green-500/30",
    };
  }
  if (score !== undefined && score >= 60 && halfDone) {
    return {
      label: "On track",
      color: "#3b82f6",
      bgClass: "bg-blue-500/10",
      textClass: "text-blue-600",
      borderClass: "border-blue-500/30",
    };
  }
  if (score !== undefined && score < 40) {
    return {
      label: "Consider rejecting",
      color: "#ef4444",
      bgClass: "bg-red-500/10",
      textClass: "text-red-600",
      borderClass: "border-red-500/30",
    };
  }
  return {
    label: "Needs attention",
    color: "#f59e0b",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-600",
    borderClass: "border-amber-500/30",
  };
}

export function AutoStageRecommendations({
  currentStage,
  overallScore,
  actionItemsComplete,
  actionItemsTotal,
  onApply,
  className = "",
}: AutoStageRecommendationsProps) {
  const rec = useMemo(
    () => computeRecommendation(overallScore, actionItemsComplete, actionItemsTotal),
    [overallScore, actionItemsComplete, actionItemsTotal]
  );

  const nextStage = NEXT_STAGE[currentStage];
  const completionRatio = actionItemsTotal > 0 ? actionItemsComplete / actionItemsTotal : 0;
  const confidence = useMemo(() => {
    let c = 0;
    if (overallScore !== undefined) c += Math.min(50, overallScore * 0.5);
    c += completionRatio * 30;
    if (overallScore !== undefined && overallScore >= 70) c += 20;
    return Math.min(100, Math.round(c));
  }, [overallScore, completionRatio]);

  if (currentStage === "hired" || currentStage === "rejected") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card rounded-xl border border-border p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-full bg-[hsl(160,84%,39%)]/15 flex items-center justify-center">
          <span className="text-[11px] font-bold text-[hsl(160,84%,39%)]">J</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(160,84%,39%)]" />
          <h3 className="text-sm font-semibold">Joan's Assessment</h3>
        </div>
      </div>

      {/* Recommendation badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${rec.bgClass} ${rec.textClass} ${rec.borderClass} mb-4`}
      >
        {rec.label === "Ready to advance" && <CheckCircle2 className="h-3.5 w-3.5" />}
        {rec.label === "On track" && <TrendingUp className="h-3.5 w-3.5" />}
        {rec.label === "Consider rejecting" && <AlertTriangle className="h-3.5 w-3.5" />}
        {rec.label === "Needs attention" && <AlertTriangle className="h-3.5 w-3.5" />}
        {rec.label}
      </div>

      {/* Next stage indicator */}
      {nextStage && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-muted-foreground">Next stage:</span>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: STAGE_COLORS[currentStage] }}
            />
            <span className="font-medium">{STAGE_LABELS[currentStage]}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: STAGE_COLORS[nextStage] }}
            />
            <span className="font-medium">{STAGE_LABELS[nextStage]}</span>
          </div>
        </div>
      )}

      {/* Action items progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Action Items</span>
          <span className="font-medium">
            {actionItemsComplete}/{actionItemsTotal}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRatio * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background:
                completionRatio >= 1
                  ? "#22c55e"
                  : completionRatio >= 0.5
                    ? "#3b82f6"
                    : "#f59e0b",
            }}
          />
        </div>
      </div>

      {/* Confidence meter */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">{confidence}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="h-full rounded-full bg-[hsl(160,84%,39%)]"
          />
        </div>
      </div>

      {/* Apply button */}
      {nextStage && onApply && (
        <button
          onClick={() => onApply(nextStage)}
          disabled={rec.label === "Consider rejecting"}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:
              rec.label === "Consider rejecting"
                ? "#94a3b8"
                : "hsl(160,84%,39%)",
          }}
        >
          <Sparkles className="h-4 w-4" />
          Apply Recommendation
        </button>
      )}
    </motion.div>
  );
}

export default AutoStageRecommendations;
