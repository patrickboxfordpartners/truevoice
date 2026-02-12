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

interface UseDeepgramReturn {
  isConnected: boolean;
  transcript: string;
  interimText: string;
  results: TranscriptResult[];
  connect: (sampleRate?: number) => Promise<void>;
  disconnect: () => void;
  sendAudio: (data: ArrayBuffer) => void;
}

function buildDeepgramParams(sampleRate: number) {
  return [
    "model=nova-2",
    "punctuate=true",
    "diarize=true",
    "filler_words=true",
    "smart_format=true",
    "interim_results=true",
    "utterance_end_ms=1500",
    "encoding=linear16",
    `sample_rate=${sampleRate}`,
    "channels=1",
  ].join("&");
}

export function useDeepgramTranscription(): UseDeepgramReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [results, setResults] = useState<TranscriptResult[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((sampleRate: number = 48000) => {
    return new Promise<void>((resolve, reject) => {
      const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      if (!apiKey) {
        console.warn("Missing VITE_DEEPGRAM_API_KEY");
        reject(new Error("Missing API key"));
        return;
      }

      // Close any existing connection
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* noop */ }
      }

      // Connect through local WebSocket proxy (adds auth header server-side)
      const params = buildDeepgramParams(sampleRate);
      const url = `ws://localhost:8090/?${params}`;
      console.log(`Deepgram params: sample_rate=${sampleRate}`);
      console.log("Connecting to Deepgram via proxy...");

      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";

      ws.addEventListener("open", () => {
        console.log("Deepgram WebSocket connected");
        setIsConnected(true);
        resolve();
      });

      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "Results") {
            const alt = data.channel?.alternatives?.[0];
            if (!alt) return;

            const text = alt.transcript || "";
            if (!text) return;

            const isFinal = data.is_final;
            const words: TranscriptWord[] = alt.words || [];
            const speaker = words[0]?.speaker;

            const result: TranscriptResult = { text, words, isFinal, speaker };

            if (isFinal) {
              setTranscript((prev) => {
                const separator = prev ? " " : "";
                return prev + separator + text;
              });
              setInterimText("");
              setResults((prev) => [...prev, result]);
            } else {
              setInterimText(text);
            }
          }
        } catch {
          // Ignore non-JSON
        }
      });

      ws.addEventListener("error", (err) => {
        console.error("Deepgram WebSocket error:", err);
        reject(new Error("WebSocket connection failed"));
      });

      ws.addEventListener("close", (event) => {
        console.log("Deepgram closed:", event.code, event.reason);
        setIsConnected(false);
      });

      wsRef.current = ws;
    });
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "CloseStream" }));
        }
        wsRef.current.close();
      } catch {
        // Already closed
      }
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendAudio = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  return {
    isConnected,
    transcript,
    interimText,
    results,
    connect,
    disconnect,
    sendAudio,
  };
}
