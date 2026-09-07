import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "j", label: "Next candidate" },
  { key: "k", label: "Previous candidate" },
  { key: "s", label: "Change stage" },
  { key: "n", label: "Open notes" },
  { key: "f", label: "Toggle search/filter" },
  { key: "e", label: "Export" },
  { key: "?", label: "Toggle this help" },
  { key: "Esc", label: "Close panel" },
  { key: "1", label: "Jump to Screening" },
  { key: "2", label: "Jump to Technical" },
  { key: "3", label: "Jump to Final" },
  { key: "4", label: "Jump to Offer" },
  { key: "5", label: "Jump to Hired" },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-muted border border-border text-xs font-mono font-semibold text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-md mx-4 bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <Keyboard className="h-4.5 w-4.5 text-[hsl(160,84%,39%)]" />
                <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {SHORTCUTS.map((s) => (
                  <div key={s.key} className="flex items-center gap-3">
                    <Kbd>{s.key}</Kbd>
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Shortcuts are disabled when typing in an input field
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default KeyboardShortcutsHelp;
