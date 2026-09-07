import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2, XCircle, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "../../convex/_generated/dataModel";

interface ApprovalGateProps {
  candidateId: Id<"hiring_pipeline">;
  candidateName: string;
  position: string;
  stage: string;
  overallScore?: number;
  onApprove: () => void;
  onReject: () => void;
  className?: string;
}

function getScoreBadge(score: number) {
  if (score >= 80) return { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-600" };
  if (score >= 60) return { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-600" };
  if (score >= 40) return { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-600" };
  return { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-500" };
}

export function ApprovalGate({
  candidateName,
  position,
  stage,
  overallScore,
  onApprove,
  onReject,
  className = "",
}: ApprovalGateProps) {
  const [confirmingApprove, setConfirmingApprove] = useState(false);
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [executing, setExecuting] = useState(false);

  if (stage !== "offer") return null;

  const handleApprove = async () => {
    if (!confirmingApprove) {
      setConfirmingApprove(true);
      setConfirmingReject(false);
      return;
    }
    setExecuting(true);
    onApprove();
  };

  const handleReject = async () => {
    if (!confirmingReject) {
      setConfirmingReject(true);
      setConfirmingApprove(false);
      return;
    }
    setExecuting(true);
    onReject();
  };

  const handleCancel = () => {
    setConfirmingApprove(false);
    setConfirmingReject(false);
  };

  const scoreBadge = overallScore != null ? getScoreBadge(overallScore) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`glass-card rounded-xl border border-border border-l-4 border-l-green-500 overflow-hidden ${className}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">Approval Required</h3>
            <p className="text-xs text-muted-foreground">Final hiring decision</p>
          </div>
          {scoreBadge && overallScore != null && (
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border ${scoreBadge.bg} ${scoreBadge.border} ${scoreBadge.text}`}
            >
              {Math.round(overallScore)}
            </div>
          )}
        </div>

        {/* Candidate info */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{candidateName}</span>
          </div>
          <p className="text-xs text-muted-foreground ml-6">{position}</p>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          This candidate is ready for a final hiring decision. Review their profile and approve or reject below.
        </p>

        {/* Confirmation messages */}
        <AnimatePresence mode="wait">
          {confirmingApprove && (
            <motion.div
              key="confirm-approve"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
            >
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Are you sure you want to hire <span className="font-semibold">{candidateName}</span>?
              </p>
            </motion.div>
          )}
          {confirmingReject && (
            <motion.div
              key="confirm-reject"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <p className="text-sm text-red-700 dark:text-red-400">
                Are you sure you want to reject <span className="font-semibold">{candidateName}</span>?
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {executing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </div>
          ) : (
            <>
              <Button
                onClick={handleApprove}
                className={`flex-1 gap-2 ${
                  confirmingApprove
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                }`}
                variant={confirmingApprove ? "default" : "outline"}
              >
                <CheckCircle2 className="h-4 w-4" />
                {confirmingApprove ? "Confirm Hire" : "Approve & Hire"}
              </Button>

              <Button
                onClick={handleReject}
                variant="outline"
                className={`gap-2 ${
                  confirmingReject
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                    : "border-red-500/30 text-red-600 hover:bg-red-500/10"
                }`}
              >
                <XCircle className="h-4 w-4" />
                {confirmingReject ? "Confirm Reject" : "Reject"}
              </Button>

              {(confirmingApprove || confirmingReject) && (
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              )}
            </>
          )}
        </div>

        {/* Request review link */}
        {!confirmingApprove && !confirmingReject && !executing && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Need more input?{" "}
            <span className="text-accent hover:underline cursor-pointer">
              Request a peer review
            </span>
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default ApprovalGate;
