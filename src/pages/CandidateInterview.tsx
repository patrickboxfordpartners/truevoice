import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, Mic, Camera, Wifi, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Step = "welcome" | "consent" | "systemcheck" | "waiting";

const CandidateInterview = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [checks, setChecks] = useState({ camera: false, mic: false, internet: false });

  const companyName = "Acme Corp";
  const position = "Senior Frontend Engineer";

  const startChecks = () => {
    setStep("systemcheck");
    setTimeout(() => setChecks((c) => ({ ...c, camera: true })), 1000);
    setTimeout(() => setChecks((c) => ({ ...c, mic: true })), 2000);
    setTimeout(() => setChecks((c) => ({ ...c, internet: true })), 3000);
  };

  const allChecksPassed = checks.camera && checks.mic && checks.internet;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card rounded-2xl p-8 max-w-lg w-full text-center">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Interview with {companyName}</h1>
            <p className="text-muted-foreground mb-6">You're interviewing for: <strong className="text-foreground">{position}</strong></p>
            <div className="text-left bg-muted/30 rounded-lg p-4 mb-6 space-y-2 text-sm text-muted-foreground">
              <p>• This interview uses AuthentiView speech analysis technology</p>
              <p>• We analyze speech patterns in real-time to ensure authentic conversation</p>
              <p>• No audio recordings are stored — only an authenticity score</p>
              <p>• This helps create a fair evaluation process for all candidates</p>
            </div>
            <Button className="w-full gap-2" onClick={() => setStep("consent")}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === "consent" && (
          <motion.div key="consent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card rounded-2xl p-8 max-w-lg w-full">
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
          </motion.div>
        )}

        {step === "systemcheck" && (
          <motion.div key="systemcheck" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-6">Let's test your setup</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-sm">Camera</span>
                {checks.camera ? <span className="text-success text-sm font-medium flex items-center gap-1"><Check className="h-4 w-4" /> Working</span> : <span className="text-sm text-muted-foreground animate-pulse-soft">Checking...</span>}
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                <Mic className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-sm">Microphone</span>
                {checks.mic ? <span className="text-success text-sm font-medium flex items-center gap-1"><Check className="h-4 w-4" /> Working</span> : <span className="text-sm text-muted-foreground animate-pulse-soft">Checking...</span>}
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-sm">Internet Connection</span>
                {checks.internet ? <span className="text-success text-sm font-medium flex items-center gap-1"><Check className="h-4 w-4" /> 25 Mbps</span> : <span className="text-sm text-muted-foreground animate-pulse-soft">Testing...</span>}
              </div>
            </div>
            <Button className="w-full" disabled={!allChecksPassed} onClick={() => setStep("waiting")}>
              Join Waiting Room
            </Button>
          </motion.div>
        )}

        {step === "waiting" && (
          <motion.div key="waiting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 max-w-lg w-full text-center">
            <div className="h-48 rounded-xl bg-foreground/5 flex items-center justify-center mb-6">
              <div className="text-muted-foreground text-sm">Camera preview</div>
            </div>
            <h2 className="text-xl font-bold mb-2">Waiting for interviewer...</h2>
            <p className="text-sm text-muted-foreground mb-6">Your interviewer will join shortly</p>
            <div className="space-y-2 text-sm text-muted-foreground text-left bg-muted/30 rounded-lg p-4">
              <p>💡 Speak naturally and take your time thinking</p>
              <p>💡 It's perfectly fine to pause before answering</p>
              <p>💡 Look at the camera when speaking</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateInterview;
