export function advanceTokenWindow(
  existing: { windowStart: number; count: number } | null,
  now: number,
  windowMs: number,
  limit: number,
): { allowed: boolean; windowStart: number; count: number } {
  if (!existing || now - existing.windowStart >= windowMs) {
    return { allowed: true, windowStart: now, count: 1 };
  }
  if (existing.count >= limit) {
    return { allowed: false, windowStart: existing.windowStart, count: existing.count };
  }
  return {
    allowed: true,
    windowStart: existing.windowStart,
    count: existing.count + 1,
  };
}

export const LIVEKIT_WINDOW_MS = 10 * 60 * 1000;
export const LIVEKIT_TOKEN_LIMIT = 8;
export const LIVEKIT_TOKEN_TTL_SECONDS = 4 * 60 * 60;
export const DEEPGRAM_WINDOW_MS = 15 * 60 * 1000;
export const DEEPGRAM_TOKEN_LIMIT = 4;
