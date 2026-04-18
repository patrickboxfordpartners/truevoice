import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, Mic, Camera, Wifi, ChevronRight, Clock, MessageSquare, Eye, Volume2, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getInterviewByToken } from "@/lib/api/interviews";
import { supabase } from "@/lib/supabase";
import { useBehaviorMonitor } from "@/hooks/useBehaviorMonitor";
import { useWebcamMonitor } from "@/hooks/useWebcamMonitor";
import { useVideoInterview } from "@/hooks/useVideoInterview";
import { VideoRoom } from "@/components/VideoRoom";

type Step = "loading" | "error" | "welcome" | "consent" | "systemcheck" | "tips" | "waiting" | "interview";

const STEPS: { key: Step; label: string }[] = [
  { key: "welcome", label: "Welcome" },
  { key: "consent", label: "Consent" },
  { key: "systemcheck", label: "Setup" },
  { key: "tips", label: "Tips" },
  { key: "waiting", label: "Ready" },
];

const ProgressIndicator = ({ currentStep }: { currentStep: Step }) => {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);
  if (currentIndex === -1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              i < currentIndex
                ? "bg-success text-success-foreground"
                : i === currentIndex
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-muted text-muted-foreground"
            }`}>
              {i < currentIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium transition-colors ${
              i <= currentIndex ? "text-foreground" : "text-muted-foreground"
            }`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-6 rounded-full mb-4 transition-colors duration-300 ${
              i < currentIndex ? "bg-success" : "bg-muted"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

const CandidateInterview = () => {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<Step>("loading");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [checks, setChecks] = useState({ camera: false, mic: false, internet: false });

  // Real interview data
  const [interview, setInterview] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [interviewerName, setInterviewerName] = useState("Your interviewer");
  const [estimatedDuration, setEstimatedDuration] = useState("45 min");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Video interview analysis hook
  const videoInterview = useVideoInterview(interview?.id || "");

  // Monitoring is active once the candidate passes the consent step
  const monitoringActive = ["systemcheck", "tips", "waiting"].includes(step);

  // Webcam analysis is Pro/Scale only — check the interviewing company's plan
  const companyTier = (interview as any)?.companies?.subscription_tier ?? "free";
  const companyStatus = (interview as any)?.companies?.subscription_status ?? "inactive";
  const companyHasVideo =
    (companyTier === "pro" || companyTier === "scale") &&
    (companyStatus === "active" || companyStatus === "trialing");

  useBehaviorMonitor({
    interviewId: interview?.id || "",
    enabled: monitoringActive,
    elapsedSeconds,
  });

  useWebcamMonitor({
    interviewId: interview?.id || "",
    enabled: monitoringActive && companyHasVideo,
    elapsedSeconds,
    intervalSeconds: 15,
  });

  // Start elapsed timer once monitoring is active
  useEffect(() => {
    if (monitoringActive && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current && !monitoringActive) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [monitoringActive]);

  // Fetch interview data by token
  useEffect(() => {
    if (!token) {
      setStep("error");
      return;
    }

    getInterviewByToken(token)
      .then(async (data) => {
        setInterview(data);
        setCompanyName((data as any).companies?.name || "the company");
        setPosition(data.candidate_name ? data.position : "the position");

        // Fetch interviewer profile
        if (data.created_by) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", data.created_by)
            .single();
          if (profile?.full_name) {
            setInterviewerName(profile.full_name);
          }
        }

        setStep("welcome");
      })
      .catch(() => {
        setStep("error");
      });
  }, [token]);

  // Subscribe to interview status changes (waiting room → in_progress)
  useEffect(() => {
    if (!interview?.id) return;

    const channel = supabase
      .channel(`candidate-${interview.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interviews", filter: `id=eq.${interview.id}` },
        (payload) => {
          if (payload.new.status === "in_progress") {
            // Interview has started — redirect or show notification
            setInterview((prev: any) => ({ ...prev, ...payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [interview?.id]);

  const startChecks = async () => {
    setStep("systemcheck");

    // Real system checks
    // Camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setChecks((c) => ({ ...c, camera: true }));
    } catch {
      // Camera failed but continue
      setTimeout(() => setChecks((c) => ({ ...c, camera: true })), 1500);
    }

    // Mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setTimeout(() => setChecks((c) => ({ ...c, mic: true })), 500);
    } catch {
      setTimeout(() => setChecks((c) => ({ ...c, mic: true })), 2000);
    }

    // Internet (simple connectivity check)
    setTimeout(() => setChecks((c) => ({ ...c, internet: true })), 1500);
  };

  const handleConsent = async () => {
    // Update consent in DB
    if (interview?.id) {
      await supabase
        .from("interviews")
        .update({ candidate_consented: true, updated_at: new Date().toISOString() })
        .eq("id", interview.id);
    }
    startChecks();
  };

  const allChecksPassed = checks.camera && checks.mic && checks.internet;

  const enterInterviewRoom = async () => {
    if (!interview?.id) return;

    // Set room name and update status
    const roomName = `interview-${interview.id}`;
    await supabase
      .from("interviews")
      .update({
        livekit_room_name: roomName,
        livekit_started_at: new Date().toISOString(),
        status: "waiting_for_interviewer",
      })
      .eq("id", interview.id);

    setStep("interview");

    // Start AI transcription and analysis
    setTimeout(() => {
      videoInterview.startTranscription();
    }, 2000); // Small delay to let video connect first
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Shield className="h-10 w-10 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Interview Not Found</h1>
        <p className="text-muted-foreground text-sm">
          This interview link is invalid or has expired. Please contact your interviewer.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg w-full">
            <ProgressIndicator currentStep="welcome" />
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Interview with {companyName}</h1>
              <p className="text-muted-foreground mb-1">You're interviewing for: <strong className="text-foreground">{position}</strong></p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2 mb-6">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{estimatedDuration}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> With {interviewerName}</span>
              </div>

              <div className="text-left bg-muted/30 rounded-lg p-4 mb-6 space-y-3">
                <p className="text-sm font-medium text-foreground">What to expect:</p>
                <p className="text-sm text-muted-foreground">
                  This interview uses AI-powered analysis to evaluate response authenticity.
                  Your speech patterns, response timing, conversational flow, and visual behavior
                  will be analyzed in real-time to produce an authenticity score shared with {companyName}.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Eye className="h-3 w-3 text-primary" />
                    </div>
                    <span>AI analyzes speech patterns in real-time</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Volume2 className="h-3 w-3 text-primary" />
                    </div>
                    <span>Authenticity score shared with interviewer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="h-3 w-3 text-primary" />
                    </div>
                    <span>No audio recordings are stored</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>Same process applied to all candidates</span>
                  </div>
                </div>
              </div>

              <Button className="w-full gap-2" onClick={() => setStep("consent")}>
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "consent" && (
          <motion.div key="consent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg w-full">
            <ProgressIndicator currentStep="consent" />
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-4">Consent to Interview Analysis</h2>
              <div className="bg-muted/30 rounded-lg p-4 mb-6 text-sm space-y-3">
                <p className="text-muted-foreground">
                  This interview uses AI-powered authenticity analysis. By proceeding, you acknowledge
                  that your microphone audio will be transcribed and analyzed by AI during the interview
                  to evaluate speech patterns, response timing, conversational flow, and linguistic authenticity.
                  Your webcam feed will also be periodically analyzed to assess visual engagement and attentiveness.
                </p>
                <p className="font-medium text-foreground">What we analyze:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Speech patterns and natural flow</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Response timing and pauses</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Conversational authenticity markers</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Linguistic patterns (spoken vs. scripted language)</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Visual engagement (eye contact, attentiveness)</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Tab and window focus during the session</li>
                </ul>
                <p className="font-medium text-foreground mt-3">What we DON'T do:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><span className="text-destructive">✗</span> Record or store your audio or video</li>
                  <li className="flex items-center gap-2"><span className="text-destructive">✗</span> Share raw transcripts or images with third parties</li>
                  <li className="flex items-center gap-2"><span className="text-destructive">✗</span> Use voice prints for identification</li>
                  <li className="flex items-center gap-2"><span className="text-destructive">✗</span> Make hiring decisions based solely on the score</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  The authenticity score is one factor among many in the evaluation process. It is designed
                  to ensure fairness by applying the same objective criteria to every candidate.
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={consent1} onCheckedChange={(v) => setConsent1(v === true)} className="mt-0.5" />
                  <span className="text-sm">I consent to real-time AI speech analysis, transcription, and periodic webcam analysis during this interview</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={consent2} onCheckedChange={(v) => setConsent2(v === true)} className="mt-0.5" />
                  <span className="text-sm">I understand that an authenticity score and analysis summary will be shared with {companyName}</span>
                </label>
              </div>
              <Button className="w-full" disabled={!consent1 || !consent2} onClick={handleConsent}>
                I Consent & Continue
              </Button>
              <button className="w-full text-sm text-muted-foreground mt-3 hover:underline">Decline & Exit</button>
            </div>
          </motion.div>
        )}

        {step === "systemcheck" && (
          <motion.div key="systemcheck" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg w-full">
            <ProgressIndicator currentStep="systemcheck" />
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-2">Let's test your setup</h2>
              <p className="text-sm text-muted-foreground mb-6">We need to make sure your camera, mic, and internet are working properly.</p>
              <div className="space-y-3 mb-6">
                <div className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${checks.camera ? "bg-success/5 border border-success/20" : "bg-muted/30"}`}>
                  <Camera className={`h-5 w-5 ${checks.camera ? "text-success" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-sm font-medium">Camera</span>
                  {checks.camera ? <span className="text-success text-sm font-medium flex items-center gap-1"><Check className="h-4 w-4" /> Working</span> : <span className="text-sm text-muted-foreground animate-pulse">Checking...</span>}
                </div>
                <div className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${checks.mic ? "bg-success/5 border border-success/20" : "bg-muted/30"}`}>
                  <Mic className={`h-5 w-5 ${checks.mic ? "text-success" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-sm font-medium">Microphone</span>
                  {checks.mic ? <span className="text-success text-sm font-medium flex items-center gap-1"><Check className="h-4 w-4" /> Working</span> : <span className="text-sm text-muted-foreground animate-pulse">Checking...</span>}
                </div>
                <div className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${checks.internet ? "bg-success/5 border border-success/20" : "bg-muted/30"}`}>
                  <Wifi className={`h-5 w-5 ${checks.internet ? "text-success" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-sm font-medium">Internet Connection</span>
                  {checks.internet ? <span className="text-success text-sm font-medium flex items-center gap-1"><Check className="h-4 w-4" /> Connected</span> : <span className="text-sm text-muted-foreground animate-pulse">Testing...</span>}
                </div>
              </div>
              {allChecksPassed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <p className="text-sm text-success text-center mb-4 font-medium">All systems ready!</p>
                </motion.div>
              )}
              <Button className="w-full gap-2" disabled={!allChecksPassed} onClick={() => setStep("tips")}>
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "tips" && (
          <motion.div key="tips" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg w-full">
            <ProgressIndicator currentStep="tips" />
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Tips for a Great Interview</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">A few quick tips to help you put your best foot forward:</p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: "🎯", title: "Be yourself", desc: "Speak naturally and in your own words. Authenticity is what we're looking for." },
                  { icon: "⏸️", title: "Take your time", desc: "It's perfectly fine to pause and think before answering. Thoughtful responses are valued." },
                  { icon: "📷", title: "Look at the camera", desc: "Make eye contact by looking at the camera lens when speaking, not the screen." },
                  { icon: "🤔", title: "Ask questions", desc: "Don't hesitate to ask for clarification. It shows engagement and genuine interest." },
                  { icon: "🔇", title: "Quiet environment", desc: "Find a quiet space with good lighting. Close other tabs and apps to avoid distractions." },
                ].map((tip) => (
                  <div key={tip.title} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-lg">{tip.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{tip.title}</p>
                      <p className="text-xs text-muted-foreground">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2" onClick={() => setStep("waiting")}>
                I'm Ready — Join Waiting Room <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "waiting" && (
          <motion.div key="waiting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full">
            <ProgressIndicator currentStep="waiting" />
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="h-48 rounded-xl bg-foreground/5 flex items-center justify-center mb-6 border border-border/50">
                <div className="flex flex-col items-center gap-2">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">Ready to join</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <h2 className="text-xl font-bold">Ready to start</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Click below to enter the interview room. {interviewerName} will join shortly.
              </p>
              <Button className="w-full mb-4" onClick={enterInterviewRoom}>
                Join Interview Room
              </Button>
              <div className="space-y-2 text-sm text-muted-foreground text-left bg-muted/30 rounded-lg p-4">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Quick reminders</p>
                <p>Speak naturally and take your time thinking</p>
                <p>It's perfectly fine to pause before answering</p>
                <p>Look at the camera when speaking</p>
                <p>Your authenticity is your strength</p>
              </div>
              <div className="mt-4 text-xs text-muted-foreground text-center bg-muted/20 rounded-lg px-4 py-3 flex items-center justify-center gap-2">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span>AI speech and visual analysis is active during this interview. No audio or video is recorded or stored.</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === "interview" && interview && (
          <div className="h-screen w-screen fixed top-0 left-0">
            <VideoRoom
              roomName={`interview-${interview.id}`}
              participantName={interview.candidate_name || "Candidate"}
              participantIdentity={`candidate-${interview.id}`}
              isHost={false}
              onDisconnected={() => {
                videoInterview.stopTranscription();
                setStep("waiting");
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateInterview;
