import { useState, useEffect, useRef, useCallback } from "react";
import { useDeepgramTranscription } from "./useDeepgramTranscription";
import { supabase } from "@/lib/supabase";
import type { InterviewFlag, InterviewTimeline } from "@/types";
import type { LiveScores } from "@/types";

const CHUNK_INTERVAL_MS = 20_000;
const MIN_WORDS_PER_CHUNK = 10;

interface UseLiveInterviewReturn {
  isActive: boolean;
  elapsedSeconds: number;
  transcript: string;
  interimText: string;
  scores: LiveScores;
  overallScore: number;
  flags: InterviewFlag[];
  timeline: InterviewTimeline[];
  audioError: string | null;
  isTranscribing: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  notes: string;
  setNotes: (notes: string) => void;
  triggerAnalysis: () => Promise<void>;
}

export function useLiveInterview(interviewId: string): UseLiveInterviewReturn {
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [scores, setScores] = useState<LiveScores>({ speech: 0, timing: 0, flow: 0, linguistic: 0 });
  const [flags, setFlags] = useState<InterviewFlag[]>([]);
  const [timeline, setTimeline] = useState<InterviewTimeline[]>([]);
  const [notes, setNotes] = useState("");
  const [audioError, setAudioError] = useState<string | null>(null);

  const deepgram = useDeepgramTranscription();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkIndexRef = useRef(0);
  const lastChunkEndRef = useRef(0);
  const transcriptRef = useRef("");
  const scoresRef = useRef<LiveScores>(scores);

  const overallScore = scores.speech + scores.timing + scores.flow + scores.linguistic;

  // Keep refs in sync with state for interval callbacks
  useEffect(() => {
    transcriptRef.current = deepgram.transcript;
  }, [deepgram.transcript]);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  // Timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // Subscribe to realtime flags and timeline updates
  useEffect(() => {
    if (!interviewId) return;

    const flagChannel = supabase
      .channel(`flags-${interviewId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interview_flags", filter: `interview_id=eq.${interviewId}` },
        (payload) => {
          setFlags((prev) => [...prev, payload.new as InterviewFlag]);
        }
      )
      .subscribe();

    const timelineChannel = supabase
      .channel(`timeline-${interviewId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interview_timeline", filter: `interview_id=eq.${interviewId}` },
        (payload) => {
          setTimeline((prev) => [...prev, payload.new as InterviewTimeline]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(flagChannel);
      supabase.removeChannel(timelineChannel);
    };
  }, [interviewId]);

  // Send transcript chunks for analysis periodically
  const sendChunkForAnalysis = useCallback(async () => {
    const fullTranscript = transcriptRef.current;
    const currentScores = scoresRef.current;

    const newText = fullTranscript.slice(lastChunkEndRef.current);
    const wordCount = newText.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount < MIN_WORDS_PER_CHUNK) return;

    lastChunkEndRef.current = fullTranscript.length;
    const currentChunk = chunkIndexRef.current++;

    try {
      const { data, error } = await supabase.functions.invoke("analyze-chunk", {
        body: {
          interview_id: interviewId,
          chunk_text: newText,
          chunk_index: currentChunk,
          elapsed_seconds: elapsedSeconds,
          previous_scores: currentScores,
        },
      });

      if (error) {
        console.error("[analysis] Edge function error:", error);
      } else if (data?.scores) {
        setScores(data.scores);
      }
    } catch (err) {
      console.error("[analysis] Exception:", err);
    }
  }, [interviewId, elapsedSeconds]);

  const start = useCallback(async () => {
    try {
      setAudioError(null);

      await supabase
        .from("interviews")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", interviewId);

      await deepgram.connect();
      setIsActive(true);

      chunkTimerRef.current = setInterval(() => {
        sendChunkForAnalysis();
      }, CHUNK_INTERVAL_MS);

      // Run initial analysis after 5 seconds
      setTimeout(() => {
        sendChunkForAnalysis();
      }, 5000);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to start interview";
      console.error("[useLiveInterview] Start error:", errorMessage);
      setAudioError(errorMessage);
      throw error;
    }
  }, [interviewId, deepgram, sendChunkForAnalysis]);

  const stop = useCallback(async () => {
    setIsActive(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);

    deepgram.disconnect();

    await sendChunkForAnalysis();

    const fullTranscript = deepgram.transcript;
    await supabase
      .from("interviews")
      .update({
        status: "completed",
        transcript: fullTranscript,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", interviewId);

    try {
      await supabase.functions.invoke("generate-final-report", {
        body: { interview_id: interviewId },
      });
    } catch {
      // Edge function not deployed yet — report generation skipped
    }
  }, [deepgram, interviewId, notes, sendChunkForAnalysis]);

  return {
    isActive,
    elapsedSeconds,
    transcript: deepgram.transcript,
    interimText: deepgram.interimText,
    scores,
    overallScore,
    flags,
    timeline,
    audioError,
    isTranscribing: deepgram.isConnected,
    start,
    stop,
    notes,
    setNotes,
    triggerAnalysis: sendChunkForAnalysis,
  };
}
