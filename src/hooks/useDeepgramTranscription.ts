import { useState, useCallback, useRef } from "react";
import { createClient, LiveTranscriptionEvents, LiveClient } from "@deepgram/sdk";

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
  connect: (language?: string) => Promise<MediaStream>;
  disconnect: () => void;
}

export function useDeepgramTranscription(): UseDeepgramReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [results, setResults] = useState<TranscriptResult[]>([]);

  const deepgramRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connect = useCallback(async (language: string = "en") => {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error("Missing VITE_DEEPGRAM_API_KEY");
    }

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

    const deepgram = createClient(apiKey);
    const connection = deepgram.listen.live({
      model: "nova-2",
      language,
      punctuate: true,
      diarize: true,
      filler_words: true,
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1500,
      endpointing: 300,
      vad_events: true,
    });

    deepgramRef.current = connection;

    connection.on(LiveTranscriptionEvents.Open, () => {
      setIsConnected(true);

      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && connection.getReadyState() === 1) {
          connection.send(event.data);
        }
      };

      mediaRecorder.start(250);
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const alt = data.channel?.alternatives?.[0];
      if (!alt?.transcript) return;

      const text = alt.transcript;
      const isFinal = data.is_final ?? false;
      const words: TranscriptWord[] = alt.words || [];
      const speaker = words[0]?.speaker;

      const result: TranscriptResult = { text, words, isFinal, speaker };

      if (isFinal) {
        setTranscript((prev) => (prev ? prev + " " + text : text));
        setInterimText("");
        setResults((prev) => [...prev, result]);
      } else {
        setInterimText(text);
      }
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error("[deepgram] Error:", error);
    });

    connection.on(LiveTranscriptionEvents.Warning, (warning) => {
      console.warn("[deepgram] Warning:", warning);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      setIsConnected(false);
    });

    return stream;
  }, []);

  const disconnect = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (deepgramRef.current) {
      deepgramRef.current.finish();
      deepgramRef.current = null;
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
