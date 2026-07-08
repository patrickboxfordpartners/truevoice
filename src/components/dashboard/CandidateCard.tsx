import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Clock, Radio, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniRadar } from "./MiniRadar";
import { getScoreColor } from "@/components/ScoreGauge";

interface CompletedCardProps {
  type: "completed";
  id: string;
  candidate: string;
  position: string;
  date: string;
  overall: number;
  speech: number;
  timing: number;
  flow: number;
  linguistic: number;
  summary?: string;
  flagCount: number;
  highestSeverity?: "low" | "medium" | "high";
  index?: number;
}

interface ScheduledCardProps {
  type: "scheduled" | "in_progress";
  id: string;
  candidate: string;
  position: string;
  date: string;
  index?: number;
  onResendInvitation?: () => void;
}

type CandidateCardProps = CompletedCardProps | ScheduledCardProps;

const severityDot = (severity?: "low" | "medium" | "high") => {
  if (!severity) return null;
  const cls = severity === "high" ? "bg-destructive" : severity === "medium" ? "bg-warning" : "bg-muted-foreground";
  return <span className={`h-2 w-2 rounded-full ${cls}`} />;
};

export const CandidateCard = (props: CandidateCardProps) => {
  const { id, candidate, position, date, index = 0 } = props;

  if (props.type === "completed") {
    const { overall, speech, timing, flow, linguistic, summary, flagCount, highestSeverity } = props;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="glass-card rounded-xl p-5 flex flex-col gap-3 hover:shadow-[var(--shadow-elevated)] transition-shadow group"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{candidate}</h3>
            <p className="text-xs text-muted-foreground truncate">{position}</p>
          </div>
          <span className={`text-2xl font-bold tabular-nums leading-none ${getScoreColor(overall)}`}>
            {overall}
          </span>
        </div>

        {/* Radar + Summary */}
        <div className="flex items-center gap-3">
          <MiniRadar
            speech={speech}
            timing={timing}
            flow={flow}
            linguistic={linguistic}
            overall={overall}
            size={72}
          />
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
            {summary || "Analysis complete. View full report for details."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {flagCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                {severityDot(highestSeverity)}
                <AlertTriangle className="h-3 w-3" />
                {flagCount} {flagCount === 1 ? "flag" : "flags"}
              </span>
            )}
            <span>{date}</span>
          </div>
          <Link to={`/report/${id}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              Report <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  // Scheduled / In Progress variant
  const isLive = props.type === "in_progress";
  const { onResendInvitation } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass-card rounded-xl p-5 flex flex-col gap-3 border-dashed hover:shadow-[var(--shadow-elevated)] transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{candidate}</h3>
          <p className="text-xs text-muted-foreground truncate">{position}</p>
        </div>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Radio className="h-3 w-3 animate-pulse" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Scheduled
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{date}</p>

      <Link to={`/interviewer/${id}`} className="mt-auto">
        <Button size="sm" variant={isLive ? "default" : "outline"} className="w-full gap-1.5">
          {isLive ? "Join Interview" : "Start Interview"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>

      {onResendInvitation && (
        <button
          onClick={(e) => { e.preventDefault(); onResendInvitation(); }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="h-3 w-3" />
          Resend invitation
        </button>
      )}
    </motion.div>
  );
};
