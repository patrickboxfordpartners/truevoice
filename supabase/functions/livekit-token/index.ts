import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";

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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    // Rate limiting: 20 requests per minute
    const rateLimitKey = getRateLimitKey(req, "livekit-token");
    const rateLimit = await checkRateLimit(rateLimitKey, 20, 60);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          reset_at: rateLimit.resetAt.toISOString(),
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // AUTHENTICATION CHECK
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let authorized = false;

    if (is_host) {
      // Host must be authenticated company member
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Authentication required for host access" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const token = authHeader.replace(/^Bearer\s+/i, "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid authentication token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify user's company owns this interview room
      const { data: interview } = await supabase
        .from("interviews")
        .select("company_id")
        .eq("livekit_room_name", room_name)
        .single();

      if (!interview) {
        return new Response(
          JSON.stringify({ error: "Interview not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profile?.company_id !== interview.company_id) {
        return new Response(
          JSON.stringify({ error: "Forbidden: You do not have access to this interview" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      authorized = true;
    } else {
      // Candidate must provide valid candidate_token matching the room
      const { data: interview } = await supabase
        .from("interviews")
        .select("id, livekit_room_name, status")
        .eq("candidate_token", participant_identity)
        .eq("livekit_room_name", room_name)
        .single();

      if (!interview) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid interview token or room name" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Optional: Check interview status
      if (interview.status === "completed") {
        return new Response(
          JSON.stringify({ error: "Interview has already been completed" }),
          {
            status: 410,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      authorized = true;
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
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
