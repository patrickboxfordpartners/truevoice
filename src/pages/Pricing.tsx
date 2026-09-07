import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import Footer from "@/components/landing/Footer"

const ease = [0.16, 1, 0.3, 1]

const TIERS = [
  {
    name: "Starter",
    monthlyPrice: 99,
    yearlyPrice: 79,
    description: "Audio-only authenticity analysis for growing teams.",
    interviews: "10 interviews/mo",
    features: [
      "Real-time speech pattern scoring",
      "AI-assisted answer detection",
      "Response timing analysis",
      "Linguistic pattern scoring",
      "Clipboard paste detection",
      "Post-interview authenticity report",
      "Candidate invitation emails",
      "Email support",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=starter",
    popular: false,
  },
  {
    name: "Pro",
    monthlyPrice: 249,
    yearlyPrice: 199,
    description: "Full audio + video detection for high-stakes hiring.",
    interviews: "50 interviews/mo",
    features: [
      "Everything in Starter",
      "Webcam gaze & attention analysis",
      "Multi-face detection",
      "Phone & secondary device detection",
      "Script reading signal detection",
      "Side-by-side candidate comparison",
      "Shareable report links",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    popular: true,
  },
  {
    name: "Scale",
    monthlyPrice: 499,
    yearlyPrice: 399,
    description: "Unlimited detection with team collaboration.",
    interviews: "Unlimited",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared interview dashboard",
      "Team analytics & position trends",
      "Bulk candidate import (CSV)",
      "Phrase memory across interviews",
      "API access",
      "Dedicated onboarding",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=scale",
    popular: false,
  },
]

const Pricing = () => {
  const { setTheme } = useTheme()
  useEffect(() => { setTheme("light") }, [setTheme])
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pricing</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Transparent pricing. No sales call required.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-2">
            Every plan includes 3 free interviews to start. No credit card needed.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
        >
          <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-11 h-6 rounded-full transition-colors ${annual ? "bg-accent" : "bg-muted"}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${annual ? "translate-x-5" : ""}`} />
          </button>
          <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual <span className="text-accent text-xs font-semibold">Save 20%</span>
          </span>
        </motion.div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {TIERS.map((tier, i) => {
            const price = annual ? tier.yearlyPrice : tier.monthlyPrice
            return (
              <motion.div
                key={tier.name}
                className={`relative rounded-2xl border p-7 flex flex-col ${
                  tier.popular
                    ? "border-primary shadow-elevated bg-card"
                    : "border-border bg-card"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground mb-1">{tier.name}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground tabular-nums">${price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  {annual && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${tier.yearlyPrice * 12}/yr, billed annually
                    </p>
                  )}
                  <p className="text-xs font-medium text-accent mt-2">{tier.interviews}</p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check
                        className={`h-4 w-4 shrink-0 mt-0.5 ${tier.popular ? "text-primary" : "text-muted-foreground"}`}
                        strokeWidth={2.5}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to={tier.href}>
                  <Button
                    className={`w-full gap-1.5 ${
                      tier.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Free trial callout */}
        <motion.div
          className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center mb-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
        >
          <p className="text-sm font-semibold text-foreground mb-1">Try before you buy</p>
          <p className="text-sm text-muted-foreground">
            Every plan starts with 3 free interviews, audio-only analysis. No credit card, no commitment. See what TrueVoice detects in your actual interviews.
          </p>
        </motion.div>

        {/* Bottom note */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease }}
        >
          <p className="text-sm text-muted-foreground">
            Need more than 50 interviews per month or custom integrations?{" "}
            <a href="https://cal.com/boxfordpartners/truevoice-demo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-2">
              Talk to us
            </a>{" "}
            and we'll build a plan that fits.
          </p>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default Pricing
