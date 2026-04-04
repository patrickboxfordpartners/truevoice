import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenRequest {
  room_name: string;
  participant_name: string;
  participant_identity: string;
  is_host?: boolean;
}

// Generate LiveKit access token using JWT
function generateLiveKitToken(
  apiKey: string,
  apiSecret: string,
  roomName: string,
  participantIdentity: string,
  participantName: string,
  isHost: boolean = false
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 86400; // 24 hours

  const payload = {
    iss: apiKey,
    sub: participantIdentity,
    exp,
    nbf: now,
    name: participantName,
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
      ...(isHost && {
        roomAdmin: true,
        roomCreate: true,
        roomRecord: true,
      }),
    },
  };

  // Create JWT manually (Deno doesn't have jwt libraries in edge functions easily)
  const header = { alg: "HS256", typ: "JWT" };

  const encoder = new TextEncoder();
  const headerB64 = encode(encoder.encode(JSON.stringify(header)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const payloadB64 = encode(encoder.encode(JSON.stringify(payload)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const signatureInput = `${headerB64}.${payloadB64}`;

  // Use Web Crypto API for HMAC
  const keyData = encoder.encode(apiSecret);

  return crypto.subtle
    .importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((key) => crypto.subtle.sign("HMAC", key, encoder.encode(signatureInput)))
    .then((signature) => {
      const signatureB64 = encode(new Uint8Array(signature))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      return `${signatureInput}.${signatureB64}`;
    });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { room_name, participant_name, participant_identity, is_host = false }: TokenRequest =
      await req.json();

    if (!room_name || !participant_name || !participant_identity) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: room_name, participant_name, participant_identity" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const livekitUrl = Deno.env.get("LIVEKIT_URL");

    if (!apiKey || !apiSecret || !livekitUrl) {
      return new Response(
        JSON.stringify({ error: "LiveKit credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = await generateLiveKitToken(
      apiKey,
      apiSecret,
      room_name,
      participant_identity,
      participant_name,
      is_host
    );

    return new Response(
      JSON.stringify({
        token,
        url: livekitUrl,
        room_name,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate token" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
