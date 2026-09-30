"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";

export const generate = action({
  args: {
    roomName: v.string(),
    participantName: v.string(),
    participantIdentity: v.string(),
    isHost: v.optional(v.boolean()),
  },
  returns: v.object({
    token: v.string(),
    url: v.string(),
    room_name: v.string(),
  }),
  handler: async (_ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error("LiveKit credentials not configured");
    }

    const isHost = args.isHost ?? false;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 86400;

    const payload = {
      iss: apiKey,
      sub: args.participantIdentity,
      exp,
      nbf: now,
      name: args.participantName,
      video: {
        room: args.roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        canUpdateOwnMetadata: true,
        ...(isHost && {
          roomAdmin: true,
          roomCreate: true,
          roomRecord: true,
        }),
      },
    };

    const encoder = new TextEncoder();

    function base64UrlEncode(data: Uint8Array): string {
      let binary = "";
      for (const byte of data) binary += String.fromCharCode(byte);
      return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }

    const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
    const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
    const signatureInput = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(apiSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureInput));
    const signatureB64 = base64UrlEncode(new Uint8Array(signature));

    return {
      token: `${signatureInput}.${signatureB64}`,
      url: livekitUrl,
      room_name: args.roomName,
    };
  },
});
