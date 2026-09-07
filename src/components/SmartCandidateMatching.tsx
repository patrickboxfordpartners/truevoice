import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Users, TrendingUp, ArrowRight } from "lucide-react";

interface SmartCandidateMatchingProps {
  candidateId: Id<"hiring_pipeline">;
  onSelectCandidate: (id: string) => void;
  className?: string;
}

const STAGE_COLORS: Record<string, string> = {
  screening: "#3b82f6",
  technical: "#a855f7",
  final: "#f59e0b",
  offer: "#22c55e",
  hired: "hsl(160, 84%, 39%)",
  rejected: "#ef4444",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function similarityColor(pct: number): string {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#3b82f6";
  if (pct >= 40) return "#f59e0b";
  return "#94a3b8";
}

export function SmartCandidateMatching({
  candidateId,
  onSelectCandidate,
  className = "",
}: SmartCandidateMatchingProps) {
  const similar = useQuery(api.queries.getSimilarCandidates, { candidateId });

  if (similar === undefined) {
    return (
      <div className={`glass-card rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Similar Candidates</h3>
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-2 w-full rounded bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (similar.length === 0) {
    return (
      <div className={`glass-card rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">
            Similar Candidates
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            No similar candidates found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-xl p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold">Similar Candidates</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {similar.length} match{similar.length !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {similar.map((candidate, i) => {
          const stageColor =
            STAGE_COLORS[candidate.stage] || STAGE_COLORS.screening;
          const simColor = similarityColor(candidate.similarity);

          return (
            <motion.button
              key={candidate._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onSelectCandidate(candidate.interviewId)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors text-left group"
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
                style={{ background: stageColor }}
              >
                {getInitials(candidate.candidateName)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {candidate.candidateName}
                  </span>
                  {candidate.overallScore != null && (
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                      {candidate.overallScore}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
                    {candidate.position}
                  </span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize"
                    style={{
                      color: stageColor,
                      background: `${stageColor}18`,
                    }}
                  >
                    {candidate.stage}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: simColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${candidate.similarity}%` }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }}
                    />
                  </div>
                  <div className="flex items-center gap-0.5">
                    <TrendingUp
                      className="h-3 w-3"
                      style={{ color: simColor }}
                    />
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: simColor }}
                    >
                      {candidate.similarity}%
                    </span>
                  </div>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default SmartCandidateMatching;
