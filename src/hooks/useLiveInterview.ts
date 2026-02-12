import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useDeepgramTranscription } from "./useDeepgramTranscription";
import { supabase } from "@/lib/supabase";
import type { InterviewFlag, InterviewTimeline } from "@/types";
import type { LiveScores } from "@/types";

const CHUNK_INTERVAL_MS = 20_000;
const MIN_WORDS_PER_CHUNK = 15;

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
}

export function useLiveInterview(interviewId: string): UseLiveInterviewReturn {
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [scores, setScores] = useState<LiveScores>({ speech: 0, timing: 0, flow: 0, linguistic: 0 });
  const [flags, setFlags] = useState<InterviewFlag[]>([]);
  const [timeline, setTimeline] = useState<InterviewTimeline[]>([]);
  const [notes, setNotes] = useState("");

  const audio = useAudioCapture();
  const deepgram = useDeepgramTranscription();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkIndexRef = useRef(0);
  const lastChunkEndRef = useRef(0);

  const overallScore = scores.speech + scores.timing + scores.flow + scores.linguistic;

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
    const fullTranscript = deepgram.transcript;
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
          previous_scores: scores,
        },
      });

      if (!error && data?.scores) {
        setScores(data.scores);
      }
    } catch (err) {
      console.error("Chunk analysis error:", err);
    }
  }, [deepgram.transcript, interviewId, elapsedSeconds, scores]);

  const start = useCallback(async () => {
    // Update interview status
    await supabase
      .from("interviews")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", interviewId);

    // Start audio capture first to determine the actual sample rate
    // Buffer audio until Deepgram is connected
    const audioBuffer: ArrayBuffer[] = [];
    let dgReady = false;

    await audio.startCapture((pcm16) => {
      if (dgReady) {
        deepgram.sendAudio(pcm16);
      } else {
        audioBuffer.push(pcm16);
      }
    });

    // Connect to Deepgram with the actual sample rate from the AudioContext
    await deepgram.connect(audio.sampleRate);
    dgReady = true;

    // Flush buffered audio
    for (const chunk of audioBuffer) {
      deepgram.sendAudio(chunk);
    }
    audioBuffer.length = 0;

    setIsActive(true);

    // Start chunk analysis timer
    chunkTimerRef.current = setInterval(() => {
      sendChunkForAnalysis();
    }, CHUNK_INTERVAL_MS);
  }, [interviewId, deepgram, audio, sendChunkForAnalysis]);

  const stop = useCallback(async () => {
    setIsActive(false);

    // Stop timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);

    // Stop capture
    audio.stopCapture();
    deepgram.disconnect();

    // Send final chunk
    await sendChunkForAnalysis();

    // Save full transcript and mark as completed
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

    // Generate final report (fails gracefully if edge functions aren't deployed)
    try {
      await supabase.functions.invoke("generate-final-report", {
        body: { interview_id: interviewId },
      });
    } catch {
      // Edge function not deployed yet — report generation skipped
    }
  }, [audio, deepgram, interviewId, notes, sendChunkForAnalysis]);

  return {
    isActive,
    elapsedSeconds,
    transcript: deepgram.transcript,
    interimText: deepgram.interimText,
    scores,
    overallScore,
    flags,
    timeline,
    audioError: audio.error,
    isTranscribing: deepgram.isConnected,
    start,
    stop,
    notes,
    setNotes,
  };
}
