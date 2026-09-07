import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ThumbsUp,
  ThumbsDown,
  Eye,
  ChevronDown,
  ChevronUp,
  Mail,
  Brain,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AutopilotItem {
  _id: Id<"autopilot_queue">;
  candidateId: Id<"hiring_pipeline">;
  companyId: string;
  briefId: Id<"intelligence_briefs">;
  recommendation: "advance" | "review" | "reject";
  confidenceScore: number;
  evidenceSummary: string;
  draftEmailSubject?: string;
  draftEmailBody?: string;
  status: string;
  createdAt: number;
}

const RECOMMENDATION_CONFIG = {
  advance: {
    label: "Advance",
    icon: ThumbsUp,
    color: "text-green-600",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    badge: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  review: {
    label: "Review",
    icon: Eye,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  reject: {
    label: "Reject",
    icon: ThumbsDown,
    color: "text-red-600",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badge: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

function AutopilotCard({ item }: { item: AutopilotItem }) {
  const [expanded, setExpanded] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [modifiedAction, setModifiedAction] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const resolveItem = useMutation(api.mutations.resolveAutopilotItem);
  const candidate = useQuery(api.queries.getCandidateById, {
    candidateId: item.candidateId,
  });
  const brief = useQuery(api.queries.getIntelligenceBrief, {
    briefId: item.briefId,
  });

  const config = RECOMMENDATION_CONFIG[item.recommendation];
  const Icon = config.icon;
  const minutesAgo = Math.floor((Date.now() - item.createdAt) / 60000);

  const handleResolve = async (
    status: "approved" | "rejected" | "modified"
  ) => {
    setResolving(status);
    try {
      await resolveItem({
        itemId: item._id,
        status,
        decidedBy: profile?.full_name || "unknown",
        modifiedAction: status === "modified" ? modifiedAction : undefined,
      });
      toast({
        title:
          status === "approved"
            ? "Recommendation approved"
            : status === "rejected"
              ? "Recommendation rejected"
              : "Action modified",
        description: `${candidate?.candidateName || "Candidate"} updated`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to process decision",
        variant: "destructive",
      });
    } finally {
      setResolving(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <Card className={`${config.border} border`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bg}`}
              >
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div>
                <CardTitle className="text-base">
                  {candidate?.candidateName || "Loading..."}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {candidate?.position}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={config.badge}>
                {config.label}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Brain className="h-3.5 w-3.5" />
                <span className="font-medium tabular-nums">
                  {item.confidenceScore}/100
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {minutesAgo < 60
                    ? `${minutesAgo}m ago`
                    : `${Math.floor(minutesAgo / 60)}h ago`}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Evidence summary (always visible) */}
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <div className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
              {item.evidenceSummary.split("\n\n")[0]}
            </div>
            <CollapsibleContent>
              <div className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                {item.evidenceSummary
                  .split("\n\n")
                  .slice(1)
                  .join("\n\n")}
              </div>

              {/* Intelligence brief details */}
              {brief?.synthesis && (
                <div className="mt-3 space-y-2">
                  {brief.synthesis.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">
                        Strengths
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {brief.synthesis.strengths
                          .slice(0, 3)
                          .map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                              {s}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {brief.synthesis.risks?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">
                        Risks
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {brief.synthesis.risks
                          .slice(0, 3)
                          .map((r: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                              {r}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {brief.synthesis.customQuestions?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-purple-600 mb-1">
                        Suggested interview questions
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {brief.synthesis.customQuestions
                          .slice(0, 2)
                          .map(
                            (
                              q: { question: string; rationale: string },
                              i: number
                            ) => (
                              <li key={i}>
                                <p className="font-medium">{q.question}</p>
                                <p className="text-muted-foreground/70 italic">
                                  {q.rationale}
                                </p>
                              </li>
                            )
                          )}
                      </ul>
                    </div>
                  )}

                  {brief.sources?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      Sources: {brief.sources.join(", ")}
                      {brief.pipelineDurationMs > 0 && (
                        <span className="ml-1">
                          ({(brief.pipelineDurationMs / 1000).toFixed(1)}s)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CollapsibleContent>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs">
                {expanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                    Less detail
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    Full evidence chain
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {/* Draft email preview */}
          {item.draftEmailSubject && (
            <Collapsible open={emailExpanded} onOpenChange={setEmailExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Draft email: {item.draftEmailSubject}
                  {emailExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-md bg-muted/50 p-3 text-xs whitespace-pre-line">
                  {item.draftEmailBody}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              onClick={() => handleResolve("approved")}
              disabled={resolving !== null}
            >
              {resolving === "approved" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ThumbsUp className="h-3.5 w-3.5" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => handleResolve("rejected")}
              disabled={resolving !== null}
            >
              {resolving === "rejected" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Reject
            </Button>
            <div className="flex-1 flex items-center gap-2">
              <Textarea
                placeholder="Custom action..."
                className="h-8 min-h-0 text-xs resize-none"
                value={modifiedAction}
                onChange={(e) => setModifiedAction(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={() => handleResolve("modified")}
                disabled={resolving !== null || !modifiedAction.trim()}
              >
                {resolving === "modified" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                Modify
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AutopilotQueue() {
  const { company } = useAuth();
  const companyId = company?.id || "demo-company";

  const pendingItems = useQuery(api.queries.getPendingAutopilotItems, {
    companyId,
  }) as AutopilotItem[] | undefined;

  if (!pendingItems) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pendingItems.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Shield className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No pending recommendations
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Joan will queue candidates here as intelligence briefs complete
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            Joan Autopilot Queue
          </h3>
          <Badge variant="secondary" className="text-xs">
            {pendingItems.length} pending
          </Badge>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {pendingItems.map((item) => (
          <AutopilotCard key={item._id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}
