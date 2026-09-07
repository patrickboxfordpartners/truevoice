import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Mail,
  ArrowRight,
  Bell,
  Send,
  Search,
  AlertTriangle,
  FileText,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface Activity {
  _id: string;
  action: string;
  description: string;
  success: boolean;
  timestamp: number;
  details?: any;
  errorMessage?: string;
}

interface CandidateTimelineProps {
  candidateId: string;
  activities: Activity[];
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  extracted_action_items: ClipboardList,
  routed_email: Mail,
  moved_pipeline_stage: ArrowRight,
  sent_reminder: Bell,
  sent_status_email: Send,
  enriched_candidate: Search,
  flagged_risk: AlertTriangle,
  created_note: FileText,
};

const ACTION_LABELS: Record<string, string> = {
  extracted_action_items: "Extracted Actions",
  routed_email: "Routed Email",
  moved_pipeline_stage: "Stage Move",
  sent_reminder: "Reminder Sent",
  sent_status_email: "Email Sent",
  enriched_candidate: "Enriched",
  flagged_risk: "Risk Flagged",
  created_note: "Note Created",
  created_from_email: "Created from Email",
};

function TimelineNode({ activity, index }: { activity: Activity; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ACTION_ICONS[activity.action] || Zap;
  const label = ACTION_LABELS[activity.action] || activity.action;
  const hasDetails = activity.details && Object.keys(activity.details).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative flex gap-4 pb-6 last:pb-0"
    >
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
            activity.success
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          <Icon
            className={`h-3.5 w-3.5 ${
              activity.success ? "text-green-600" : "text-red-600"
            }`}
          />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <span className="text-xs text-muted-foreground/60">
            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
          </span>
        </div>

        <p className="text-sm">{activity.description}</p>

        {activity.errorMessage && (
          <p className="text-xs text-destructive mt-1">{activity.errorMessage}</p>
        )}

        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1.5 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {expanded ? "Hide details" : "Show details"}
          </button>
        )}

        {expanded && hasDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground space-y-1"
          >
            {Object.entries(activity.details).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium text-foreground/70 shrink-0">
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}:
                </span>
                <span className="truncate">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function CandidateTimeline({ activities }: CandidateTimelineProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            No activity recorded yet. Joan will log actions here as she processes this candidate.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...activities].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="pl-1 pt-2">
      {sorted.map((activity, i) => (
        <TimelineNode key={activity._id} activity={activity} index={i} />
      ))}
    </div>
  );
}
