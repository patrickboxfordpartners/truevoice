import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateLiveKitApiToken(apiKey: string, apiSecret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 300;

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { interview_id, egress_id } = await req.json();

    if (!interview_id || !egress_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: interview_id, egress_id" }),
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

    const livekitHost = livekitUrl.replace(/^wss?:\/\//, "https://");
    const token = await generateLiveKitApiToken(apiKey, apiSecret);

    const stopRes = await fetch(
      `${livekitHost}/twirp/livekit.Egress/StopEgress`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ egress_id }),
      }
    );

    if (!stopRes.ok) {
      const errText = await stopRes.text();
      console.error("[stop-recording] Egress API error:", stopRes.status, errText);
      // Still clear the egress_id from the DB so the UI doesn't stay in recording state
    } else {
      console.log("[stop-recording] Egress stopped successfully:", egress_id);
    }

    // Clear egress_id from the interview record regardless of API success
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error: dbError } = await supabase
        .from("interviews")
        .update({ egress_id: null, updated_at: new Date().toISOString() })
        .eq("id", interview_id);

      if (dbError) {
        console.error("[stop-recording] DB update error:", dbError.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[stop-recording] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
