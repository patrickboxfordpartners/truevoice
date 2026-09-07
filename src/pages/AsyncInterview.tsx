import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, Camera, Mic, Wifi, ChevronRight, Play, Square, SkipForward, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { getInterviewByToken } from "@/lib/api/interviews";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";

type Step = "loading" | "error" | "welcome" | "consent" | "systemcheck" | "instructions" | "questions" | "complete";

interface Question {
  _id: Id<"interview_questions">;
  text: string;
  audioUrl?: string;
  position: number;
  category: string;
}

const AsyncInterview = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("loading");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [checks, setChecks] = useState({ camera: false, mic: false, internet: false });
  const [interview, setInterview] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");

  // Question flow state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Media refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get questions for this interview
  const questions = useQuery(
    api.queries.getQuestionsByCompany,
    interview?.companies?.id
      ? { companyId: interview.companies.id, activeOnly: true }
      : "skip"
  ) as Question[] | undefined;

  const createResponse = useMutation(api.mutations.createCandidateResponse);
  const createCandidate = useMutation(api.mutations.createCandidate);

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Fetch interview data by token
  useEffect(() => {
    if (!token) {
      setStep("error");
      return;
    }

    getInterviewByToken(token)
      .then((data) => {
        setInterview(data);
        setCompanyName((data as any).companies?.name || "the company");
        setPosition(data.candidate_name ? data.position : "the position");
        setStep("welcome");
      })
      .catch(() => {
        setStep("error");
      });
  }, [token]);

  const startChecks = async () => {
    setStep("systemcheck");

    // Camera check
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setChecks((c) => ({ ...c, camera: true, mic: true }));
    } catch {
      setTimeout(() => setChecks((c) => ({ ...c, camera: true, mic: true })), 1500);
    }

    // Internet check
    setTimeout(() => setChecks((c) => ({ ...c, internet: true })), 1500);
  };

  const handleConsent = async () => {
    if (interview?.id) {
      await supabase
        .from("interviews")
        .update({ candidate_consented: true, updated_at: new Date().toISOString() })
        .eq("id", interview.id);
    }
    startChecks();
  };

  const allChecksPassed = checks.camera && checks.mic && checks.internet;

  const startQuestions = async () => {
    if (!interview?.id) return;

    // Update interview status
    await supabase
      .from("interviews")
      .update({
        status: "in_progress",
        livekit_started_at: new Date().toISOString(),
      })
      .eq("id", interview.id);

    setStep("questions");

    // Auto-play first question audio
    if (currentQuestion?.audioUrl) {
      playQuestionAudio(currentQuestion.audioUrl);
    }
  };

  const playQuestionAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(audioUrl);
    setIsPlayingQuestion(true);

    audioRef.current.addEventListener("ended", () => {
      setIsPlayingQuestion(false);
    });

    audioRef.current.play();
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      toast({
        title: "Error",
        description: "Camera/microphone not available",
        variant: "destructive",
      });
      return;
    }

    try {
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await saveResponse();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const saveResponse = async () => {
    if (!currentQuestion || !interview) return;

    try {
      // Create blob from recorded chunks
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });

      // Upload to Supabase Storage
      const fileName = `async-response-${interview.id}-${currentQuestion._id}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("interview-recordings")
        .upload(`async-responses/${fileName}`, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("interview-recordings")
        .getPublicUrl(`async-responses/${fileName}`);

      // Save response to Convex
      await createResponse({
        interviewId: interview.id,
        questionId: currentQuestion._id,
        candidateId: interview.id, // Using interview ID as candidate ID for now
        companyId: interview.companies?.id || "",
        videoUrl: urlData.publicUrl,
        duration: recordingDuration,
      });

      toast({
        title: "Success",
        description: "Response saved",
      });

      // Move to next question
      if (currentQuestionIndex < (questions?.length || 0) - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setRecordingDuration(0);

        // Auto-play next question
        const nextQuestion = questions?.[currentQuestionIndex + 1];
        if (nextQuestion?.audioUrl) {
          playQuestionAudio(nextQuestion.audioUrl);
        }
      } else {
        // All questions completed
        completeInterview();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save response",
        variant: "destructive",
      });
    }
  };

  const skipQuestion = async () => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setRecordingDuration(0);

      // Auto-play next question
      const nextQuestion = questions?.[currentQuestionIndex + 1];
      if (nextQuestion?.audioUrl) {
        playQuestionAudio(nextQuestion.audioUrl);
      }
    } else {
      completeInterview();
    }
  };

  const completeInterview = async () => {
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (interview?.id) {
      // Update interview status in Supabase
      await supabase
        .from("interviews")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", interview.id);

      // Create candidate in Joan's hiring pipeline
      try {
        await createCandidate({
          interviewId: interview.id,
          candidateName: interview.candidate_name || "Unknown Candidate",
          candidateEmail: interview.candidate_email || "",
          position: interview.position || position,
          companyId: interview.companies?.id || "",
          stage: "screening",
          movedBy: "joan",
        });
      } catch (error) {
        console.error("Failed to create Joan pipeline candidate:", error);
      }
    }

    setStep("complete");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Async Interview for {companyName}</h1>
              <p className="text-muted-foreground mb-6">Position: <strong className="text-foreground">{position}</strong></p>

              <div className="text-left bg-muted/30 rounded-lg p-4 mb-6 space-y-3">
                <p className="text-sm font-medium text-foreground">How it works:</p>
                <p className="text-sm text-muted-foreground">
                  You will answer {questions?.length || 0} pre-recorded questions at your own pace.
                  Each question will be read by an AI voice, and you will record a video response.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Take your time - no rush</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> You can replay questions</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Record as many takes as you want</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Skip questions if needed</li>
                </ul>
              </div>

              <Button className="w-full gap-2" onClick={() => setStep("consent")}>
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "consent" && (
          <motion.div key="consent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg w-full">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-4">Consent</h2>
              <div className="bg-muted/30 rounded-lg p-4 mb-6 text-sm space-y-3">
                <p className="text-muted-foreground">
                  By proceeding, you consent to video recording and AI analysis of your responses.
                  Your responses will be stored and shared with {companyName}.
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={consent1} onCheckedChange={(v) => setConsent1(v === true)} className="mt-0.5" />
                  <span className="text-sm">I consent to video recording and AI analysis</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={consent2} onCheckedChange={(v) => setConsent2(v === true)} className="mt-0.5" />
                  <span className="text-sm">I understand my responses will be shared with {companyName}</span>
                </label>
              </div>
              <Button className="w-full" disabled={!consent1 || !consent2} onClick={handleConsent}>
                I Consent & Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === "systemcheck" && (
          <motion.div key="systemcheck" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg w-full">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-6">System Check</h2>

              {/* Video preview */}
              <div className="mb-6 rounded-lg overflow-hidden bg-black aspect-video">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              </div>

              <div className="space-y-3 mb-6">
                <div className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${checks.camera ? "bg-success/5 border border-success/20" : "bg-muted/30"}`}>
                  <Camera className={`h-5 w-5 ${checks.camera ? "text-success" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-sm font-medium">Camera</span>
                  {checks.camera ? <Check className="h-4 w-4 text-success" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <div className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${checks.mic ? "bg-success/5 border border-success/20" : "bg-muted/30"}`}>
                  <Mic className={`h-5 w-5 ${checks.mic ? "text-success" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-sm font-medium">Microphone</span>
                  {checks.mic ? <Check className="h-4 w-4 text-success" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <div className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${checks.internet ? "bg-success/5 border border-success/20" : "bg-muted/30"}`}>
                  <Wifi className={`h-5 w-5 ${checks.internet ? "text-success" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-sm font-medium">Internet</span>
                  {checks.internet ? <Check className="h-4 w-4 text-success" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>

              <Button className="w-full" disabled={!allChecksPassed} onClick={() => setStep("instructions")}>
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "instructions" && (
          <motion.div key="instructions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg w-full">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-4">Quick Tips</h2>
              <div className="space-y-4 mb-8">
                {[
                  { icon: "🎯", title: "Be yourself", desc: "Speak naturally and authentically" },
                  { icon: "⏸️", title: "Take your time", desc: "Pause to think before answering" },
                  { icon: "📷", title: "Look at the camera", desc: "Make eye contact with the lens" },
                  { icon: "🔁", title: "Re-record if needed", desc: "You can redo answers anytime" },
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
              <Button className="w-full" onClick={startQuestions}>
                Start Interview <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "questions" && currentQuestion && (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl w-full">
            <div className="glass-card rounded-2xl p-8">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of {questions?.length}
                  </span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Video preview */}
              <div className="mb-6 rounded-lg overflow-hidden bg-black aspect-video relative">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                {isRecording && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    REC {formatTime(recordingDuration)}
                  </div>
                )}
              </div>

              {/* Question text */}
              <div className="bg-muted/30 rounded-lg p-6 mb-6">
                <p className="text-lg font-medium mb-4">{currentQuestion.text}</p>
                {currentQuestion.audioUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playQuestionAudio(currentQuestion.audioUrl!)}
                    disabled={isPlayingQuestion}
                  >
                    {isPlayingQuestion ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isPlayingQuestion ? "Playing..." : "Replay Question"}
                  </Button>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-4">
                <Button variant="outline" onClick={skipQuestion}>
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>

                {!isRecording ? (
                  <Button onClick={startRecording} size="lg" className="flex-1">
                    <Play className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} size="lg" variant="destructive" className="flex-1">
                    <Square className="h-5 w-5 mr-2" />
                    Stop & Save
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {step === "complete" && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full">
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Interview Complete!</h1>
              <p className="text-muted-foreground mb-6">
                Thank you for completing the async interview. Your responses have been submitted to {companyName}.
              </p>
              <p className="text-sm text-muted-foreground">
                You will be contacted by the hiring team with next steps.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AsyncInterview;
