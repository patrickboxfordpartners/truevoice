export function getLiveKitUrl(): string {
  const url = import.meta.env.VITE_LIVEKIT_URL;
  if (!url) {
    throw new Error("VITE_LIVEKIT_URL not configured");
  }
  return url;
}
