import { WebSocketServer, WebSocket } from "ws";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
}

const DEEPGRAM_KEY = envVars.VITE_DEEPGRAM_API_KEY;
const PORT = 8090;

if (!DEEPGRAM_KEY) {
  console.error("Missing VITE_DEEPGRAM_API_KEY in .env.local");
  process.exit(1);
}

console.log(`[proxy] API key loaded (${DEEPGRAM_KEY.slice(0, 8)}...)`);

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (clientWs, req) => {
  const rawUrl = req.url || "";
  const params = rawUrl.replace(/^\/?(\?)?/, "");
  const deepgramUrl = `wss://api.deepgram.com/v1/listen?${params}`;
  console.log(`[proxy] Client connected`);
  console.log(`[proxy] Deepgram URL: ${deepgramUrl}`);

  const dgWs = new WebSocket(deepgramUrl, {
    headers: { Authorization: `Token ${DEEPGRAM_KEY}` },
  });

  let dgReady = false;
  let audioBytesSent = 0;
  let messagesFromDg = 0;

  dgWs.on("open", () => {
    dgReady = true;
    console.log("[proxy] Connected to Deepgram ✓");
  });

  dgWs.on("upgrade", (response) => {
    console.log(`[proxy] Deepgram HTTP status: ${response.statusCode}`);
  });

  // Client → Deepgram
  clientWs.on("message", (data) => {
    if (dgWs.readyState === WebSocket.OPEN) {
      dgWs.send(data);
      audioBytesSent += data.length || data.byteLength || 0;
      if (audioBytesSent % 50000 < 10000) {
        console.log(`[proxy] Audio sent: ${(audioBytesSent / 1024).toFixed(0)} KB`);
      }
    }
  });

  // Deepgram → Client
  dgWs.on("message", (data) => {
    messagesFromDg++;
    if (messagesFromDg <= 3) {
      const str = typeof data === "string" ? data : data.toString();
      console.log(`[proxy] Deepgram msg #${messagesFromDg}: ${str.slice(0, 200)}`);
    }
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data);
    }
  });

  dgWs.on("error", (err) => {
    console.error("[proxy] Deepgram error:", err.message);
  });

  dgWs.on("unexpected-response", (_req, res) => {
    let body = "";
    res.on("data", (d) => body += d);
    res.on("end", () => {
      console.error(`[proxy] Deepgram rejected: HTTP ${res.statusCode} — ${body}`);
    });
  });

  dgWs.on("close", (code, reason) => {
    const reasonStr = reason ? reason.toString() : "no reason";
    console.log(`[proxy] Deepgram closed: code=${code} reason="${reasonStr}" audioSent=${(audioBytesSent / 1024).toFixed(0)}KB dgMessages=${messagesFromDg}`);
    if (clientWs.readyState === WebSocket.OPEN) {
      // Codes 1005/1006 are reserved and can't be sent — use 1000 instead
      const safeCode = (code >= 1000 && code <= 1003) || code >= 3000 ? code : 1000;
      clientWs.close(safeCode, reasonStr);
    }
  });

  clientWs.on("close", (code, reason) => {
    console.log(`[proxy] Client disconnected: code=${code}`);
    if (dgWs.readyState === WebSocket.OPEN) {
      dgWs.close();
    }
  });

  clientWs.on("error", (err) => {
    console.error("[proxy] Client error:", err.message);
  });
});

console.log(`[proxy] Deepgram WebSocket proxy running on ws://localhost:${PORT}`);
