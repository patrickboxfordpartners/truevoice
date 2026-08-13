/**
 * Generate temporary Deepgram API tokens
 * Prevents client-side API key exposure
 *
 * Authentication: Requires valid candidate_token or authenticated user
 * Rate limit: 10 requests per minute per key
 */

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
    // Rate limiting: 10 requests per minute
    const rateLimitKey = getRateLimitKey(req, "deepgram-token");
    const rateLimit = await checkRateLimit(rateLimitKey, 10, 60);

    if (!rateLimit.allowed) {
      return jsonResponse(
        {
          error: "Rate limit exceeded",
          reset_at: rateLimit.resetAt.toISOString(),
        },
        429,
        corsHeaders
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    let body: TokenRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
    }

    const { interview_id, candidate_token } = body;

    if (!interview_id) {
      return jsonResponse(
        { error: "Missing required field: interview_id" },
        400,
        corsHeaders
      );
    }

    // Validate interview_id format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(interview_id)) {
      return jsonResponse({ error: "Invalid interview_id format" }, 400, corsHeaders);
    }

    // Authentication: Check if candidate_token is valid OR user is authenticated
    let authorized = false;

    if (candidate_token) {
      // Verify candidate_token matches interview
      const { data: interview, error } = await supabase
        .from("interviews")
        .select("id, status, candidate_token")
        .eq("id", interview_id)
        .eq("candidate_token", candidate_token)
        .single();

      if (interview && interview.status === "in_progress") {
        authorized = true;
      }
    } else {
      // Check if authenticated user has access to this interview
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          // Verify user's company owns this interview
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

    // Generate temporary Deepgram token (15 minutes TTL)
    const deepgramApiKey = Deno.env.get("DEEPGRAM_API_KEY");
    if (!deepgramApiKey) {
      return jsonResponse(
        { error: "Deepgram not configured" },
        500,
        corsHeaders
      );
    }

    const tokenResponse = await fetch("https://api.deepgram.com/v1/keys", {
      method: "POST",
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment: `Interview ${interview_id}`,
        scopes: ["usage:write"],
        time_to_live_in_seconds: 900, // 15 minutes
        tags: [`interview:${interview_id}`],
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[deepgram-token] Error:", tokenResponse.status, errorText);
      return jsonResponse(
        { error: "Failed to generate Deepgram token" },
        500,
        corsHeaders
      );
    }

    const tokenData = await tokenResponse.json();

    return jsonResponse(
      {
        token: tokenData.key,
        expires_at: new Date(Date.now() + 900000).toISOString(), // 15 min from now
      },
      200,
      corsHeaders
    );
  } catch (err) {
    console.error("[deepgram-token] Unhandled error:", err);
    return jsonResponse(
      { error: (err as Error).message },
      500,
      corsHeaders
    );
  }
});
