import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ACTION_LABELS: Record<string, string> = {
  extracted_action_items: "Extracted action items",
  routed_email: "Routed email",
  moved_pipeline_stage: "Moved candidate",
  sent_reminder: "Sent reminder",
  sent_status_email: "Sent email",
  enriched_candidate: "Enriched candidate",
  flagged_risk: "Flagged risk",
  created_from_email: "Created from email",
  created_note: "Created note",
};

export default function JoanNotificationToast() {
  const { company } = useAuth();
  const companyId = company?.id || "demo-company";
  const { toast } = useToast();
  const shownIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  const since = useRef(Date.now() - 5 * 60 * 1000).current;

  const activities = useQuery(api.queries.getRecentJoanNotifications, {
    companyId,
    since,
  });

  useEffect(() => {
    if (!activities || activities.length === 0) return;

    if (initialLoad.current) {
      for (const a of activities) {
        shownIds.current.add(a._id);
      }
      initialLoad.current = false;
      return;
    }

    for (const a of activities) {
      if (shownIds.current.has(a._id)) continue;
      shownIds.current.add(a._id);

      const label = ACTION_LABELS[a.action] || "Joan activity";

      toast({
        title: `Joan: ${label}`,
        description: a.description,
        variant: a.success ? "default" : "destructive",
      });
    }
  }, [activities, toast]);

  return null;
}
