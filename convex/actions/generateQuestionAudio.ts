"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * ElevenLabs Text-to-Speech Integration
 *
 * Generates natural-sounding audio for async interview questions
 * Uses ElevenLabs API with a professional voice
 */

export const generateQuestionAudio = action({
  args: {
    questionId: v.id("interview_questions"),
    questionText: v.string(),
    voiceId: v.optional(v.string()), // Default: Rachel (professional female voice)
  },
  returns: v.object({
    success: v.boolean(),
    audioUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get ElevenLabs API key from environment
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error("ELEVENLABS_API_KEY not configured in Convex environment variables");
      }

      // Use Rachel voice by default (professional, clear, neutral)
      // Other good options: Adam (male), Bella (female), Antoni (male)
      const voiceId = args.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Rachel

      console.log(`[ElevenLabs] Generating audio for question ${args.questionId}`);

      // Call ElevenLabs Text-to-Speech API
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text: args.questionText,
            model_id: "eleven_monolingual_v1", // Fast, high-quality English
            voice_settings: {
              stability: 0.7, // Balance between consistency and expressiveness
              similarity_boost: 0.8, // Voice similarity to original
              style: 0.3, // Natural speaking style
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      // Get audio as buffer
      const audioBuffer = await response.arrayBuffer();
      const audioBytes = new Uint8Array(audioBuffer);

      // Upload to Supabase Storage
      // Note: We need to use Supabase Storage REST API from the action
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase credentials not configured");
      }

      const fileName = `question-${args.questionId}-${Date.now()}.mp3`;
      const storagePath = `async-questions/${fileName}`;

      // Upload to Supabase Storage
      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/interview-recordings/${storagePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "audio/mpeg",
          },
          body: audioBytes,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Supabase upload error: ${uploadResponse.status} - ${errorText}`);
      }

      // Get public URL
      const audioUrl = `${supabaseUrl}/storage/v1/object/public/interview-recordings/${storagePath}`;

      console.log(`[ElevenLabs] Successfully generated audio: ${audioUrl}`);

      return {
        success: true,
        audioUrl,
      };
    } catch (error) {
      console.error("[ElevenLabs] Failed to generate audio:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
