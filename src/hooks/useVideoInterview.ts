import { useState, useEffect, useRef, useCallback } from "react";
import { useDeepgramTranscription } from "./useDeepgramTranscription";
import { supabase } from "@/lib/supabase";
import type { InterviewFlag, InterviewTimeline, LiveScores } from "@/types";

const CHUNK_INTERVAL_MS = 20_000;
const MIN_WORDS_PER_CHUNK = 10;

interface UseVideoInterviewReturn {
  transcript: string;
  interimText: string;
  scores: LiveScores;
  overallScore: number;
  flags: InterviewFlag[];
  timeline: InterviewTimeline[];
  isTranscribing: boolean;
  startTranscription: () => Promise<void>;
  stopTranscription: () => void;
}

/**
 * Hook for live video interviews with AI analysis
 * Captures audio via Deepgram, analyzes every 20 seconds
 * Syncs scores via Supabase realtime
 */
export function useVideoInterview(interviewId: string): UseVideoInterviewReturn {
  const [scores, setScores] = useState<LiveScores>({ speech: 0, timing: 0, flow: 0, linguistic: 0 });
  const [flags, setFlags] = useState<InterviewFlag[]>([]);
  const [timeline, setTimeline] = useState<InterviewTimeline[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const deepgram = useDeepgramTranscription();

  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkIndexRef = useRef(0);
  const transcriptRef = useRef("");
  const scoresRef = useRef<LiveScores>(scores);
  const startedRef = useRef(false);

  const overallScore = scores.speech + scores.timing + scores.flow + scores.linguistic;

  // Keep refs in sync
  useEffect(() => {
    transcriptRef.current = deepgram.transcript;
  }, [deepgram.transcript]);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  // Timer for elapsed seconds
  useEffect(() => {
    if (startedRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startedRef.current]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!interviewId) return;

    // Subscribe to flags
    const flagChannel = supabase
      .channel(`video-flags-${interviewId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interview_flags", filter: `interview_id=eq.${interviewId}` },
        (payload) => {
          setFlags((prev) => [...prev, payload.new as InterviewFlag]);
        }
      )
      .subscribe();

    // Subscribe to timeline
    const timelineChannel = supabase
      .channel(`video-timeline-${interviewId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interview_timeline", filter: `interview_id=eq.${interviewId}` },
        (payload) => {
          setTimeline((prev) => [...prev, payload.new as InterviewTimeline]);
        }
      )
      .subscribe();

    // Subscribe to score updates
    const scoresChannel = supabase
      .channel(`video-scores-${interviewId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interviews", filter: `id=eq.${interviewId}` },
        (payload: any) => {
          if (payload.new.latest_scores) {
            setScores(payload.new.latest_scores);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(flagChannel);
      supabase.removeChannel(timelineChannel);
      supabase.removeChannel(scoresChannel);
    };
  }, [interviewId]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, []);

  const sendChunkForAnalysis = useCallback(async () => {
    const fullTranscript = transcriptRef.current;
    const currentScores = scoresRef.current;
    const currentElapsed = elapsedSeconds;

    console.log(`[videoInterview] Checking chunk #${chunkIndexRef.current}`, {
      length: fullTranscript.length,
      words: fullTranscript.split(/\s+/).filter(Boolean).length,
    });

    if (!fullTranscript) {
      console.log("[videoInterview] No transcript yet");
      return;
    }

    const wordCount = fullTranscript.split(/\s+/).filter(Boolean).length;
    if (wordCount < MIN_WORDS_PER_CHUNK) {
      console.log(`[videoInterview] Only ${wordCount} words, need ${MIN_WORDS_PER_CHUNK}`);
      return;
    }

    console.log(`[videoInterview] ✅ Sending chunk #${chunkIndexRef.current} for analysis (${wordCount} words)`);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-chunk", {
        body: {
          interview_id: interviewId,
          chunk_text: fullTranscript,
          chunk_index: chunkIndexRef.current,
          elapsed_seconds: currentElapsed,
          previous_scores: currentScores,
        },
      });

      if (error) {
        console.error("[videoInterview] Analysis error:", error);
        return;
      }

      console.log("[videoInterview] ✅ Received scores:", data);

      if (data && typeof data === "object") {
        const newScores = {
          speech: data.speech || 0,
          timing: data.timing || 0,
          flow: data.flow || 0,
          linguistic: data.linguistic || 0,
        };

        // Update local state
        setScores(newScores);

        // Update database (triggers realtime for interviewer)
        await supabase
          .from("interviews")
          .update({
            latest_scores: newScores,
            updated_at: new Date().toISOString(),
          })
          .eq("id", interviewId);

        // Add to timeline
        await supabase.from("interview_timeline").insert({
          interview_id: interviewId,
          timestamp: formatTime(currentElapsed),
          speech: newScores.speech,
          timing: newScores.timing,
          flow: newScores.flow,
          linguistic: newScores.linguistic,
          overall: newScores.speech + newScores.timing + newScores.flow + newScores.linguistic,
        });

        chunkIndexRef.current++;
      }
    } catch (err) {
      console.error("[videoInterview] Exception:", err);
    }
  }, [interviewId, elapsedSeconds, formatTime]);

  const startTranscription = useCallback(async () => {
    if (startedRef.current) return;

    console.log("[videoInterview] Starting transcription and analysis");
    startedRef.current = true;

    try {
      await deepgram.start();

      // First analysis after 5 seconds
      setTimeout(() => {
        sendChunkForAnalysis();
      }, 5000);

      // Regular analysis every 20 seconds
      chunkTimerRef.current = setInterval(() => {
        sendChunkForAnalysis();
      }, CHUNK_INTERVAL_MS);
    } catch (error) {
      console.error("[videoInterview] Failed to start transcription:", error);
      startedRef.current = false;
    }
  }, [deepgram, sendChunkForAnalysis]);

  const stopTranscription = useCallback(() => {
    console.log("[videoInterview] Stopping transcription");
    startedRef.current = false;

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    deepgram.stop();
  }, [deepgram]);

  return {
    transcript: deepgram.transcript,
    interimText: deepgram.interimText,
    scores,
    overallScore,
    flags,
    timeline,
    isTranscribing: deepgram.isTranscribing,
    startTranscription,
    stopTranscription,
  };
}
