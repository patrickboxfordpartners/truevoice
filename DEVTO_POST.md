# Building a Real-Time AI Interview Analysis Pipeline with LiveKit, Deepgram, and Grok

Most AI apps process data after the fact. You upload a file, wait, get a result. This post is about doing it the other way: scoring a live video interview *as the candidate speaks*, chunk by chunk, so the interviewer sees signals in real time rather than a report 20 minutes later.

This is the architecture behind [TrueVoice HQ](https://truevoicehq.com), an AI interview analysis platform. Here's how the real-time pipeline works.

---

## The Pipeline

```
Candidate speaks
     ↓
LiveKit (WebRTC audio/video stream)
     ↓
Deepgram (real-time STT → transcript chunks)
     ↓
Supabase Edge Function: analyze-chunk (Grok scores each chunk live)
     ↓
Supabase Realtime (scores pushed to interviewer dashboard)
     ↓
Supabase Edge Function: generate-final-report (Grok synthesizes full report on end)
```

Five services. One direction. No polling.

---

## Why Chunk-Based Analysis?

The naive approach: record the whole interview, transcribe it, send the full transcript to an LLM, get scores back. This works fine for async review. It's useless for live interviews.

Chunk-based analysis means the interviewer sees a live authenticity score updating every 30–60 seconds. By the time the interview ends, the final report is synthesizing data that's already been processed — not starting from scratch.

Each chunk scores four dimensions (0–25 each, 100 total):

- **speech** — natural filler words, self-corrections, vocal variety vs. flat scripted cadence
- **timing** — measured response delays (instant = memorized, normal = thinking, very delayed = searching)
- **flow** — conversational back-and-forth vs. monologue delivery
- **linguistic** — spoken contractions and informal grammar vs. written/formal language

The system also flags specific patterns: AI-generated opener phrases ("Certainly", "Absolutely", "That's a great question"), suspiciously precise statistics without citations, and company-specific phrases each organization has flagged from past interviews.

---

## The Edge Function: analyze-chunk

Deployed on Supabase Edge Functions (Deno runtime). Called every time a new transcript chunk arrives from Deepgram.

```typescript
// Uses grok-3-fast — non-reasoning model for lower latency on chunk analysis
const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${xaiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "grok-3-fast",
    messages: [
      { role: "system", content: ANALYSIS_PROMPT },
      {
        role: "user",
        content: [
          `Elapsed time: ${elapsed_seconds}s`,
          `Response timing data: ${JSON.stringify(response_delays)}`,
          `Transcript chunk: "${chunk_text}"`,
        ].join("\n"),
      },
    ],
    temperature: 0.3,
  }),
});
```

The response timing data (`response_delays`) is the interesting part — it's measured on the client side by tracking the gap between when the interviewer finishes a question and when the candidate starts speaking. That timestamp gets passed with each chunk so the model has real delay data, not just inference from speech patterns.

---

## Handling Reasoning Model Output in Production

One problem you hit immediately when using LLMs in a structured data pipeline: the model sometimes wraps its JSON in markdown fences, adds explanation text, or (for reasoning models) prepends a `<think>...</think>` block before the actual output.

This utility handles all three cases:

```typescript
function extractJson(raw: string): string | null {
  // Strip reasoning model thinking blocks
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Find all {...} blocks, try from last to first
  const matches = [...stripped.matchAll(/\{[\s\S]*?\}/g)];
  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      JSON.parse(matches[i][0]);
      return matches[i][0];
    } catch {
      continue;
    }
  }

  // Fall back to greedy match
  const greedy = stripped.match(/\{[\s\S]*\}/);
  return greedy ? greedy[0] : null;
}
```

Why take the *last* match rather than the first? Because when a model produces explanation text before JSON, the last `{...}` block is the actual structured output. The earlier ones are fragments from the explanation. This pattern has been reliable across Grok, Claude, and GPT-4o.

If parsing fails completely, fall back to neutral mid-range scores (15/25 each) rather than zeros. Zeros would make the interviewer dashboard look alarming; neutral scores let the session continue without a false signal.

---

## LiveKit JWT Generation in Deno (No Library Required)

LiveKit access tokens are signed JWTs. In Node.js you'd use the `livekit-server-sdk`. In Deno edge functions, npm libraries aren't always available cleanly, but the Web Crypto API is. Here's a pure-Deno JWT generator:

```typescript
async function generateLiveKitToken(
  apiKey: string,
  apiSecret: string,
  roomName: string,
  participantIdentity: string,
  participantName: string,
  isHost: boolean = false
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    sub: participantIdentity,
    exp: now + 86400,
    nbf: now,
    name: participantName,
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      ...(isHost && { roomAdmin: true, roomCreate: true, roomRecord: true }),
    },
  };

  const encoder = new TextEncoder();
  const headerB64 = toBase64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  const signatureB64 = toBase64Url(new Uint8Array(signature));

  return `${signingInput}.${signatureB64}`;
}

function toBase64Url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
```

The key points: `crypto.subtle` is available globally in Deno, `btoa` handles the base64 encoding, and the URL-safe replacement (`+` → `-`, `/` → `_`, strip `=`) is required by the JWT spec.

---

## Final Report: Synthesis, Not Re-Analysis

When the interview ends, `generate-final-report` doesn't re-process the transcript from scratch. It synthesizes from the chunk data that's already been stored:

```typescript
const [chunksRes, interviewRes, flagsRes] = await Promise.all([
  supabase.from("transcript_chunks").select("*").eq("interview_id", interview_id).order("chunk_index"),
  supabase.from("interviews").select("*").eq("interview_id", interview_id).single(),
  supabase.from("interview_flags").select("*").eq("interview_id", interview_id),
]);
```

The model gets the chunk-level score history, the flag log with timestamps, and the full transcript. This produces a more accurate final report than sending the raw transcript alone — the chunk scores act as a ground truth the model can't contradict.

Two post-report tasks run fire-and-forget (non-blocking):

```typescript
// Resume alignment analysis — only if resume was uploaded
if (interview.resume_text) {
  fetch(`${supabaseUrl}/functions/v1/analyze-resume`, { ... }).catch(() => {});
}

// Candidate feedback email
if (interview.candidate_email) {
  fetch(`${supabaseUrl}/functions/v1/send-interview-email`, { ... }).catch(() => {});
}
```

The `.catch(() => {})` is intentional — these are nice-to-have enrichments. If they fail, the report is already saved and the interview is marked complete. Don't let optional steps block the critical path.

---

## What I'd Do Differently

**Use a Deepgram WebSocket directly from the edge function instead of the client.** The current architecture has the client receiving Deepgram transcripts and forwarding chunks to the edge function. Moving the Deepgram connection server-side would eliminate one round trip and reduce the chance of a client network hiccup dropping a chunk.

**Chunk overlap.** Right now each chunk is independent. A candidate who trails off at the end of one chunk and picks up mid-thought in the next looks like two separate utterances. Adding a small overlap buffer (last 2–3 sentences of the previous chunk as context) would smooth out edge cases in the scoring.

**Streaming scores back via Supabase Realtime.** The scores currently get written to the database and the interviewer dashboard polls. Switching to Supabase Realtime subscriptions would push score updates instantly rather than waiting for the next poll cycle.

---

## Stack Summary

| Layer | Service |
|-------|---------|
| Video/audio streaming | LiveKit Cloud |
| Speech-to-text | Deepgram Nova-2 |
| AI analysis | xAI Grok 3 Fast |
| Edge functions | Supabase (Deno) |
| Database + auth | Supabase (PostgreSQL) |
| Frontend | React + Vite + TypeScript |
| Payments | Stripe |
| Deployment | Vercel |

Source code: [github.com/patrickboxfordpartners/truevoice](https://github.com/patrickboxfordpartners/truevoice)

Live product: [truevoicehq.com](https://truevoicehq.com)

---

*Patrick Mitchell is the founder of [Boxford Partners](https://boxfordpartners.com), a product studio that has shipped 8 companies across AI, SaaS, voice, and fintech.*
