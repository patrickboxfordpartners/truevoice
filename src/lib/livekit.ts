import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

interface LiveKitTokenResponse {
  token: string;
  url: string;
  room_name: string;
}

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

export async function getLiveKitToken(
  roomName: string,
  participantName: string,
  participantIdentity: string,
  isHost: boolean = false
): Promise<LiveKitTokenResponse> {
  const result = await client.action(api.actions.livekitToken.generate, {
    roomName,
    participantName,
    participantIdentity,
    isHost,
  });

  if (!result.token) {
    throw new Error("Invalid token response from server");
  }

  return result;
}

export function getLiveKitUrl(): string {
  const url = import.meta.env.VITE_LIVEKIT_URL;
  if (!url) {
    throw new Error("VITE_LIVEKIT_URL not configured");
  }
  return url;
}
