import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

// Generate a LiveKit API JWT — same pattern as livekit-token function
async function generateLiveKitApiToken(apiKey: string, apiSecret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 300; // 5 minutes is plenty for a single API call

  const payload = {
    iss: apiKey,
    exp,
    nbf: now,
    video: {
      roomRecord: true,
    },
  };

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
  const keyData = encoder.encode(apiSecret);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureInput));

  const signatureB64 = encode(new Uint8Array(signature))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signatureInput}.${signatureB64}`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuthClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { interview_id, room_name } = await req.json();

    if (!interview_id || !room_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: interview_id, room_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const livekitUrl = Deno.env.get("VITE_LIVEKIT_URL") || Deno.env.get("LIVEKIT_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !apiSecret || !livekitUrl) {
      return new Response(
        JSON.stringify({ error: "LiveKit credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Derive the LiveKit HTTP host from the wss:// URL
    const livekitHost = livekitUrl.replace(/^wss?:\/\//, "https://");

    const token = await generateLiveKitApiToken(apiKey, apiSecret);

    // Build the egress request — use Supabase Storage (S3-compatible) for file output
    const storageAccessKey = Deno.env.get("SUPABASE_S3_ACCESS_KEY");
    const storageSecretKey = Deno.env.get("SUPABASE_S3_SECRET_KEY");
    const storageBucket = "interview-recordings";
    const storageEndpoint = supabaseUrl ? `${supabaseUrl}/storage/v1/s3` : null;

    const egressBody: Record<string, unknown> = {
      room_name: room_name,
      layout: "speaker",
      audio_only: false,
      video_only: false,
    };

    if (storageAccessKey && storageSecretKey && storageEndpoint) {
      egressBody["file_outputs"] = [
        {
          file_type: "MP4",
          filepath: `recordings/${interview_id}/{time}.mp4`,
          s3: {
            access_key: storageAccessKey,
            secret: storageSecretKey,
            region: "us-east-1",
            bucket: storageBucket,
            endpoint: storageEndpoint,
            force_path_style: true,
          },
        },
      ];
      console.log("[start-recording] Using Supabase Storage output:", storageBucket);
    } else {
      console.log("[start-recording] No storage creds found — starting egress without file output");
    }

    const egressRes = await fetch(
      `${livekitHost}/twirp/livekit.Egress/StartRoomCompositeEgress`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(egressBody),
      }
    );

    if (!egressRes.ok) {
      const errText = await egressRes.text();
      console.error("[start-recording] Egress API error:", egressRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Egress API error: ${egressRes.status}`, detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const egressData = await egressRes.json();
    const egressId: string = egressData.egress_id;

    if (!egressId) {
      return new Response(
        JSON.stringify({ error: "No egress_id returned from LiveKit", detail: egressData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Persist egress_id to the interview record
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error: dbError } = await supabase
        .from("interviews")
        .update({ egress_id: egressId, updated_at: new Date().toISOString() })
        .eq("id", interview_id);

      if (dbError) {
        console.error("[start-recording] DB update error:", dbError.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, egress_id: egressId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[start-recording] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
