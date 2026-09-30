import { useState, useEffect, useRef, useCallback } from "react";
import { useAssemblyAITranscription } from "./useAssemblyAITranscription";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { InterviewFlag, InterviewTimeline } from "@/types";
import type { LiveScores } from "@/types";

const CHUNK_INTERVAL_MS = 20_000;
const MIN_WORDS_PER_CHUNK = 10;
const MIN_GAP_SECONDS = 0.5;
const MAX_GAP_SECONDS = 30;

interface ResponseDelay {
  question: string;
  delay: number;
  label: "instant" | "normal" | "delayed";
}

function classifyDelay(gap: number): "instant" | "normal" | "delayed" {
  if (gap < 1.5) return "instant";
  if (gap <= 4.0) return "normal";
  return "delayed";
}

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
  isRecording: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  notes: string;
  setNotes: (notes: string) => void;
  triggerAnalysis: () => Promise<void>;
}

export function useLiveInterview(interviewId: string, companyId?: string): UseLiveInterviewReturn {
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [scores, setScores] = useState<LiveScores>({ speech: 0, timing: 0, flow: 0, linguistic: 0 });
  const [notes, setNotesState] = useState("");
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const egressIdRef = useRef<string | null>(null);
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyzeChunk = useAction(api.actions.analyzeChunk.analyzeChunk);
  const updateStatus = useMutation(api.interviews.updateStatus);
  const updateInterview = useMutation(api.interviews.update);

  const convexFlags = useQuery(api.interviewData.getFlags, interviewId ? { interviewId } : "skip") ?? [];
  const convexTimeline = useQuery(api.interviewData.getTimeline, interviewId ? { interviewId } : "skip") ?? [];

  const setNotes = useCallback((value: string) => {
    setNotesState(value);
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(() => {
      updateInterview({ interviewId, notes: value || undefined });
    }, 1500);
  }, [interviewId, updateInterview]);

  const deepgram = useAssemblyAITranscription();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkIndexRef = useRef(0);
  const lastChunkEndRef = useRef(0);
  const transcriptRef = useRef("");
  const scoresRef = useRef<LiveScores>(scores);
  const responseDelaysRef = useRef<ResponseDelay[]>([]);
  const lastResultIndexRef = useRef(0);
  const elapsedSecondsRef = useRef(0);

  const overallScore = scores.speech + scores.timing + scores.flow + scores.linguistic;

  useEffect(() => { transcriptRef.current = deepgram.transcript; }, [deepgram.transcript]);
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { elapsedSecondsRef.current = elapsedSeconds; }, [elapsedSeconds]);

  useEffect(() => {
    const results = deepgram.results;
    const newCount = results.length;
    const prevCount = lastResultIndexRef.current;
    if (newCount < 2 || newCount <= prevCount) return;

    for (let i = Math.max(prevCount, 1); i < newCount; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      const prevLastWord = prev.words[prev.words.length - 1];
      const currFirstWord = curr.words[0];
      if (!prevLastWord || !currFirstWord) continue;
      const gap = currFirstWord.start - prevLastWord.end;
      if (gap < MIN_GAP_SECONDS || gap > MAX_GAP_SECONDS) continue;
      const prevWords = prev.words.map((w) => w.punctuated_word ?? w.word);
      const snippet = prevWords.slice(-8).join(" ");
      const question = prevWords.length > 8 ? `...${snippet}` : snippet;
      responseDelaysRef.current.push({ question, delay: Math.round(gap * 100) / 100, label: classifyDelay(gap) });
    }
    lastResultIndexRef.current = newCount;
  }, [deepgram.results]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const sendChunkForAnalysis = useCallback(async () => {
    const fullTranscript = transcriptRef.current;
    const currentScores = scoresRef.current;
    const newText = fullTranscript.slice(lastChunkEndRef.current);
    const wordCount = newText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < MIN_WORDS_PER_CHUNK) return;

    lastChunkEndRef.current = fullTranscript.length;
    const currentChunk = chunkIndexRef.current++;
    const pendingDelays = responseDelaysRef.current.splice(0);

    try {
      const result = await analyzeChunk({
        interviewId,
        chunkText: newText,
        chunkIndex: currentChunk,
        elapsedSeconds: elapsedSecondsRef.current,
        previousScores: currentScores,
        responseDelays: pendingDelays.length > 0 ? pendingDelays : undefined,
        companyId,
      });

      if (result?.scores) {
        setScores(result.scores);
      }
    } catch (err) {
      console.error("[analysis] Convex action error:", err);
    }
  }, [interviewId, companyId, analyzeChunk]);

  const start = useCallback(async () => {
    try {
      setAudioError(null);
      await updateStatus({ interviewId, status: "in_progress" });

      const language = localStorage.getItem("interview_language") || "en";
      await deepgram.connect(language, interviewId);
      setIsActive(true);

      chunkTimerRef.current = setInterval(() => sendChunkForAnalysis(), CHUNK_INTERVAL_MS);
      setTimeout(() => sendChunkForAnalysis(), 5000);

      // TODO: Wire start-recording Convex action when LiveKit egress is migrated
      const roomName = `interview-${interviewId}`;
      console.log("[useLiveInterview] Recording start skipped (pending Convex migration)", roomName);
    } catch (error: any) {
      setAudioError(error.message || "Failed to start interview");
      throw error;
    }
  }, [interviewId, deepgram, sendChunkForAnalysis, updateStatus]);

  const stop = useCallback(async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    deepgram.disconnect();

    // TODO: Wire stop-recording Convex action when LiveKit egress is migrated
    const currentEgressId = egressIdRef.current;
    if (currentEgressId) {
      setIsRecording(false);
      egressIdRef.current = null;
      console.log("[useLiveInterview] Recording stop skipped (pending Convex migration)", currentEgressId);
    }

    await sendChunkForAnalysis();

    const fullTranscript = deepgram.transcript;
    await updateInterview({ interviewId, transcript: fullTranscript, status: "completed" });

    try {
      const { ConvexHttpClient } = await import("convex/browser");
      const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
      await client.action(api.actions.generateFinalReport.generate, { interviewId });
    } catch (e) { console.warn("[useLiveInterview] Final report generation failed:", e); }
  }, [deepgram, interviewId, sendChunkForAnalysis, updateInterview]);

  return {
    isActive,
    elapsedSeconds,
    transcript: deepgram.transcript,
    interimText: deepgram.interimText,
    scores,
    overallScore,
    flags: convexFlags as InterviewFlag[],
    timeline: convexTimeline as InterviewTimeline[],
    audioError,
    isTranscribing: deepgram.isConnected,
    isRecording,
    start,
    stop,
    notes,
    setNotes,
    triggerAnalysis: sendChunkForAnalysis,
  };
}
