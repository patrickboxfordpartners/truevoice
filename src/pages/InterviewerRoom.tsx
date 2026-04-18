import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { VideoRoomWithAnalysis } from "@/components/VideoRoom";
import { supabase } from "@/lib/supabase";
import { Shield, Loader2, AlertCircle, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { useBilling } from "@/hooks/useBilling";
import { Progress } from "@/components/ui/progress";
import { ScoreGauge } from "@/components/ScoreGauge";
import { MiniRadar } from "@/components/dashboard/MiniRadar";
import { useVideoInterview } from "@/hooks/useVideoInterview";
import { motion } from "framer-motion";

/**
 * Interviewer's view of the live interview
 * Shows LiveKit video + AI analysis sidebar
 */
export default function InterviewerRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const plan = usePlan();
  const { startCheckout, loading: billingLoading } = useBilling();

  // Live AI analysis
  const videoInterview = useVideoInterview(id || "");

  useEffect(() => {
    if (!id) {
      setError("Interview ID missing");
      setLoading(false);
      return;
    }

    // Fetch interview data
    supabase
      .from("interviews")
      .select("*, companies(name), profiles(full_name)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("Interview not found");
          setLoading(false);
          return;
        }

        setInterview(data);
        setLoading(false);

        // Update status to in_progress when interviewer joins
        supabase
          .from("interviews")
          .update({
            status: "in_progress",
            livekit_started_at: new Date().toISOString(),
          })
          .eq("id", id);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">Interview Not Found</h1>
        <p className="text-muted-foreground text-sm mb-6">{error || "This interview does not exist."}</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  // Gate: video interviews require Pro or Scale
  if (!plan.hasVideo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Video interviews require Pro</h1>
        <p className="text-muted-foreground text-sm max-w-sm mb-8">
          Upgrade to Pro to unlock LiveKit video interviews, webcam gaze analysis, screen-reading detection, and visual behavior monitoring.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button
            disabled={billingLoading}
            onClick={() => startCheckout(import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || "")}
          >
            {billingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Upgrade to Pro — $149/mo
          </Button>
        </div>
      </div>
    );
  }

  const roomName = `interview-${interview.id}`;
  const interviewerName = (interview as any).profiles?.full_name || "Interviewer";

  const scoreCategories = [
    { label: "Speech Patterns", score: videoInterview.scores.speech, max: 25 },
    { label: "Response Timing", score: videoInterview.scores.timing, max: 25 },
    { label: "Conversational Flow", score: videoInterview.scores.flow, max: 25 },
    { label: "Linguistic Auth.", score: videoInterview.scores.linguistic, max: 25 },
  ];

  const severityDot = (s: string) =>
    s === "high" ? "bg-destructive" : s === "medium" ? "bg-warning" : "bg-muted-foreground";
  const severityBg = (s: string) =>
    s === "high" ? "bg-destructive/10 border-destructive/20" : s === "medium" ? "bg-warning/10 border-warning/20" : "bg-muted/50 border-border";

  // Analysis panel with live scores
  const analysisPanel = (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Live Analysis</h3>
      </div>

      {/* Candidate Info */}
      <div className="space-y-2 text-xs">
        <div>
          <p className="font-medium text-foreground">Candidate:</p>
          <p className="text-muted-foreground">{interview.candidate_name}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Position:</p>
          <p className="text-muted-foreground">{interview.position}</p>
        </div>
      </div>

      {/* Score Visualizations */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <ScoreGauge score={videoInterview.overallScore} size={90} strokeWidth={6} />
        <MiniRadar
          speech={videoInterview.scores.speech}
          timing={videoInterview.scores.timing}
          flow={videoInterview.scores.flow}
          linguistic={videoInterview.scores.linguistic}
          overall={videoInterview.overallScore}
          size={80}
        />
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Updates every ~20 seconds
      </p>

      {/* Detailed Scores */}
      <div className="space-y-3">
        {scoreCategories.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{cat.label}</span>
              <span className="text-xs font-bold tabular-nums">{cat.score}/{cat.max}</span>
            </div>
            <Progress value={(cat.score / cat.max) * 100} className="h-1.5" />
          </div>
        ))}
      </div>

      {/* Flags */}
      <div>
        <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          Detected Patterns
          {videoInterview.flags.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">({videoInterview.flags.length})</span>
          )}
        </h4>
        {videoInterview.flags.length === 0 ? (
          <p className="text-xs text-muted-foreground">No flags detected yet</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {videoInterview.flags.map((flag, i) => (
              <motion.div
                key={flag.id || i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-xs p-2 rounded-lg border ${severityBg(flag.severity)}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-0.5 ${severityDot(flag.severity)}`} />
                  <div className="min-w-0">
                    <p className="leading-relaxed">{flag.pattern}</p>
                    <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">{flag.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Transcript Preview */}
      {videoInterview.isTranscribing && videoInterview.transcript && (
        <div>
          <h4 className="text-xs font-semibold mb-2">Live Transcript</h4>
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 max-h-32 overflow-y-auto">
            <p>{videoInterview.transcript.slice(-200)}...</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      <VideoRoomWithAnalysis
        roomName={roomName}
        participantName={interviewerName}
        participantIdentity={`interviewer-${interview.created_by}`}
        isHost={true}
        onDisconnected={() => navigate("/dashboard")}
        analysisPanel={analysisPanel}
      />
    </div>
  );
}
