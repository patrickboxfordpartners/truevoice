import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Mail,
  ArrowRight,
  Bell,
  UserPlus,
  AlertTriangle,
  StickyNote,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { JoanAvatar } from "./JoanAvatar";

interface JoanActivityFeedProps {
  companyId: string;
  limit?: number;
}

const actionIcons = {
  extracted_action_items: CheckCircle2,
  routed_email: Mail,
  moved_pipeline_stage: ArrowRight,
  sent_reminder: Bell,
  enriched_candidate: UserPlus,
  flagged_risk: AlertTriangle,
  created_note: StickyNote,
};

const actionColors = {
  extracted_action_items: "text-success",
  routed_email: "text-accent",
  moved_pipeline_stage: "text-primary",
  sent_reminder: "text-warning",
  enriched_candidate: "text-accent",
  flagged_risk: "text-destructive",
  created_note: "text-muted-foreground",
};

export const JoanActivityFeed = ({ companyId, limit = 20 }: JoanActivityFeedProps) => {
  const activities = useQuery(api.queries.getJoanActivity, {
    companyId,
    limit,
  });

  if (activities === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading Joan's activity...</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <JoanAvatar size="lg" showPulse={false} className="mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Joan will appear here when she starts working
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <JoanAvatar size="sm" />
        <div>
          <h3 className="text-sm font-semibold">Joan AI Assistant</h3>
          <p className="text-xs text-muted-foreground">
            {activities.length} recent {activities.length === 1 ? "activity" : "activities"}
          </p>
        </div>
      </div>

      {/* Activity list */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {activities.map((activity) => {
          const Icon = actionIcons[activity.action as keyof typeof actionIcons] || CheckCircle2;
          const color = actionColors[activity.action as keyof typeof actionColors] || "text-primary";
          const isError = !activity.success;

          return (
            <div
              key={activity._id}
              className={`flex gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30 ${
                isError
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-card"
              }`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 mt-0.5 ${isError ? "text-destructive" : color}`}>
                {isError ? (
                  <AlertCircle size={18} />
                ) : (
                  <Icon size={18} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">
                  {activity.description}
                </p>

                {/* Error message */}
                {isError && activity.errorMessage && (
                  <p className="text-xs text-destructive mt-1 font-medium">
                    {activity.errorMessage}
                  </p>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
