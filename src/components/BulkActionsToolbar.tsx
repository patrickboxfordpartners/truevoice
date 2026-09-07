import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  GitCompareArrows,
  Download,
  XCircle,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onMoveStage: (stage: string) => void;
  onExport: () => void;
  onCompare: () => void;
  onReject: () => void;
}

const STAGES = [
  { key: "screening", label: "Screening", color: "#3b82f6" },
  { key: "technical", label: "Technical", color: "#a855f7" },
  { key: "final", label: "Final", color: "#f59e0b" },
  { key: "offer", label: "Offer", color: "#22c55e" },
  { key: "hired", label: "Hired", color: "hsl(160, 84%, 39%)" },
];

export function BulkActionsToolbar({
  selectedIds,
  onClearSelection,
  onMoveStage,
  onExport,
  onCompare,
  onReject,
}: BulkActionsToolbarProps) {
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rejectConfirm) {
      const timer = setTimeout(() => setRejectConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [rejectConfirm]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setStageDropdownOpen(false);
      }
    };
    if (stageDropdownOpen) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [stageDropdownOpen]);

  const count = selectedIds.length;
  const canCompare = count >= 2 && count <= 4;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl px-5 py-3 flex items-center gap-3 flex-wrap">
            {/* Count */}
            <span className="text-sm font-semibold whitespace-nowrap">
              {count} candidate{count !== 1 ? "s" : ""} selected
            </span>

            <div className="h-5 w-px bg-border shrink-0" />

            {/* Move to stage dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Move to...
                <ChevronDown className="h-3 w-3" />
              </Button>

              <AnimatePresence>
                {stageDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-2 left-0 bg-popover border border-border rounded-lg shadow-xl py-1.5 min-w-[160px] z-10"
                  >
                    {STAGES.map((stage) => (
                      <button
                        key={stage.key}
                        onClick={() => {
                          onMoveStage(stage.key);
                          setStageDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                      >
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: stage.color }}
                        />
                        {stage.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Compare */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              disabled={!canCompare}
              onClick={onCompare}
              title={
                !canCompare
                  ? "Select 2-4 candidates to compare"
                  : "Compare selected"
              }
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              Compare
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={onExport}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>

            {/* Reject */}
            <Button
              variant={rejectConfirm ? "destructive" : "outline"}
              size="sm"
              className={`gap-1.5 text-xs h-8 ${
                !rejectConfirm
                  ? "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  : ""
              }`}
              onClick={() => {
                if (rejectConfirm) {
                  onReject();
                  setRejectConfirm(false);
                } else {
                  setRejectConfirm(true);
                }
              }}
            >
              <XCircle className="h-3.5 w-3.5" />
              {rejectConfirm ? "Confirm?" : "Reject All"}
            </Button>

            <div className="flex-1" />

            {/* Clear */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BulkActionsToolbar;
