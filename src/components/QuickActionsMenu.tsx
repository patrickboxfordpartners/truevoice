import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, GitCompareArrows, MessageSquare, Calendar, XCircle, ArrowRight } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type Stage = "screening" | "technical" | "final" | "offer" | "hired" | "rejected";

interface QuickActionsMenuProps {
  candidateId: Id<"hiring_pipeline">;
  candidateName: string;
  currentStage: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAction?: (action: string) => void;
}

const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: "screening", label: "Screening", color: "#3b82f6" },
  { key: "technical", label: "Technical", color: "#a855f7" },
  { key: "final", label: "Final Round", color: "#f59e0b" },
  { key: "offer", label: "Offer", color: "#22c55e" },
  { key: "hired", label: "Hired", color: "hsl(160,84%,39%)" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
];

export function QuickActionsMenu({
  candidateId,
  candidateName,
  currentStage,
  position,
  onClose,
  onAction,
}: QuickActionsMenuProps) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const moveStage = useMutation(api.mutations.moveCandidateStage);
  const [clamped, setClamped] = useState(position);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const pad = 8;
    let x = position.x;
    let y = position.y;
    if (x + rect.width > window.innerWidth - pad) x = window.innerWidth - rect.width - pad;
    if (y + rect.height > window.innerHeight - pad) y = window.innerHeight - rect.height - pad;
    if (x < pad) x = pad;
    if (y < pad) y = pad;
    setClamped({ x, y });
  }, [position]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleMoveStage = async (stage: Stage) => {
    await moveStage({ candidateId, newStage: stage, movedBy: "manual" });
    onClose();
  };

  const availableStages = STAGES.filter((s) => s.key !== currentStage);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="fixed z-[9999] min-w-[220px] rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-elevated overflow-hidden"
        style={{ left: clamped.x, top: clamped.y }}
      >
        <div className="px-3 py-2 border-b border-border/50">
          <p className="text-xs font-medium text-foreground truncate">{candidateName}</p>
        </div>

        <div className="py-1">
          <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Move to Stage
          </p>
          {availableStages.map((stage) => (
            <button
              key={stage.key}
              onClick={() => handleMoveStage(stage.key)}
              className="w-full px-3 py-2 hover:bg-accent/10 cursor-pointer flex items-center gap-2 text-sm text-foreground transition-colors"
            >
              <span
                className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              {stage.label}
            </button>
          ))}
        </div>

        <div className="border-t border-border/50 py-1">
          <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Quick Actions
          </p>
          <button
            onClick={() => { navigate(`/joan-candidate/${candidateId}`); onClose(); }}
            className="w-full px-3 py-2 hover:bg-accent/10 cursor-pointer flex items-center gap-2 text-sm text-foreground transition-colors"
          >
            <User size={14} className="text-muted-foreground" />
            View Profile
          </button>
          <button
            onClick={() => { navigate("/joan-compare"); onClose(); }}
            className="w-full px-3 py-2 hover:bg-accent/10 cursor-pointer flex items-center gap-2 text-sm text-foreground transition-colors"
          >
            <GitCompareArrows size={14} className="text-muted-foreground" />
            Compare
          </button>
          <button
            onClick={() => { onAction?.("add-note"); onClose(); }}
            className="w-full px-3 py-2 hover:bg-accent/10 cursor-pointer flex items-center gap-2 text-sm text-foreground transition-colors"
          >
            <MessageSquare size={14} className="text-muted-foreground" />
            Add Note
          </button>
          <button
            onClick={() => { onAction?.("schedule"); onClose(); }}
            className="w-full px-3 py-2 hover:bg-accent/10 cursor-pointer flex items-center gap-2 text-sm text-foreground transition-colors"
          >
            <Calendar size={14} className="text-muted-foreground" />
            Schedule Interview
          </button>
        </div>

        {currentStage !== "rejected" && (
          <div className="border-t border-border/50 py-1">
            <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Danger Zone
            </p>
            <button
              onClick={() => handleMoveStage("rejected")}
              className="w-full px-3 py-2 hover:bg-destructive/10 cursor-pointer flex items-center gap-2 text-sm text-destructive transition-colors"
            >
              <XCircle size={14} />
              Reject Candidate
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default QuickActionsMenu;
