import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 200; // ~10 minutes max

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const assemblyaiKey = Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!assemblyaiKey) {
      return new Response(
        JSON.stringify({ error: "ASSEMBLYAI_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { interview_id, audio_url } = body;

    if (!interview_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: interview_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine audio source: explicit URL, or pull from Supabase Storage
    let resolvedAudioUrl = audio_url;

    if (!resolvedAudioUrl) {
      // Check for recording in Supabase Storage
      const { data: files } = await supabase.storage
        .from("interview-recordings")
        .list(`recordings/${interview_id}`);

      if (files && files.length > 0) {
        const recording = files.find((f: any) => f.name.endsWith(".mp4") || f.name.endsWith(".webm"));
        if (recording) {
          const { data: signedUrl } = await supabase.storage
            .from("interview-recordings")
            .createSignedUrl(`recordings/${interview_id}/${recording.name}`, 3600);

          if (signedUrl) {
            resolvedAudioUrl = signedUrl.signedUrl;
          }
        }
      }

      // Fall back to interview record's audio_url
      if (!resolvedAudioUrl) {
        const { data: interview } = await supabase
          .from("interviews")
          .select("audio_url")
          .eq("id", interview_id)
          .single();

        if (interview?.audio_url) {
          resolvedAudioUrl = interview.audio_url;
        }
      }
    }

    if (!resolvedAudioUrl) {
      return new Response(
        JSON.stringify({ error: "No audio source found for this interview" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[transcribe-recording] Submitting to AssemblyAI:", interview_id);

    // Submit transcription job
    const submitRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: assemblyaiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: resolvedAudioUrl,
        speech_models: ["universal-3-5-pro", "universal-2"],
        speaker_labels: true,
        redact_pii: true,
        redact_pii_policies: [
          "phone_number",
          "email_address",
          "date_of_birth",
          "us_social_security_number",
        ],
        redact_pii_sub: "entity_name",
        language_detection: true,
        prompt: "Job interview between a hiring manager and a candidate.",
      }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      console.error("[transcribe-recording] Submit error:", submitRes.status, err);
      return new Response(
        JSON.stringify({ error: `AssemblyAI submit failed: ${submitRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { id: transcriptId } = await submitRes.json();
    console.log("[transcribe-recording] Job submitted:", transcriptId);

    // Poll for completion
    let transcript: any = null;
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const pollRes = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        { headers: { authorization: assemblyaiKey } }
      );

      const data = await pollRes.json();

      if (data.status === "completed") {
        transcript = data;
        break;
      }

      if (data.status === "error") {
        console.error("[transcribe-recording] Transcription error:", data.error);
        return new Response(
          JSON.stringify({ error: `Transcription failed: ${data.error}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: "Transcription timed out" }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[transcribe-recording] Completed:", {
      words: transcript.words?.length,
      speakers: [...new Set(transcript.words?.map((w: any) => w.speaker) || [])].length,
      duration: transcript.audio_duration,
    });

    // Build speaker-labeled transcript
    const utterances = transcript.utterances || [];
    const speakerTranscript = utterances
      .map((u: any) => `Speaker ${u.speaker}: ${u.text}`)
      .join("\n");

    // Store results
    await supabase
      .from("interviews")
      .update({
        transcript: transcript.text,
        speaker_transcript: speakerTranscript || null,
        transcript_metadata: {
          assemblyai_id: transcriptId,
          model: "universal-3-5-pro",
          audio_duration: transcript.audio_duration,
          speaker_count: [...new Set(utterances.map((u: any) => u.speaker))].length,
          language: transcript.language_code,
          pii_redacted: true,
          word_count: transcript.words?.length || 0,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", interview_id);

    return new Response(
      JSON.stringify({
        transcript_id: transcriptId,
        text: transcript.text,
        speaker_transcript: speakerTranscript,
        audio_duration: transcript.audio_duration,
        speaker_count: [...new Set(utterances.map((u: any) => u.speaker))].length,
        language: transcript.language_code,
        word_count: transcript.words?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[transcribe-recording] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
