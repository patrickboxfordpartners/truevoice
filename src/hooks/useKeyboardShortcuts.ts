import { useEffect, useState, useCallback } from "react";

type Stage = "screening" | "technical" | "final" | "offer" | "hired";

const STAGE_MAP: Record<string, Stage> = {
  "1": "screening",
  "2": "technical",
  "3": "final",
  "4": "offer",
  "5": "hired",
};

export interface KeyboardShortcutHandlers {
  onNavigate?: (direction: "up" | "down") => void;
  onStageChange?: () => void;
  onOpenNotes?: () => void;
  onToggleSearch?: () => void;
  onExport?: () => void;
  onClose?: () => void;
  onJumpToStage?: (stage: Stage) => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) {
        if (e.key === "Escape") {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "j":
          e.preventDefault();
          handlers.onNavigate?.("down");
          break;
        case "k":
          e.preventDefault();
          handlers.onNavigate?.("up");
          break;
        case "s":
          e.preventDefault();
          handlers.onStageChange?.();
          break;
        case "n":
          e.preventDefault();
          handlers.onOpenNotes?.();
          break;
        case "f":
          e.preventDefault();
          handlers.onToggleSearch?.();
          break;
        case "e":
          e.preventDefault();
          handlers.onExport?.();
          break;
        case "Escape":
          e.preventDefault();
          if (showHelp) {
            setShowHelp(false);
          } else {
            handlers.onClose?.();
          }
          break;
        case "?":
          e.preventDefault();
          setShowHelp((prev) => !prev);
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5": {
          e.preventDefault();
          const stage = STAGE_MAP[e.key];
          if (stage) handlers.onJumpToStage?.(stage);
          break;
        }
      }
    },
    [handlers, showHelp]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { showHelp, setShowHelp };
}
