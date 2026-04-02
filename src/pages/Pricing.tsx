import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, ArrowRight, Mic, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";

const tiers = [
  {
    name: "Starter",
    monthlyPrice: 79,
    annualPrice: 63,
    description: "Audio-only analysis for teams getting started",
    badge: null,
    interviews: "30 interviews/mo",
    overage: "$3/additional interview",
    features: [
      { text: "Real-time speech pattern scoring", included: true },
      { text: "Response timing analysis", included: true },
      { text: "Conversational flow detection", included: true },
      { text: "Linguistic authenticity scoring", included: true },
      { text: "Tab & window focus monitoring", included: true },
      { text: "Clipboard paste detection", included: true },
      { text: "Post-interview reports", included: true },
      { text: "Email invitation templates", included: true },
      { text: "Webcam gaze analysis", included: false },
      { text: "Reading detection", included: false },
      { text: "Multi-face detection", included: false },
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
    icon: Mic,
    iconLabel: "Audio",
  },
  {
    name: "Pro",
    monthlyPrice: 149,
    annualPrice: 119,
    description: "Full audio + video analysis for serious hiring teams",
    badge: "Most Popular",
    interviews: "30 interviews/mo",
    overage: "$6/additional interview",
    features: [
      { text: "Everything in Starter, plus:", included: true },
      { text: "Webcam gaze & attention analysis", included: true },
      { text: "Screen-reading detection", included: true },
      { text: "Multi-face detection (coaching alert)", included: true },
      { text: "Phone/device detection", included: true },
      { text: "Face presence tracking", included: true },
      { text: "Visual behavior timeline", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Free Trial",
    variant: "default" as const,
    icon: Camera,
    iconLabel: "Audio + Video",
  },
  {
    name: "Scale",
    monthlyPrice: 349,
    annualPrice: 279,
    description: "High-volume hiring with full analysis",
    badge: null,
    interviews: "100 interviews/mo",
    overage: "$5/additional interview",
    features: [
      { text: "Everything in Pro, plus:", included: true },
      { text: "100 interviews per month", included: true },
      { text: "Up to 10 team members", included: true },
      { text: "Shared interview dashboard", included: true },
      { text: "Team analytics & trends", included: true },
      { text: "Bulk candidate import (CSV)", included: true },
      { text: "API access", included: true },
      { text: "Dedicated onboarding call", included: true },
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
    icon: Camera,
    iconLabel: "Audio + Video",
  },
];

const faqs = [
  {
    q: "What counts as an interview?",
    a: "One interview = one candidate session, regardless of duration. A 15-minute screening and a 90-minute panel both count as one interview.",
  },
  {
    q: "What happens if I go over my monthly limit?",
    a: "You can keep running interviews. Overage is billed at the per-interview rate for your plan at the end of the billing cycle.",
  },
  {
    q: "Is audio recorded or stored?",
    a: "No. Audio is transcribed in real-time and discarded. Only the text transcript and analysis scores are stored. Webcam frames are analyzed and immediately discarded — no images are saved.",
  },
  {
    q: "Do candidates know they're being analyzed?",
    a: "Yes. Full transparency is built in. Candidates receive disclosure in the email invitation, on the welcome page, and must explicitly consent before the session begins.",
  },
  {
    q: "What's the difference between audio and video analysis?",
    a: "Audio analysis scores speech patterns, timing, flow, and linguistic authenticity. Video analysis adds webcam monitoring: gaze tracking, reading detection, multi-face detection, and phone/device detection. Both tiers include browser-level monitoring (tab switching, paste detection) at no extra cost.",
  },
  {
    q: "Can I try it before I buy?",
    a: "Every plan includes a 14-day free trial with full features. No credit card required to start.",
  },
];

const Pricing = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">AuthentiView</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Pricing that scales with your hiring
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start with audio-only analysis or go full coverage with video monitoring.
            Every plan includes a 14-day free trial.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 rounded-full border border-border p-1 bg-muted/30">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!annual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${annual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              Annual <span className="text-success text-xs font-semibold ml-1">Save 20%</span>
            </button>
          </div>
        </motion.div>

        {/* Tiers */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative glass-card rounded-2xl p-6 flex flex-col ${tier.badge ? "ring-2 ring-primary" : ""}`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  {tier.badge}
                </span>
              )}

              {/* Tier type badge */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3">
                <tier.icon className="h-3.5 w-3.5" />
                {tier.iconLabel}
              </div>

              <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

              <div className="mb-2">
                <span className="text-4xl font-extrabold">
                  ${annual ? tier.annualPrice : tier.monthlyPrice}
                </span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              {annual && (
                <p className="text-xs text-muted-foreground mb-4">
                  Billed ${tier.annualPrice * 12}/year (save ${(tier.monthlyPrice - tier.annualPrice) * 12}/yr)
                </p>
              )}
              {!annual && <div className="mb-4" />}

              <div className="text-sm font-medium mb-1">{tier.interviews}</div>
              <p className="text-xs text-muted-foreground mb-6">{tier.overage}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f.text} className={`flex items-start gap-2 text-sm ${!f.included ? "text-muted-foreground/50" : ""}`}>
                    {f.included ? (
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                    )}
                    {f.text}
                  </li>
                ))}
              </ul>

              <Button variant={tier.variant} className="w-full gap-2">
                {tier.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Comparison callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-24"
        >
          <div className="glass-card rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-3">Enterprise-grade detection at a fraction of the cost</h3>
            <p className="text-muted-foreground mb-6">
              Legacy interview intelligence platforms charge $25,000+/year.
              AuthentiView delivers the same detection capabilities starting at
              <span className="text-foreground font-semibold"> $2.63/interview</span>.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-extrabold text-primary">4</p>
                <p className="text-xs text-muted-foreground">Scoring dimensions</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-primary">20s</p>
                <p className="text-xs text-muted-foreground">Analysis refresh rate</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-primary">6</p>
                <p className="text-xs text-muted-foreground">Behavioral signals tracked</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-border pb-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-12"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to hire with confidence?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="text-base px-8 h-12 gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
