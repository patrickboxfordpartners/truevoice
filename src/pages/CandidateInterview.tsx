import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, Mic, Camera, Wifi, ChevronRight, Clock, MessageSquare, Eye, Volume2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Step = "welcome" | "consent" | "systemcheck" | "tips" | "waiting";

const STEPS: { key: Step; label: string }[] = [
  { key: "welcome", label: "Welcome" },
  { key: "consent", label: "Consent" },
  { key: "systemcheck", label: "Setup" },
  { key: "tips", label: "Tips" },
  { key: "waiting", label: "Ready" },
];

const ProgressIndicator = ({ currentStep }: { currentStep: Step }) => {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

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
  const [step, setStep] = useState<Step>("welcome");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [checks, setChecks] = useState({ camera: false, mic: false, internet: false });

  const companyName = "Acme Corp";
  const position = "Senior Frontend Engineer";
  const interviewerName = "John Doe";
  const estimatedDuration = "45 min";

  const startChecks = () => {
    setStep("systemcheck");
    setTimeout(() => setChecks((c) => ({ ...c, camera: true })), 1000);
    setTimeout(() => setChecks((c) => ({ ...c, mic: true })), 2000);
    setTimeout(() => setChecks((c) => ({ ...c, internet: true })), 3000);
  };

  const allChecksPassed = checks.camera && checks.mic && checks.internet;

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Eye className="h-3 w-3 text-primary" />
                    </div>
                    <span>Video call with your interviewer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Volume2 className="h-3 w-3 text-primary" />
                    </div>
                    <span>Speech patterns analyzed in real-time</span>
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
                    <span>Fair evaluation for all candidates</span>
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
              <h2 className="text-xl font-bold mb-4">Consent to Speech Analysis</h2>
              <div className="bg-muted/30 rounded-lg p-4 mb-6 text-sm space-y-3">
                <p className="font-medium text-foreground">What we analyze:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Speech patterns and natural flow</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Response timing and pauses</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Conversational authenticity markers</li>
                </ul>
                <p className="font-medium text-foreground mt-3">What we DON'T do:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><span className="text-destructive">✗</span> Record or store your audio</li>
                  <li className="flex items-center gap-2"><span className="text-destructive">✗</span> Share recordings with third parties</li>
                  <li className="flex items-center gap-2"><span className="text-destructive">✗</span> Use voice prints for identification</li>
                </ul>
              </div>
              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={consent1} onCheckedChange={(v) => setConsent1(v === true)} className="mt-0.5" />
                  <span className="text-sm">I consent to real-time speech analysis during this interview</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={consent2} onCheckedChange={(v) => setConsent2(v === true)} className="mt-0.5" />
                  <span className="text-sm">I understand that an authenticity score will be shared with {companyName}</span>
                </label>
              </div>
              <Button className="w-full" disabled={!consent1 || !consent2} onClick={startChecks}>
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
                  {checks.internet ? <span className="text-success text-sm font-medium flex items-center gap-1"><Check className="h-4 w-4" /> 25 Mbps</span> : <span className="text-sm text-muted-foreground animate-pulse">Testing...</span>}
                </div>
              </div>
              {allChecksPassed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <p className="text-sm text-success text-center mb-4 font-medium">✓ All systems ready!</p>
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
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-sm font-medium">Be yourself</p>
                    <p className="text-xs text-muted-foreground">Speak naturally and in your own words. Authenticity is what we're looking for.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-lg">⏸️</span>
                  <div>
                    <p className="text-sm font-medium">Take your time</p>
                    <p className="text-xs text-muted-foreground">It's perfectly fine to pause and think before answering. Thoughtful responses are valued.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-lg">📷</span>
                  <div>
                    <p className="text-sm font-medium">Look at the camera</p>
                    <p className="text-xs text-muted-foreground">Make eye contact by looking at the camera lens when speaking, not the screen.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-lg">🤔</span>
                  <div>
                    <p className="text-sm font-medium">Ask questions</p>
                    <p className="text-xs text-muted-foreground">Don't hesitate to ask for clarification. It shows engagement and genuine interest.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-lg">🔇</span>
                  <div>
                    <p className="text-sm font-medium">Quiet environment</p>
                    <p className="text-xs text-muted-foreground">Find a quiet space with good lighting. Close other tabs and apps to avoid distractions.</p>
                  </div>
                </div>
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
                  <span className="text-muted-foreground text-sm">Camera preview</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <h2 className="text-xl font-bold">Waiting for interviewer...</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {interviewerName} will join shortly. Sit tight and relax.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground text-left bg-muted/30 rounded-lg p-4">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Quick reminders</p>
                <p>💡 Speak naturally and take your time thinking</p>
                <p>💡 It's perfectly fine to pause before answering</p>
                <p>💡 Look at the camera when speaking</p>
                <p>💡 Your authenticity is your strength</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateInterview;
