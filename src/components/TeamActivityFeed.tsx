import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Mail,
  ArrowRight,
  Bell,
  UserPlus,
  AlertTriangle,
  StickyNote,
  ChevronDown,
  Send,
  Search,
} from "lucide-react";
import { JoanAvatar } from "./JoanAvatar";

interface TeamActivityFeedProps {
  companyId: string;
  className?: string;
}

type FilterTab = "all" | "joan" | "stages" | "notes";

const ACTION_ICONS: Record<string, React.ElementType> = {
  extracted_action_items: CheckCircle2,
  routed_email: Mail,
  moved_pipeline_stage: ArrowRight,
  sent_reminder: Bell,
  sent_status_email: Send,
  enriched_candidate: UserPlus,
  created_from_email: Mail,
  flagged_risk: AlertTriangle,
  created_note: StickyNote,
};

const ACTION_COLORS: Record<string, string> = {
  extracted_action_items: "text-green-500",
  routed_email: "text-[hsl(160,84%,39%)]",
  moved_pipeline_stage: "text-blue-500",
  sent_reminder: "text-amber-500",
  sent_status_email: "text-[hsl(160,84%,39%)]",
  enriched_candidate: "text-[hsl(160,84%,39%)]",
  created_from_email: "text-blue-400",
  flagged_risk: "text-red-500",
  created_note: "text-muted-foreground",
};

const FILTER_ACTIONS: Record<FilterTab, string[] | null> = {
  all: null,
  joan: [
    "extracted_action_items",
    "routed_email",
    "enriched_candidate",
    "flagged_risk",
    "sent_reminder",
    "sent_status_email",
    "created_from_email",
  ],
  stages: ["moved_pipeline_stage"],
  notes: ["created_note"],
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "joan", label: "Joan" },
  { key: "stages", label: "Stage Changes" },
  { key: "notes", label: "Notes" },
];

export function TeamActivityFeed({ companyId, className = "" }: TeamActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [visibleCount, setVisibleCount] = useState(30);
  const listRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const activities = useQuery(api.queries.getJoanActivity, {
    companyId,
    limit: 100,
  });

  const filtered = activities
    ? FILTER_ACTIONS[activeTab]
      ? activities.filter((a) =>
          FILTER_ACTIONS[activeTab]!.includes(a.action)
        )
      : activities
    : undefined;

  const visible = filtered?.slice(0, visibleCount);
  const hasMore = filtered ? filtered.length > visibleCount : false;

  useEffect(() => {
    if (filtered && filtered.length > prevCountRef.current && prevCountRef.current > 0) {
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevCountRef.current = filtered?.length ?? 0;
  }, [filtered?.length]);

  if (activities === undefined) {
    return (
      <div className={`glass-card rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm">Team Activity</h3>
        </div>
        <div className="flex flex-col items-center py-10">
          <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground mt-2">Loading activity...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-accent" />
        <h3 className="font-semibold text-sm">Team Activity</h3>
        {activities.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {activities.length} events
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setVisibleCount(30);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-accent/15 text-accent"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      {!visible || visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <JoanAvatar size="lg" showPulse={false} />
          <p className="text-sm text-muted-foreground mt-3">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Joan will appear here when she starts working
          </p>
        </div>
      ) : (
        <>
          <div
            ref={listRef}
            className="space-y-2 max-h-[480px] overflow-y-auto pr-1 -mr-1"
          >
            <AnimatePresence initial={false}>
              {visible.map((activity, i) => {
                const Icon =
                  ACTION_ICONS[activity.action] || Search;
                const color =
                  ACTION_COLORS[activity.action] || "text-muted-foreground";
                const isFailed = !activity.success;

                return (
                  <motion.div
                    key={activity._id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      isFailed
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-border/50 bg-card/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${isFailed ? "text-red-500" : color}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">
                        {activity.description}
                      </p>

                      {isFailed && activity.errorMessage && (
                        <p className="text-xs text-red-500 mt-0.5 font-medium">
                          {activity.errorMessage}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            isFailed ? "bg-red-500" : "bg-green-500"
                          }`}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(activity.timestamp, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {hasMore && (
            <button
              onClick={() => setVisibleCount((c) => c + 30)}
              className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default TeamActivityFeed;
