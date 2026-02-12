import { useState, useCallback, useRef } from "react";
import { createAudioProcessor } from "@/lib/audio";

interface UseAudioCaptureReturn {
  isCapturing: boolean;
  error: string | null;
  sampleRate: number;
  startCapture: (onData: (pcm16: ArrayBuffer) => void) => Promise<void>;
  stopCapture: () => void;
}

export function useAudioCapture(): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleRate, setSampleRate] = useState(48000);
  const processorRef = useRef<ReturnType<typeof createAudioProcessor> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCapture = useCallback(async (onData: (pcm16: ArrayBuffer) => void) => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const processor = createAudioProcessor(stream, onData);
      processorRef.current = processor;
      setSampleRate(processor.sampleRate);
      setIsCapturing(true);
    } catch (err: any) {
      const msg =
        err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow mic permissions."
          : err.name === "NotFoundError"
            ? "No microphone found."
            : `Mic error: ${err.message}`;
      setError(msg);
    }
  }, []);

  const stopCapture = useCallback(() => {
    processorRef.current?.stop();
    processorRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setIsCapturing(false);
  }, []);

  return { isCapturing, error, sampleRate, startCapture, stopCapture };
}
