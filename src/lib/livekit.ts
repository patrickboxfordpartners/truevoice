import { supabase } from "./supabase";

interface LiveKitTokenResponse {
  token: string;
  url: string;
  room_name: string;
}

/**
 * Generate a LiveKit access token for joining a room
 *
 * @param roomName - Unique room identifier (typically interview ID)
 * @param participantName - Display name (e.g., "John Doe")
 * @param participantIdentity - Unique user identifier (e.g., user ID)
 * @param isHost - Whether this participant should have host permissions
 */
export async function getLiveKitToken(
  roomName: string,
  participantName: string,
  participantIdentity: string,
  isHost: boolean = false
): Promise<LiveKitTokenResponse> {
  console.log("[livekit] Requesting token with:", {
    roomName,
    participantName,
    participantIdentity,
    isHost,
  });

  try {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await supabase.functions.invoke("livekit-token", {
      body: {
        room_name: roomName,
        participant_name: participantName,
        participant_identity: participantIdentity,
        is_host: isHost,
      },
      headers: {
        Authorization: `Bearer ${anonKey}`,
      },
    });

    console.log("[livekit] Raw response:", response);

    const { data, error } = response;

    if (error) {
      console.error("[livekit] Error object:", error);
      throw new Error(`Failed to join video call: ${error.message || JSON.stringify(error)}`);
    }

    if (!data) {
      console.error("[livekit] No data in response");
      throw new Error("No data returned from server");
    }

    if (!data.token) {
      console.error("[livekit] No token in data:", data);
      throw new Error("Invalid token response from server");
    }

    console.log("[livekit] Success! Got token");
    return data;
  } catch (err) {
    console.error("[livekit] Caught exception:", err);
    throw err;
  }
}

/**
 * Get LiveKit server URL from environment
 */
export function getLiveKitUrl(): string {
  const url = import.meta.env.VITE_LIVEKIT_URL;
  if (!url) {
    throw new Error("VITE_LIVEKIT_URL not configured");
  }
  return url;
}
