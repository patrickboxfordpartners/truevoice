import { useState, useEffect, useRef, useCallback } from "react";
import { useAssemblyAITranscription } from "./useAssemblyAITranscription";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
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

export function useVideoInterview(interviewId: string, mode?: string): UseVideoInterviewReturn {
  const [scores, setScores] = useState<LiveScores>({ speech: 0, timing: 0, flow: 0, linguistic: 0 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const deepgram = useAssemblyAITranscription();
  const analyzeChunk = useAction(api.actions.analyzeChunk.analyzeChunk);

  const convexFlags = useQuery(api.interviewData.getFlags, interviewId ? { interviewId } : "skip") ?? [];
  const convexTimeline = useQuery(api.interviewData.getTimeline, interviewId ? { interviewId } : "skip") ?? [];

  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkIndexRef = useRef(0);
  const transcriptRef = useRef("");
  const scoresRef = useRef<LiveScores>(scores);
  const startedRef = useRef(false);

  const overallScore = scores.speech + scores.timing + scores.flow + scores.linguistic;

  useEffect(() => { transcriptRef.current = deepgram.transcript; }, [deepgram.transcript]);
  useEffect(() => { scoresRef.current = scores; }, [scores]);

  useEffect(() => {
    if (startedRef.current) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startedRef.current]);

  const sendChunkForAnalysis = useCallback(async () => {
    const fullTranscript = transcriptRef.current;
    const currentScores = scoresRef.current;
    const currentElapsed = elapsedSeconds;

    if (!fullTranscript) return;
    const wordCount = fullTranscript.split(/\s+/).filter(Boolean).length;
    if (wordCount < MIN_WORDS_PER_CHUNK) return;

    try {
      const result = await analyzeChunk({
        interviewId,
        chunkText: fullTranscript,
        chunkIndex: chunkIndexRef.current,
        elapsedSeconds: currentElapsed,
        previousScores: currentScores,
        mode: mode || "interview",
      });

      if (result?.scores) {
        setScores({
          speech: result.scores.speech ?? 0,
          timing: result.scores.timing ?? 0,
          flow: result.scores.flow ?? 0,
          linguistic: result.scores.linguistic ?? 0,
        });
        chunkIndexRef.current++;
      }
    } catch (err) {
      console.error("[videoInterview] Analysis error:", err);
    }
  }, [interviewId, elapsedSeconds, analyzeChunk, mode]);

  const startTranscription = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      const language = localStorage.getItem("interview_language") || "en";
      await deepgram.connect(language, interviewId);

      setTimeout(() => sendChunkForAnalysis(), 5000);
      chunkTimerRef.current = setInterval(() => sendChunkForAnalysis(), CHUNK_INTERVAL_MS);
    } catch (error) {
      console.error("[videoInterview] Failed to start:", error);
      startedRef.current = false;
    }
  }, [deepgram, sendChunkForAnalysis, interviewId]);

  const stopTranscription = useCallback(() => {
    startedRef.current = false;
    if (chunkTimerRef.current) { clearInterval(chunkTimerRef.current); chunkTimerRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    deepgram.disconnect();
  }, [deepgram]);

  return {
    transcript: deepgram.transcript,
    interimText: deepgram.interimText,
    scores,
    overallScore,
    flags: convexFlags as InterviewFlag[],
    timeline: convexTimeline as InterviewTimeline[],
    isTranscribing: deepgram.isConnected,
    startTranscription,
    stopTranscription,
  };
}
