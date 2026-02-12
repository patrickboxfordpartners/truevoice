/**
 * Audio utilities for mic capture and PCM16 conversion.
 */

/**
 * Create an AudioContext and ScriptProcessorNode that converts
 * a MediaStream to 16-bit PCM and calls `onData` with raw bytes.
 * Uses the browser's default sample rate for maximum compatibility.
 */
export function createAudioProcessor(
  stream: MediaStream,
  onData: (pcm16: ArrayBuffer) => void
) {
  // Let the browser pick its native sample rate (usually 44100 or 48000)
  const audioContext = new AudioContext();
  console.log("[audio] AudioContext sample rate:", audioContext.sampleRate);

  const source = audioContext.createMediaStreamSource(stream);

  // 4096 buffer size is a good balance between latency and performance
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (event) => {
    const float32 = event.inputBuffer.getChannelData(0);
    const pcm16 = float32ToPcm16(float32);
    onData(pcm16.buffer);
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  return {
    audioContext,
    sampleRate: audioContext.sampleRate,
    stop() {
      processor.disconnect();
      source.disconnect();
      audioContext.close();
    },
  };
}

/**
 * Convert Float32Array audio samples to Int16 PCM.
 */
function float32ToPcm16(float32: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}
