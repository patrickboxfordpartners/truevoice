import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface BehaviorEvent {
  type: "tab_switch" | "tab_return" | "paste" | "window_blur" | "window_focus";
  timestamp: number;
  durationMs?: number;
  detail?: string;
}

interface UseBehaviorMonitorOptions {
  interviewId: string;
  enabled: boolean;
  elapsedSeconds: number;
}

/**
 * Monitors candidate behavior during an interview:
 * - Tab/window visibility changes (switching to another app/tab)
 * - Clipboard paste events
 * - Tracks time spent away from the interview tab
 *
 * Flags are written directly to the interview_flags table so
 * the interviewer sees them in real-time via their Supabase subscription.
 */
export function useBehaviorMonitor({ interviewId, enabled, elapsedSeconds }: UseBehaviorMonitorOptions) {
  const eventsRef = useRef<BehaviorEvent[]>([]);
  const leaveTimeRef = useRef<number | null>(null);
  const tabSwitchCountRef = useRef(0);
  const pasteCountRef = useRef(0);
  const elapsedRef = useRef(elapsedSeconds);

  // Keep elapsed ref current for callbacks
  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, []);

  const sendFlag = useCallback(async (pattern: string, severity: "low" | "medium" | "high") => {
    if (!interviewId) return;
    const time = formatTime(elapsedRef.current);
    await supabase.from("interview_flags").insert({
      interview_id: interviewId,
      time,
      pattern,
      severity,
    });
  }, [interviewId, formatTime]);

  useEffect(() => {
    if (!enabled || !interviewId) return;

    // --- Tab visibility ---
    const handleVisibilityChange = () => {
      const now = Date.now();

      if (document.hidden) {
        leaveTimeRef.current = now;
        tabSwitchCountRef.current++;
        eventsRef.current.push({ type: "tab_switch", timestamp: now });

        // First tab switch is low severity, repeated switches escalate
        const count = tabSwitchCountRef.current;
        if (count === 1) {
          sendFlag("Candidate switched away from interview tab", "low");
        } else if (count <= 3) {
          sendFlag(`Candidate left interview tab (${count} times)`, "medium");
        } else {
          sendFlag(`Candidate left interview tab (${count} times total)`, "high");
        }
      } else if (leaveTimeRef.current) {
        const awayMs = now - leaveTimeRef.current;
        const awaySec = Math.round(awayMs / 1000);
        eventsRef.current.push({ type: "tab_return", timestamp: now, durationMs: awayMs });
        leaveTimeRef.current = null;

        if (awaySec >= 10) {
          sendFlag(`Candidate was away from tab for ${awaySec}s`, "high");
        } else if (awaySec >= 3) {
          sendFlag(`Candidate returned after ${awaySec}s away`, "medium");
        }
      }
    };

    // --- Window blur/focus (catches alt-tab to other apps) ---
    const handleBlur = () => {
      if (!document.hidden) {
        // Window lost focus but tab is still visible (e.g. floating window scenario)
        leaveTimeRef.current = leaveTimeRef.current || Date.now();
        eventsRef.current.push({ type: "window_blur", timestamp: Date.now() });
      }
    };

    const handleFocus = () => {
      if (leaveTimeRef.current && !document.hidden) {
        const awayMs = Date.now() - leaveTimeRef.current;
        eventsRef.current.push({ type: "window_focus", timestamp: Date.now(), durationMs: awayMs });
        leaveTimeRef.current = null;
      }
    };

    // --- Clipboard paste detection ---
    const handlePaste = (e: ClipboardEvent) => {
      pasteCountRef.current++;
      const textLength = e.clipboardData?.getData("text")?.length || 0;
      const detail = textLength > 0 ? `${textLength} characters` : "non-text content";
      eventsRef.current.push({ type: "paste", timestamp: Date.now(), detail });

      const count = pasteCountRef.current;
      if (count === 1) {
        sendFlag(`Clipboard paste detected (${detail})`, "medium");
      } else {
        sendFlag(`Clipboard paste detected (${count} total, ${detail})`, "high");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("paste", handlePaste);
    };
  }, [enabled, interviewId, sendFlag]);

  return {
    events: eventsRef.current,
    tabSwitchCount: tabSwitchCountRef.current,
    pasteCount: pasteCountRef.current,
  };
}
