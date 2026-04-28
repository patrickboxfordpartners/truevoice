import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, CreditCard, Video, Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateCompany } from "@/hooks/useCompany";
import { useBilling } from "@/hooks/useBilling";
import { plans } from "@/lib/plans";
import { posthog } from "@/lib/posthog";

const ease = [0.16, 1, 0.3, 1];

const STEPS = [
  { id: 1, label: "Company", icon: Building2 },
  { id: 2, label: "Plan", icon: CreditCard },
  { id: 3, label: "Ready", icon: Video },
];

export default function Onboarding() {
  const { company, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const updateCompany = useUpdateCompany();
  const { startCheckout, loading: billingLoading } = useBilling();
  const { setTheme } = useTheme();
  useEffect(() => { setTheme("light"); }, [setTheme]);

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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-[hsl(155,20%,92%)] px-6 py-4">
        <img src="/truevoice-logo.png" alt="TrueVoice HQ" className="h-8 w-auto" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="flex items-center gap-3 mb-12">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isComplete = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      isComplete ? "bg-accent border-accent" :
                      isActive ? "border-accent bg-accent/10" :
                      "border-border bg-background"
                    }`}
                    animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.4, ease }}
                  >
                    {isComplete
                      ? <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                      : <Icon className={`h-4 w-4 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                    }
                  </motion.div>
                  <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-16 h-px mb-5 transition-colors duration-500 ${step > s.id ? "bg-accent" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Set up your workspace</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Tell us about your company so we can personalize your experience.
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
                  className="w-full h-12 bg-foreground text-background hover:bg-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
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

          {step === 2 && (
            <motion.div
              key="step2"
              className="w-full max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Choose your plan</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Pick the plan that fits your hiring volume. Cancel anytime.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[starterPlan, proPlan, scalePlan].filter(Boolean).map((plan) => (
                  <motion.div
                    key={plan!.key}
                    className={`border rounded-xl p-6 flex flex-col gap-3 bg-card text-center ${
                      plan!.popular ? "border-accent shadow-elevated" : "border-border"
                    }`}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  >
                    <div className="h-5">
                      {plan!.popular && (
                        <span className="text-xs font-semibold text-accent uppercase tracking-wider">Most popular</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-lg">{plan!.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan!.description}</p>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      ${plan!.monthlyPrice}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    <ul className="space-y-2 flex-1 text-left mt-2">
                      {plan!.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${plan!.popular ? "text-accent" : "text-muted-foreground"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      disabled={billingLoading}
                      onClick={() => handlePlanSelect(plan!.key, plan!.priceIds.monthly)}
                      className={`w-full h-11 mt-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated ${
                        plan!.popular
                          ? "bg-accent text-white hover:bg-accent/85"
                          : "bg-foreground text-background hover:bg-foreground/85"
                      }`}
                    >
                      {billingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Choose ${plan!.name}`}
                    </Button>
                  </motion.div>
                ))}
              </div>
              <div className="text-center">
                <button
                  onClick={handleSkipPlan}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
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
                <Check className="h-8 w-8 text-accent" />
              </motion.div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">You're all set</h1>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                Head to your dashboard to create your first interview.
              </p>
              <div className="bg-card border border-border rounded-xl p-6 text-left space-y-4 mb-8">
                {[
                  "Create an interview and set the position",
                  "Send the candidate link",
                  "Watch live AI analysis as the interview runs",
                  "Review the authenticity report after",
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1, ease }}
                  >
                    <span className="text-sm font-bold text-accent w-5 shrink-0">{i + 1}.</span>
                    <p className="text-sm text-foreground">{item}</p>
                  </motion.div>
                ))}
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
