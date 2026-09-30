import { useState, useCallback, useRef } from "react";

interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  speaker?: number;
  punctuated_word?: string;
}

interface TranscriptResult {
  text: string;
  words: TranscriptWord[];
  isFinal: boolean;
  speaker?: number;
}

interface UseAssemblyAIReturn {
  isConnected: boolean;
  transcript: string;
  interimText: string;
  results: TranscriptResult[];
  connect: (language?: string, interviewId?: string, candidateToken?: string) => Promise<MediaStream>;
  disconnect: () => void;
}

export function useAssemblyAITranscription(): UseAssemblyAIReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [results, setResults] = useState<TranscriptResult[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connect = useCallback(async (language: string = "en", interviewId?: string, candidateToken?: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!interviewId) {
      throw new Error("Missing interviewId for AssemblyAI token generation");
    }

    // Mint a temp token via our edge function
    const tokenResponse = await fetch(`${supabaseUrl}/functions/v1/assemblyai-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnonKey,
        ...(candidateToken ? {} : { "Authorization": `Bearer ${supabaseAnonKey}` }),
      },
      body: JSON.stringify({
        interview_id: interviewId,
        ...(candidateToken ? { candidate_token: candidateToken } : {}),
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(error.error || "Failed to obtain AssemblyAI token");
    }

    const { token } = await tokenResponse.json();
    console.log("[assemblyai] Obtained temporary token");

    // Get mic stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 48000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;

    // Set up AudioWorklet for PCM16 conversion
    const audioContext = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule("/pcm-processor.js");

    const source = audioContext.createMediaStreamSource(stream);
    sourceNodeRef.current = source;

    const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
    workletNodeRef.current = workletNode;

    source.connect(workletNode);
    workletNode.connect(audioContext.destination);

    // Build WebSocket URL with params
    const params = new URLSearchParams({
      sample_rate: "16000",
      speech_model: "universal-3-5-pro",
      mode: "balanced",
      speaker_labels: "true",
      token,
    });

    if (language && language !== "en") {
      params.set("language_code", language);
    }

    const wsUrl = `wss://streaming.assemblyai.com/v3/ws?${params.toString()}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[assemblyai] WebSocket connected");
      setIsConnected(true);

      // Start sending PCM16 audio from the worklet
      workletNode.port.onmessage = (event: MessageEvent) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };
    };

    ws.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "Turn") {
        const words: TranscriptWord[] = (msg.words || []).map((w: any) => ({
          word: w.text,
          start: w.start / 1000, // ms to seconds for Deepgram compat
          end: w.end / 1000,
          speaker: w.speaker ?? msg.speaker_label,
          punctuated_word: w.text,
        }));

        const speakerLabel = msg.speaker_label != null ? msg.speaker_label : undefined;

        const result: TranscriptResult = {
          text: msg.transcript,
          words,
          isFinal: msg.end_of_turn === true,
          speaker: speakerLabel,
        };

        if (msg.end_of_turn) {
          setTranscript((prev) => (prev ? prev + " " + msg.transcript : msg.transcript));
          setInterimText("");
          setResults((prev) => [...prev, result]);
        } else {
          setInterimText(msg.transcript);
        }
      } else if (msg.type === "Begin") {
        console.log("[assemblyai] Session started:", msg.id);
      } else if (msg.type === "Termination") {
        console.log("[assemblyai] Session terminated:", {
          audio_duration: msg.audio_duration_seconds,
          session_duration: msg.session_duration_seconds,
        });
      } else if (msg.type === "SpeakerRevision") {
        // Update earlier results with revised speaker labels
        if (msg.revisions) {
          setResults((prev) => {
            const updated = [...prev];
            for (const rev of msg.revisions) {
              const idx = updated.findIndex(
                (r) => r.isFinal && r.text && rev.turn_order !== undefined
              );
              if (idx >= 0 && idx < updated.length) {
                updated[idx] = {
                  ...updated[idx],
                  speaker: rev.speaker_label,
                  words: rev.words
                    ? rev.words.map((w: any) => ({
                        word: w.text,
                        start: w.start / 1000,
                        end: w.end / 1000,
                        speaker: w.speaker ?? rev.speaker_label,
                        punctuated_word: w.text,
                      }))
                    : updated[idx].words,
                };
              }
            }
            return updated;
          });
        }
      }
    };

    ws.onerror = (error) => {
      console.error("[assemblyai] WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("[assemblyai] WebSocket closed:", event.code, event.reason);
      setIsConnected(false);
    };

    return stream;
  }, []);

  const disconnect = useCallback(() => {
    // Send Terminate message before closing
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "Terminate" }));
    }

    // Clean up audio pipeline
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // WebSocket will close after Termination event
    if (wsRef.current) {
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }, 2000);
    }

    setIsConnected(false);
  }, []);

  return {
    isConnected,
    transcript,
    interimText,
    results,
    connect,
    disconnect,
  };
}
