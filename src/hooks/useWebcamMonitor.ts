import { useEffect, useRef, useCallback, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UseWebcamMonitorOptions {
  interviewId: string;
  enabled: boolean;
  elapsedSeconds: number;
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

  const analyzeFrame = useAction(api.actions.analyzeFrame.analyzeFrame);
  const insertFlags = useMutation(api.interviewData.insertFlags);

  useEffect(() => { elapsedRef.current = elapsedSeconds; }, [elapsedSeconds]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, []);

  const sendFlag = useCallback(async (pattern: string, severity: "low" | "medium" | "high") => {
    if (!interviewId) return;
    await insertFlags({
      interviewId,
      flags: [{ time: formatTime(elapsedRef.current), pattern, severity, flagType: "visual" }],
    });
  }, [interviewId, formatTime, insertFlags]);

  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, 320, 240);

    const imageData = canvas.toDataURL("image/jpeg", 0.6);
    const base64 = imageData.split(",")[1];

    try {
      const analysis: GazeAnalysis = await analyzeFrame({
        interviewId,
        imageBase64: base64,
        elapsedSeconds: elapsedRef.current,
      });

      if (!analysis) return;

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

      if (analysis.multiple_faces) sendFlag("Multiple faces detected, possible assistance", "high");
      if (analysis.reading_detected) sendFlag("Candidate appears to be reading from a screen", "high");
      if (analysis.looking_away && !analysis.reading_detected && !analysis.no_face) sendFlag("Candidate looking away from camera", "low");
      if (analysis.phone_visible) sendFlag("Phone or secondary device visible", "medium");
    } catch {
      // Vision analysis failed silently
    }
  }, [interviewId, sendFlag, intervalSeconds, analyzeFrame]);

  useEffect(() => {
    if (!enabled || !interviewId) return;
    let mounted = true;

    const startCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        const video = document.createElement("video");
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        await video.play();
        videoRef.current = video;
        canvasRef.current = document.createElement("canvas");
        setIsActive(true);

        intervalRef.current = setInterval(() => captureAndAnalyze(), intervalSeconds * 1000);
        setTimeout(() => { if (mounted) captureAndAnalyze(); }, 3000);
      } catch { /* Camera access denied */ }
    };

    startCapture();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      videoRef.current = null;
      canvasRef.current = null;
      setIsActive(false);
    };
  }, [enabled, interviewId, intervalSeconds, captureAndAnalyze]);

  return { isActive };
}
