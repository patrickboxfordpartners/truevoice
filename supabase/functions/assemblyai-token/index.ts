import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitKey } from "../_shared/rate-limit.ts";

interface TokenRequest {
  interview_id?: string;
  candidate_token?: string;
}

function jsonResponse(body: unknown, status = 200, corsHeaders: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const rateLimitKey = getRateLimitKey(req, "assemblyai-token");
    const rateLimit = await checkRateLimit(rateLimitKey, 10, 60);

    if (!rateLimit.allowed) {
      return jsonResponse(
        { error: "Rate limit exceeded", reset_at: rateLimit.resetAt.toISOString() },
        429,
        corsHeaders
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: TokenRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
    }

    const { interview_id, candidate_token } = body;

    if (!interview_id) {
      return jsonResponse({ error: "Missing required field: interview_id" }, 400, corsHeaders);
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(interview_id)) {
      return jsonResponse({ error: "Invalid interview_id format" }, 400, corsHeaders);
    }

    let authorized = false;

    if (candidate_token) {
      const { data: interview } = await supabase
        .from("interviews")
        .select("id, status, candidate_token")
        .eq("id", interview_id)
        .eq("candidate_token", candidate_token)
        .single();

      if (interview && interview.status === "in_progress") {
        authorized = true;
      }
    } else {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          const { data: interview } = await supabase
            .from("interviews")
            .select("company_id, status")
            .eq("id", interview_id)
            .single();

          if (interview) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("company_id")
              .eq("id", user.id)
              .single();

            if (profile?.company_id === interview.company_id) {
              authorized = true;
            }
          }
        }
      }
    }

    if (!authorized) {
      return jsonResponse(
        { error: "Unauthorized: Invalid credentials or interview not active" },
        401,
        corsHeaders
      );
    }

    const assemblyaiKey = Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!assemblyaiKey) {
      return jsonResponse({ error: "AssemblyAI not configured" }, 500, corsHeaders);
    }

    // Mint a single-use temp token (60s to redeem, session lasts up to 3h)
    const tokenResponse = await fetch(
      "https://streaming.assemblyai.com/v3/token?expires_in_seconds=60",
      {
        headers: { authorization: assemblyaiKey },
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[assemblyai-token] Error:", tokenResponse.status, errorText);
      return jsonResponse({ error: "Failed to generate AssemblyAI token" }, 500, corsHeaders);
    }

    const tokenData = await tokenResponse.json();

    return jsonResponse(
      {
        token: tokenData.token,
        expires_in_seconds: 60,
      },
      200,
      corsHeaders
    );
  } catch (err) {
    console.error("[assemblyai-token] Unhandled error:", err);
    return jsonResponse({ error: (err as Error).message }, 500, corsHeaders);
  }
});
