import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UseWebcamMonitorOptions {
  interviewId: string;
  enabled: boolean;
  elapsedSeconds: number;
  /** Seconds between snapshots. Default 15. */
  intervalSeconds?: number;
}

interface GazeAnalysis {
  looking_away: boolean;
  reading_detected: boolean;
  multiple_faces: boolean;
  no_face: boolean;
  phone_visible: boolean;
  description: string;
}

/**
 * Periodically captures webcam frames and analyzes them for:
 * - Eyes looking off-screen (reading from another monitor)
 * - No face detected (stepped away)
 * - Multiple faces (someone helping)
 * - Phone visible
 *
 * Uses the XAI Grok vision API via a Supabase edge function.
 */
export function useWebcamMonitor({
  interviewId,
  enabled,
  elapsedSeconds,
  intervalSeconds = 15,
}: UseWebcamMonitorOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(elapsedSeconds);
  const [isActive, setIsActive] = useState(false);
  const consecutiveAwayRef = useRef(0);

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
    await supabase.from("interview_flags").insert({
      interview_id: interviewId,
      time: formatTime(elapsedRef.current),
      pattern,
      severity,
    });
  }, [interviewId, formatTime]);

  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    // Capture frame
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, 320, 240);

    const imageData = canvas.toDataURL("image/jpeg", 0.6);
    const base64 = imageData.split(",")[1];

    try {
      const { data, error } = await supabase.functions.invoke("analyze-frame", {
        body: {
          interview_id: interviewId,
          image_base64: base64,
          elapsed_seconds: elapsedRef.current,
        },
      });

      if (error || !data) return;

      const analysis: GazeAnalysis = data;

      if (analysis.no_face) {
        consecutiveAwayRef.current++;
        if (consecutiveAwayRef.current >= 2) {
          sendFlag(`No face detected for ${consecutiveAwayRef.current * intervalSeconds}s+`, "high");
        } else {
          sendFlag("No face detected in frame", "medium");
        }
      } else {
        consecutiveAwayRef.current = 0;
      }

      if (analysis.multiple_faces) {
        sendFlag("Multiple faces detected, possible assistance", "high");
      }

      if (analysis.reading_detected) {
        sendFlag("Candidate appears to be reading from a screen", "high");
      }

      if (analysis.looking_away && !analysis.reading_detected && !analysis.no_face) {
        sendFlag("Candidate looking away from camera", "low");
      }

      if (analysis.phone_visible) {
        sendFlag("Phone or secondary device visible", "medium");
      }
    } catch {
      // Vision analysis failed silently, don't disrupt the interview
    }
  }, [interviewId, sendFlag, intervalSeconds]);

  useEffect(() => {
    if (!enabled || !interviewId) return;

    let mounted = true;

    const startCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        // Create hidden video element
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        await video.play();
        videoRef.current = video;

        // Create offscreen canvas
        const canvas = document.createElement("canvas");
        canvasRef.current = canvas;

        setIsActive(true);

        // Start periodic capture
        intervalRef.current = setInterval(() => {
          captureAndAnalyze();
        }, intervalSeconds * 1000);

        // First capture after a short delay
        setTimeout(() => {
          if (mounted) captureAndAnalyze();
        }, 3000);
      } catch {
        // Camera access denied or unavailable, monitor silently disabled
      }
    };

    startCapture();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      videoRef.current = null;
      canvasRef.current = null;
      setIsActive(false);
    };
  }, [enabled, interviewId, intervalSeconds, captureAndAnalyze]);

  return { isActive };
}
