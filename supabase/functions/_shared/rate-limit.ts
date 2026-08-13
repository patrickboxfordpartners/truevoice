/**
 * Rate limiting using Supabase as storage backend
 * Creates rate_limit_log table on first use
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check if a request should be rate limited
 *
 * @param key - Unique identifier (IP, user_id, api_key, etc)
 * @param maxRequests - Maximum requests allowed in window
 * @param windowSeconds - Time window in seconds
 * @returns RateLimitResult with allowed status and remaining count
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  // Ensure table exists (idempotent)
  await supabase.rpc("ensure_rate_limit_table").catch(() => {
    // Table likely already exists, ignore error
  });

  // Count recent requests in window
  const { data, error } = await supabase
    .from("rate_limit_log")
    .select("id")
    .eq("key", key)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("[rate-limit] Query error:", error);
    // Fail open on errors to avoid blocking legitimate traffic
    return { allowed: true, remaining: maxRequests, resetAt };
  }

  const count = data?.length || 0;

  if (count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Log this request
  await supabase.from("rate_limit_log").insert({
    key,
    created_at: now.toISOString(),
  });

  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    resetAt,
  };
}

/**
 * Extract rate limit key from request
 * Uses IP address as fallback if no user/api key
 */
export function getRateLimitKey(req: Request, prefix: string): string {
  // Try to get IP from various headers (Vercel/Cloudflare/etc)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  return `${prefix}:${ip}`;
}
