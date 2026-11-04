/**
 * Signup alert: emails the owner when a new signup/lead is created.
 * Never throws and never blocks the caller. No-ops if POSTMARK_API_KEY is unset.
 * Env (Convex env vars): POSTMARK_API_KEY, SIGNUP_ALERT_TO (optional).
 */

const APP_NAME = "TrueVoice";
const FROM_ADDRESS = "hello@truevoicehq.com";

export interface NotifySignupInput {
  kind: string;
  email: string;
  name?: string;
  details?: Record<string, string | undefined>;
}

export async function notifySignup({ kind, email, name, details }: NotifySignupInput): Promise<void> {
  try {
    const postmarkKey = process.env.POSTMARK_API_KEY;
    if (!postmarkKey) return;

    const clean = (s: string) => s.replace(/[\r\n]/g, " ").trim();
    const to = process.env.SIGNUP_ALERT_TO ?? "patrick@boxfordpartners.com";
    const lines = [
      `App: ${APP_NAME}`,
      `Kind: ${clean(kind)}`,
      `Email: ${clean(email)}`,
      `Name: ${name ? clean(name) : "-"}`,
      `Time: ${new Date().toISOString()}`,
      ...Object.entries(details ?? {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${clean(k)}: ${clean(String(v))}`),
    ];

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify({
        From: FROM_ADDRESS,
        To: to,
        Subject: `[${APP_NAME}] New ${clean(kind)}: ${clean(email)}`,
        TextBody: lines.join("\n"),
        MessageStream: "outbound",
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error("[notifySignup] Postmark error:", res.status);
    }
  } catch (err) {
    console.error("[notifySignup] failed:", err);
  }
}
