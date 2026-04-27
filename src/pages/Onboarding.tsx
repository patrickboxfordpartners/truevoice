import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Building2, CreditCard, Video, Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCompany } from "@/hooks/useCompany";
import { useBilling } from "@/hooks/useBilling";
import { plans } from "@/lib/plans";
import { posthog } from "@/lib/posthog";

const STEPS = [
  { id: 1, label: "Company", icon: Building2 },
  { id: 2, label: "Plan", icon: CreditCard },
  { id: 3, label: "First Interview", icon: Video },
];

export default function Onboarding() {
  const { company, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const updateCompany = useUpdateCompany();
  const { startCheckout, loading: billingLoading } = useBilling();

  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState(company?.name ?? "");
  const [industry, setIndustry] = useState(company?.industry ?? "technology");
  const [saving, setSaving] = useState(false);

  async function handleCompanySave() {
    if (!companyName.trim()) return;
    setSaving(true);
    try {
      await updateCompany.mutateAsync({ name: companyName.trim(), industry });
      await refreshProfile();
      posthog.capture("onboarding_company_saved", { company_name: companyName, industry });
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  function handleSkipPlan() {
    posthog.capture("onboarding_plan_skipped");
    setStep(3);
  }

  function handlePlanSelect(planKey: string, priceId: string) {
    posthog.capture("onboarding_plan_selected", { plan: planKey });
    startCheckout(priceId);
  }

  function handleFinish() {
    posthog.capture("onboarding_completed");
    navigate("/dashboard");
  }

  const proPlan = plans.find((p) => p.key === "pro");
  const starterPlan = plans.find((p) => p.key === "starter");
  const scalePlan = plans.find((p) => p.key === "scale");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <img
          src="/truevoice-logo.png"
          alt="TrueVoice HQ"
          className="h-10 w-auto"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Step indicators */}
        <div className="flex items-center gap-3 mb-12">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isComplete = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    isComplete ? "bg-primary border-primary" :
                    isActive ? "border-primary bg-primary/10" :
                    "border-border bg-background"
                  }`}>
                    {isComplete
                      ? <Check className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
                      : <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    }
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 h-px mb-5 transition-colors ${step > s.id ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Company setup */}
          {step === 1 && (
            <motion.div
              key="step1"
              className="w-full max-w-md"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">Set up your workspace</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Tell us about your company so we can personalize your experience.
                </p>
              </div>
              <div className="glass-card rounded-xl p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCompanySave()}
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
                <Button
                  className="w-full"
                  onClick={handleCompanySave}
                  disabled={!companyName.trim() || saving}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Plan selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              className="w-full max-w-2xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">Choose your plan</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Pick the plan that fits your hiring volume. Cancel anytime.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[starterPlan, proPlan, scalePlan].filter(Boolean).map((plan) => (
                  <div
                    key={plan!.key}
                    className={`border border-border rounded-xl p-5 flex flex-col gap-3 bg-white ${
                      plan!.popular ? "border-primary shadow-lg" : ""
                    }`}
                  >
                    {plan!.popular && (
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">Most popular</span>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{plan!.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan!.description}</p>
                    </div>
                    <p className="text-2xl font-bold">
                      ${plan!.monthlyPrice}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </p>
                    <ul className="space-y-1.5 flex-1">
                      {plan!.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="sm"
                      variant={plan!.popular ? "default" : "outline"}
                      disabled={billingLoading}
                      onClick={() => handlePlanSelect(plan!.key, plan!.priceIds.monthly)}
                      className="w-full"
                    >
                      {billingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Choose ${plan!.name}`}
                    </Button>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <button
                  onClick={handleSkipPlan}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: First interview prompt */}
          {step === 3 && (
            <motion.div
              key="step3"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">You're all set</h1>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                Head to your dashboard to create your first interview. You can invite candidates, join live sessions, and review AI authenticity reports.
              </p>
              <div className="glass-card rounded-xl p-6 text-left space-y-3 mb-8">
                {[
                  "Create an interview and set the position",
                  "Send the candidate link — they join from any device",
                  "Watch live AI analysis as the interview runs",
                  "Review the authenticity report after",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full" size="lg" onClick={handleFinish}>
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
