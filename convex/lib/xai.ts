export const XAI_MAX_ATTEMPTS = 3;

export const XAI_MAX_TOKENS = {
  chunk: 500,
  questions: 1500,
  resume: 800,
  report: 900,
  frame: 200,
  asyncResponse: 500,
} as const;

export function shouldRetryXaiStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export function xaiRetryDelayMs(retryIndex: number): number {
  return 500 * 2 ** retryIndex;
}

export async function xaiChatCompletion(options: {
  body: Record<string, unknown>;
  maxTokens: number;
}): Promise<Response> {
  const xaiKey = process.env.AI_PROXY_KEY || process.env.XAI_API_KEY;
  if (!xaiKey) throw new Error("XAI_API_KEY not set");
  const baseUrl = process.env.AI_PROXY_URL || "https://api.x.ai";
  const payload = { ...options.body, max_tokens: options.maxTokens };

  let lastStatus = 0;
  for (let attempt = 0; attempt < XAI_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, xaiRetryDelayMs(attempt - 1)));
    }
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${xaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      lastStatus = 0;
      continue;
    }
    if (!shouldRetryXaiStatus(response.status)) {
      return response;
    }
    lastStatus = response.status;
  }
  throw new Error(lastStatus ? `xAI request failed (${lastStatus})` : "xAI request failed");
}
