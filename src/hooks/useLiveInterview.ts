import { useState, useEffect, useRef, useCallback } from "react";
import { useDeepgramTranscription } from "./useDeepgramTranscription";
import { supabase } from "@/lib/supabase";
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
  const [flags, setFlags] = useState<InterviewFlag[]>([]);
  const [timeline, setTimeline] = useState<InterviewTimeline[]>([]);
  const [notes, setNotesState] = useState("");
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const egressIdRef = useRef<string | null>(null);
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved interviewer notes on mount
  useEffect(() => {
    if (!interviewId) return;
    supabase
      .from("interviews")
      .select("interviewer_notes")
      .eq("id", interviewId)
      .single()
      .then(({ data }) => {
        if (data?.interviewer_notes) setNotesState(data.interviewer_notes);
      });
  }, [interviewId]);

  // Debounced live save of interviewer notes (1.5s)
  const setNotes = useCallback((value: string) => {
    setNotesState(value);
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(() => {
      supabase
        .from("interviews")
        .update({ interviewer_notes: value || null })
        .eq("id", interviewId)
        .then(() => {});
    }, 1500);
  }, [interviewId]);

  const deepgram = useDeepgramTranscription();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkIndexRef = useRef(0);
  const lastChunkEndRef = useRef(0);
  const transcriptRef = useRef("");
  const scoresRef = useRef<LiveScores>(scores);
  const responseDelaysRef = useRef<ResponseDelay[]>([]);
  const lastResultIndexRef = useRef(0);

  const overallScore = scores.speech + scores.timing + scores.flow + scores.linguistic;

  // Keep refs in sync with state for interval callbacks
  useEffect(() => {
    transcriptRef.current = deepgram.transcript;
  }, [deepgram.transcript]);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  // Silence gap detection, runs whenever Deepgram appends a new final result
  useEffect(() => {
    const results = deepgram.results;
    const newCount = results.length;
    const prevCount = lastResultIndexRef.current;

    if (newCount < 2 || newCount <= prevCount) return;

    // Process any newly arrived results
    for (let i = Math.max(prevCount, 1); i < newCount; i++) {
      const prev = results[i - 1];
      const curr = results[i];

      const prevLastWord = prev.words[prev.words.length - 1];
      const currFirstWord = curr.words[0];

      if (!prevLastWord || !currFirstWord) continue;

      const gap = currFirstWord.start - prevLastWord.end;

      if (gap < MIN_GAP_SECONDS || gap > MAX_GAP_SECONDS) continue;

      // Build a short question reference from the last ~8 words of the previous utterance
      const prevWords = prev.words.map((w) => w.punctuated_word ?? w.word);
      const snippet = prevWords.slice(-8).join(" ");
      const question = prevWords.length > 8 ? `...${snippet}` : snippet;

      responseDelaysRef.current.push({
        question,
        delay: Math.round(gap * 100) / 100,
        label: classifyDelay(gap),
      });
    }

    lastResultIndexRef.current = newCount;
  }, [deepgram.results]);

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

    // Drain the delays buffer and clear it before the async call
    const pendingDelays = responseDelaysRef.current.splice(0);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-chunk", {
        body: {
          interview_id: interviewId,
          chunk_text: newText,
          chunk_index: currentChunk,
          elapsed_seconds: elapsedSeconds,
          previous_scores: currentScores,
          response_delays: pendingDelays.length > 0 ? pendingDelays : undefined,
          company_id: companyId,
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

      const language = localStorage.getItem("interview_language") || "en";
      await deepgram.connect(language);
      setIsActive(true);

      chunkTimerRef.current = setInterval(() => {
        sendChunkForAnalysis();
      }, CHUNK_INTERVAL_MS);

      // Run initial analysis after 5 seconds
      setTimeout(() => {
        sendChunkForAnalysis();
      }, 5000);

      // Start LiveKit recording, fire and forget; failure must not block the interview
      const roomName = `interview-${interviewId}`;
      supabase.functions
        .invoke("start-recording", { body: { interview_id: interviewId, room_name: roomName } })
        .then(({ data, error }) => {
          if (error) {
            console.warn("[useLiveInterview] Recording start failed (non-blocking):", error.message);
          } else if (data?.egress_id) {
            egressIdRef.current = data.egress_id;
            setIsRecording(true);
            console.log("[useLiveInterview] Recording started, egress_id:", data.egress_id);
          }
        })
        .catch((err) => {
          console.warn("[useLiveInterview] Recording start exception (non-blocking):", err);
        });
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

    // Stop LiveKit recording, fire and forget; failure must not block interview teardown
    const currentEgressId = egressIdRef.current;
    if (currentEgressId) {
      setIsRecording(false);
      egressIdRef.current = null;
      supabase.functions
        .invoke("stop-recording", { body: { interview_id: interviewId, egress_id: currentEgressId } })
        .then(({ error }) => {
          if (error) console.warn("[useLiveInterview] Recording stop failed (non-blocking):", error.message);
          else console.log("[useLiveInterview] Recording stopped, egress_id:", currentEgressId);
        })
        .catch((err) => {
          console.warn("[useLiveInterview] Recording stop exception (non-blocking):", err);
        });
    }

    await sendChunkForAnalysis();

    const fullTranscript = deepgram.transcript;
    await supabase
      .from("interviews")
      .update({
        status: "completed",
        transcript: fullTranscript,
        updated_at: new Date().toISOString(),
      })
      .eq("id", interviewId);

    try {
      await supabase.functions.invoke("generate-final-report", {
        body: { interview_id: interviewId },
      });
    } catch {
      // Edge function not deployed yet, report generation skipped
    }
  }, [deepgram, interviewId, sendChunkForAnalysis]);

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
    isRecording,
    start,
    stop,
    notes,
    setNotes,
    triggerAnalysis: sendChunkForAnalysis,
  };
}
