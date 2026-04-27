import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractJson(raw: string): string | null {
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const matches = [...stripped.matchAll(/\{[\s\S]*?\}/g)];
  for (let i = matches.length - 1; i >= 0; i--) {
    try { JSON.parse(matches[i][0]); return matches[i][0]; } catch { continue; }
  }
  const greedy = stripped.match(/\{[\s\S]*\}/);
  return greedy ? greedy[0] : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { interview_id } = await req.json();

    const xaiKey = Deno.env.get("XAI_API_KEY");
    if (!xaiKey) {
      return new Response(JSON.stringify({ error: "XAI_API_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch interview with resume_text and transcript
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("id, candidate_name, position, transcript, resume_text")
      .eq("id", interview_id)
      .single();

    if (interviewError || !interview) {
      return new Response(JSON.stringify({ error: "Interview not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!interview.resume_text) {
      console.log("[analyze-resume] No resume text for interview", interview_id);
      return new Response(JSON.stringify({ skipped: true, reason: "No resume uploaded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = interview.transcript || "";
    if (!transcript.trim()) {
      return new Response(JSON.stringify({ skipped: true, reason: "No transcript available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${xaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-3-fast",
        messages: [
          {
            role: "system",
            content: `You are an expert interviewer analyzing the alignment between a candidate's resume and their live interview responses.

Your task:
1. Review the resume to identify claimed skills, technologies, experiences, and achievements
2. Review the interview transcript to find where these claims were discussed
3. Assess how well the interview responses support the resume claims

Return ONLY valid JSON:
{
  "alignment_score": <0-100, where 100 = all claims strongly supported>,
  "strengths": ["claim 1 well-supported", "claim 2 confirmed with specifics", ...],
  "gaps": ["claimed X but avoided discussing it", "mentioned Y but lacked depth", ...]
}

Be specific. Limit to the 5 most notable strengths and 5 most notable gaps.`,
          },
          {
            role: "user",
            content: `Candidate: ${interview.candidate_name}
Position: ${interview.position}

RESUME:
${interview.resume_text.slice(0, 4000)}

INTERVIEW TRANSCRIPT:
${transcript.slice(0, 6000)}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const grokData = await grokResponse.json();
    console.log("[analyze-resume] Grok status:", grokResponse.status);

    if (!grokResponse.ok) {
      console.error("[analyze-resume] Grok error:", grokData);
      return new Response(JSON.stringify({ error: "Grok API error" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawContent = grokData.choices?.[0]?.message?.content || "";
    let analysis: { alignment_score?: number; strengths?: string[]; gaps?: string[] } = {};

    try {
      const jsonStr = extractJson(rawContent);
      if (!jsonStr) throw new Error("No JSON found");
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      console.error("[analyze-resume] Parse error:", e, "| Raw:", rawContent.slice(0, 200));
      return new Response(JSON.stringify({ error: "Failed to parse analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alignmentScore = Math.min(100, Math.max(0, analysis.alignment_score ?? 50));
    const strengths = (analysis.strengths || []).slice(0, 5);
    const gaps = (analysis.gaps || []).slice(0, 5);

    console.log("[analyze-resume] Alignment score:", alignmentScore, "strengths:", strengths.length, "gaps:", gaps.length);

    // Save to interview_reports
    const { error: updateError } = await supabase
      .from("interview_reports")
      .update({
        resume_alignment_score: alignmentScore,
        resume_strengths: strengths,
        resume_gaps: gaps,
      })
      .eq("interview_id", interview_id);

    if (updateError) {
      console.error("[analyze-resume] DB update error:", updateError);
    }

    return new Response(
      JSON.stringify({ alignment_score: alignmentScore, strengths, gaps }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[analyze-resume] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
