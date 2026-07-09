import { useEffect } from "react"
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
    description: "Audio-only analysis for lean hiring teams.",
    features: [
      "Real-time speech pattern scoring",
      "Response timing analysis",
      "Conversational flow detection",
      "Linguistic pattern scoring",
      "Tab & window focus monitoring",
      "Clipboard paste detection",
      "Post-interview intelligence report",
      "Candidate invitation emails",
    ],
    popular: false,
  },
  {
    name: "Pro",
    description: "Full audio + video analysis for high-signal hiring.",
    features: [
      "Everything in Starter",
      "Webcam gaze & attention analysis",
      "Multi-face detection",
      "Phone & secondary device detection",
      "Face presence tracking",
      "Visual behavior timeline",
      "Shareable report links",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Scale",
    description: "High-volume hiring with team collaboration.",
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
    popular: false,
  },
]

const Pricing = () => {
  const { setTheme } = useTheme()
  useEffect(() => { setTheme("light") }, [setTheme])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pricing</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Plans that scale with your hiring.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Pricing is based on interview volume and team size. Talk to us and we'll find the right fit.
          </p>
        </motion.div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {TIERS.map((tier, i) => (
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

              <Link to="/demo">
                <Button
                  className={`w-full gap-1.5 ${
                    tier.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                >
                  Contact Us for Pricing
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
        >
          <p className="text-sm text-muted-foreground">
            All plans are billed based on your interview volume and team configuration.{" "}
            <Link to="/demo" className="text-primary hover:underline underline-offset-2">
              Book a demo
            </Link>{" "}
            and we'll put together a proposal within 24 hours.
          </p>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default Pricing
