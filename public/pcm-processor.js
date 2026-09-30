/**
 * AudioWorklet processor: captures raw Float32 samples, downsamples to 16kHz,
 * converts to Int16 PCM, and posts binary buffers to the main thread.
 *
 * AssemblyAI realtime requires PCM16 signed little-endian, mono, 16kHz.
 * Chunks are ~100ms (1600 samples) to stay within the 50-1000ms window.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(0);
    // sampleRate is a global in AudioWorkletGlobalScope
    this._inputSampleRate = sampleRate;
    this._targetSampleRate = 16000;
    this._ratio = this._inputSampleRate / this._targetSampleRate;
    // ~100ms of output samples
    this._chunkSize = Math.floor(this._targetSampleRate * 0.1);
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;

    const channelData = input[0]; // mono channel

    // Append to buffer
    const newBuffer = new Float32Array(this._buffer.length + channelData.length);
    newBuffer.set(this._buffer);
    newBuffer.set(channelData, this._buffer.length);
    this._buffer = newBuffer;

    // Calculate how many input samples we need for one chunk
    const inputSamplesNeeded = Math.ceil(this._chunkSize * this._ratio);

    while (this._buffer.length >= inputSamplesNeeded) {
      // Downsample: linear interpolation
      const downsampled = new Float32Array(this._chunkSize);
      for (let i = 0; i < this._chunkSize; i++) {
        const srcIndex = i * this._ratio;
        const srcFloor = Math.floor(srcIndex);
        const srcCeil = Math.min(srcFloor + 1, this._buffer.length - 1);
        const frac = srcIndex - srcFloor;
        downsampled[i] = this._buffer[srcFloor] * (1 - frac) + this._buffer[srcCeil] * frac;
      }

      // Convert Float32 [-1, 1] to Int16
      const pcm16 = new Int16Array(this._chunkSize);
      for (let i = 0; i < this._chunkSize; i++) {
        const s = Math.max(-1, Math.min(1, downsampled[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);

      // Advance buffer past the consumed input samples
      const consumed = Math.floor(this._chunkSize * this._ratio);
      this._buffer = this._buffer.slice(consumed);
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
