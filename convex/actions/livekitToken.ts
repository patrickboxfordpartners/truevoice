"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  LIVEKIT_TOKEN_LIMIT,
  LIVEKIT_TOKEN_TTL_SECONDS,
  LIVEKIT_WINDOW_MS,
} from "../lib/tokenWindow";

export const generate = action({
  args: {
    roomName: v.string(),
    participantName: v.string(),
    participantIdentity: v.string(),
    isHost: v.optional(v.boolean()),
    interviewId: v.optional(v.string()),
    candidateToken: v.optional(v.string()),
  },
  returns: v.object({
    token: v.string(),
    url: v.string(),
    room_name: v.string(),
  }),
  handler: async (ctx, args) => {
    if (!args.roomName || args.roomName.length > 128) {
      throw new Error("Invalid room");
    }
    if (args.participantName.length > 80 || args.participantIdentity.length > 128) {
      throw new Error("Invalid participant");
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error("LiveKit credentials not configured");
    }

    let allowHost = false;
    let bucket: string;

    if (args.candidateToken) {
      const interview = await ctx.runQuery(internal.interviews.getForMediaAccess, {
        interviewId: args.interviewId,
        candidateToken: args.candidateToken,
      });
      if (!interview) throw new Error("Unauthorized");
      if (args.roomName !== interview.roomName && args.roomName !== interview.storedRoomName) {
        throw new Error("Unauthorized");
      }
      bucket = `livekit:${interview.interviewId}`;
    } else {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Unauthorized");

      if (args.interviewId) {
        const interview = await ctx.runQuery(internal.interviews.getForMediaAccess, {
          interviewId: args.interviewId,
        });
        if (!interview) throw new Error("Unauthorized");
        const companyId = await ctx.runQuery(internal.interviews.getCompanyIdForUser, {
          userId,
        });
        if (!companyId || companyId !== interview.companyId) {
          throw new Error("Unauthorized");
        }
        if (args.roomName !== interview.roomName && args.roomName !== interview.storedRoomName) {
          throw new Error("Unauthorized");
        }
        allowHost = args.isHost === true;
        bucket = `livekit:${interview.interviewId}`;
      } else if (args.roomName.startsWith("test-room-")) {
        allowHost = args.isHost === true;
        bucket = `livekit:user:${userId}`;
      } else {
        throw new Error("Unauthorized");
      }
    }

    const slot = await ctx.runMutation(internal.mediaTokens.consume, {
      bucket,
      windowMs: LIVEKIT_WINDOW_MS,
      limit: LIVEKIT_TOKEN_LIMIT,
    });
    if (!slot.allowed) {
      throw new Error("Too many token requests. Try again shortly.");
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: apiKey,
      sub: args.participantIdentity,
      exp: now + LIVEKIT_TOKEN_TTL_SECONDS,
      nbf: now,
      name: args.participantName,
      video: {
        room: args.roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        canUpdateOwnMetadata: true,
        ...(allowHost && {
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
