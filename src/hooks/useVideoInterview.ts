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

export function useVideoInterview(
  interviewId: string,
  mode?: string,
  candidateToken?: string,
): UseVideoInterviewReturn {
  const [scores, setScores] = useState<LiveScores>({ speech: 0, timing: 0, flow: 0, linguistic: 0 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const deepgram = useAssemblyAITranscription();
  const analyzeChunk = useAction(api.actions.analyzeChunk.analyzeChunk);

  const convexFlags = useQuery(api.interviewData.getFlags, interviewId ? { interviewId } : "skip") ?? [];
  const convexTimeline = useQuery(api.interviewData.getTimeline, interviewId ? { interviewId } : "skip") ?? [];

  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkIndexRef = useRef(0);
  const lastChunkEndRef = useRef(0);
  const transcriptRef = useRef("");
  const scoresRef = useRef<LiveScores>(scores);
  const elapsedSecondsRef = useRef(0);
  const startedRef = useRef(false);

  const overallScore = scores.speech + scores.timing + scores.flow + scores.linguistic;

  useEffect(() => { transcriptRef.current = deepgram.transcript; }, [deepgram.transcript]);
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { elapsedSecondsRef.current = elapsedSeconds; }, [elapsedSeconds]);

  useEffect(() => {
    if (startedRef.current) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startedRef.current]);

  const sendChunkForAnalysis = useCallback(async () => {
    const fullTranscript = transcriptRef.current;
    const newText = fullTranscript.slice(lastChunkEndRef.current);
    const wordCount = newText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < MIN_WORDS_PER_CHUNK) return;

    const chunkEnd = fullTranscript.length;
    const chunkIndex = chunkIndexRef.current;

    try {
      const result = await analyzeChunk({
        interviewId,
        chunkText: newText,
        chunkIndex,
        elapsedSeconds: elapsedSecondsRef.current,
        previousScores: scoresRef.current,
        mode: mode || "interview",
      });

      // Only consume the chunk once analysis succeeded, so a transient failure
      // retries the same text on the next interval instead of dropping it.
      lastChunkEndRef.current = chunkEnd;
      chunkIndexRef.current = chunkIndex + 1;

      if (result?.scores) {
        setScores({
          speech: result.scores.speech ?? 0,
          timing: result.scores.timing ?? 0,
          flow: result.scores.flow ?? 0,
          linguistic: result.scores.linguistic ?? 0,
        });
      }
    } catch (err) {
      console.error("[videoInterview] Analysis error:", err);
    }
  }, [interviewId, analyzeChunk, mode]);

  const startTranscription = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      const language = localStorage.getItem("interview_language") || "en";
      await deepgram.connect(language, interviewId, candidateToken);

      setTimeout(() => sendChunkForAnalysis(), 5000);
      chunkTimerRef.current = setInterval(() => sendChunkForAnalysis(), CHUNK_INTERVAL_MS);
    } catch (error) {
      console.error("[videoInterview] Failed to start:", error);
      startedRef.current = false;
    }
  }, [deepgram, sendChunkForAnalysis, interviewId, candidateToken]);

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
