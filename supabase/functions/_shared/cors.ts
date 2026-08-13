/**
 * Shared CORS utility for all edge functions
 * Restricts origins to known domains only
 */

const ALLOWED_ORIGINS = [
  "https://truevoicehq.com",
  "https://www.truevoicehq.com",
  "http://localhost:5173", // Dev only
  "http://localhost:8080", // Vite alternate port
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";

  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function handleCorsOptions(req: Request): Response {
  return new Response("ok", { headers: getCorsHeaders(req) });
}
