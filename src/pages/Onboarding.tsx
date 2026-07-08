import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Video, Check, ArrowRight, Loader2, Copy, CheckCircle2,
  Users, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCompany } from "@/hooks/useCompany";
import { useCreateInterview } from "@/hooks/useInterviews";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1];

type WizardStep = 1 | 2 | 3 | 4;

const STEP_META = [
  { id: 1 as WizardStep, label: "Welcome", icon: Video },
  { id: 2 as WizardStep, label: "Workspace", icon: Building2 },
  { id: 3 as WizardStep, label: "Interview", icon: Users },
  { id: 4 as WizardStep, label: "Ready", icon: CheckCircle2 },
];

export default function Onboarding() {
  const { company, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const updateCompany = useUpdateCompany();
  const createInterview = useCreateInterview();
  const { setTheme } = useTheme();

  useEffect(() => { setTheme("light"); }, [setTheme]);

  // If already onboarded, redirect immediately
  if (profile?.has_completed_onboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  const workspaceAlreadySet = !!(company?.name);

  // Start at step 1. Step 2 will be skipped if workspace is set.
  const [step, setStep] = useState<WizardStep>(1);

  // Step 2 state
  const [companyName, setCompanyName] = useState(company?.name ?? "");
  const [industry, setIndustry] = useState(company?.industry ?? "technology");
  const [savingWorkspace, setSavingWorkspace] = useState(false);

  // Step 3 state
  const [position, setPosition] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [creatingInterview, setCreatingInterview] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  // Step 4 state
  const [candidateLink, setCandidateLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [firstCandidateName, setFirstCandidateName] = useState("");

  const advanceFrom1 = useCallback(() => {
    if (workspaceAlreadySet) {
      setStep(3); // skip step 2
    } else {
      setStep(2);
    }
  }, [workspaceAlreadySet]);

  const handleSaveWorkspace = async () => {
    if (!companyName.trim()) return;
    setSavingWorkspace(true);
    try {
      await updateCompany.mutateAsync({ name: companyName.trim(), industry });
      await refreshProfile();
      setStep(3);
    } finally {
      setSavingWorkspace(false);
    }
  };

  const handleCreateInterview = async () => {
    if (!position.trim() || !candidateName.trim() || !candidateEmail.trim()) return;
    setCreatingInterview(true);
    setInterviewError(null);
    try {
      const interview = await createInterview.mutateAsync({
        position: position.trim(),
        candidate_name: candidateName.trim(),
        candidate_email: candidateEmail.trim(),
        status: "scheduled",
      });
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const link = `${siteUrl}/interview/${interview.candidate_token}`;
      setCandidateLink(link);
      setFirstCandidateName(candidateName.trim());
      setStep(4);
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : "Failed to create interview. Please try again.");
    } finally {
      setCreatingInterview(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(candidateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
    }
  };

  const handleFinish = async () => {
    if (profile?.id) {
      await supabase
        .from("profiles")
        .update({ has_completed_onboarding: true })
        .eq("id", profile.id);
    }
    navigate("/dashboard");
  };

  const isStep2Skipped = workspaceAlreadySet;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-[hsl(155,20%,92%)] px-6 py-4">
        <img src="/truevoice-logo.png" alt="TrueVoice HQ" className="h-8 w-auto" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-12">
          {STEP_META.map((s, i) => {
            const Icon = s.icon;
            const isComplete = step > s.id || (s.id === 2 && isStep2Skipped && step >= 3);
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      isComplete
                        ? "bg-accent border-accent"
                        : isActive
                        ? "border-accent bg-accent/10"
                        : "border-border bg-background"
                    }`}
                    animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.4, ease }}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                    ) : (
                      <Icon
                        className={`h-4 w-4 ${isActive ? "text-accent" : "text-muted-foreground"}`}
                      />
                    )}
                  </motion.div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEP_META.length - 1 && (
                  <div
                    className={`w-12 sm:w-16 h-px mb-5 transition-colors duration-500 ${
                      step > s.id || (s.id === 2 && isStep2Skipped && step >= 3)
                        ? "bg-accent"
                        : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">

          {/* Step 1: Welcome */}
          {step === 1 && (
            <motion.div
              key="step1"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease }}
            >
              <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
                Welcome to TrueVoice HQ.
              </h1>
              <p className="text-sm text-muted-foreground mb-10">
                Let's get you set up in 3 minutes.
              </p>

              {/* 3-step visual */}
              <div className="flex items-start justify-center gap-2 mb-10">
                {[
                  { icon: Building2, label: "Set up workspace" },
                  { icon: Users, label: "Create your first interview" },
                  { icon: Video, label: "Send the candidate link" },
                ].map((item, i) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-2 max-w-[90px]">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                          <ItemIcon className="h-5 w-5 text-accent" />
                        </div>
                        <p className="text-xs text-muted-foreground text-center leading-tight">
                          {item.label}
                        </p>
                      </div>
                      {i < 2 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-0 shrink-0 -translate-y-3" />
                      )}
                    </div>
                  );
                })}
              </div>

              <Button
                className="w-full h-12 bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
                onClick={advanceFrom1}
              >
                Let's go
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Workspace */}
          {step === 2 && (
            <motion.div
              key="step2"
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Tell us about your team.
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  This helps us personalize your experience.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    placeholder="Your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveWorkspace()}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="consulting">Consulting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-10"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 h-10 bg-foreground text-background hover:bg-accent transition-all"
                    onClick={handleSaveWorkspace}
                    disabled={!companyName.trim() || savingWorkspace}
                  >
                    {savingWorkspace && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Create Interview */}
          {step === 3 && (
            <motion.div
              key="step3"
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Create your first interview.
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Try it with a colleague first — low stakes, real results.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    placeholder="e.g. Senior Engineer"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="candidateName">Colleague's name</Label>
                  <Input
                    id="candidateName"
                    placeholder="e.g. Alex Smith"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="candidateEmail">Colleague's email</Label>
                  <Input
                    id="candidateEmail"
                    type="email"
                    placeholder="alex@yourcompany.com"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateInterview()}
                  />
                </div>

                <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground">
                  We'll generate a private link your colleague opens to join the interview.
                </div>

                {interviewError && (
                  <p className="text-sm text-destructive">{interviewError}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-10"
                    onClick={() => setStep(isStep2Skipped ? 1 : 2)}
                    disabled={creatingInterview}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 h-10 bg-foreground text-background hover:bg-accent transition-all"
                    onClick={handleCreateInterview}
                    disabled={
                      !position.trim() ||
                      !candidateName.trim() ||
                      !candidateEmail.trim() ||
                      creatingInterview
                    }
                  >
                    {creatingInterview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Interview
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <motion.div
              key="step4"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease }}
            >
              <motion.div
                className="h-16 w-16 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease }}
              >
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </motion.div>

              <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
                Your interview is ready.
              </h1>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                Share this link with{" "}
                <span className="font-medium text-foreground">{firstCandidateName}</span>.
                When they click it, they'll join the interview from their browser — no app required.
              </p>

              {/* Candidate link copy box */}
              <div className="bg-card border border-border rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Candidate link
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={candidateLink}
                    className="text-xs font-mono bg-muted/50 h-9"
                    onFocus={(e) => e.target.select()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 h-9"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <><Check className="h-3.5 w-3.5 text-success" />Copied!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" />Copy</>
                    )}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full h-12 bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
                size="lg"
                onClick={handleFinish}
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
