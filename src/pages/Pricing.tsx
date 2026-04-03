import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import StatItem from "@/components/landing/StatsCounter";
import ComparisonTable from "@/components/pricing/ComparisonTable";
import AnimatedPrice from "@/components/pricing/AnimatedPrice";

const plans = [
  {
    name: "Starter",
    badge: "Audio",
    description: "Audio-only analysis for teams getting started",
    monthly: 79,
    annual: 63,
    interviews: 30,
    overage: 3,
    features: [
      { name: "Real-time speech pattern scoring", included: true },
      { name: "Response timing analysis", included: true },
      { name: "Conversational flow detection", included: true },
      { name: "Linguistic authenticity scoring", included: true },
      { name: "Tab & window focus monitoring", included: true },
      { name: "Clipboard paste detection", included: true },
      { name: "Post-interview reports", included: true },
      { name: "Email invitation templates", included: true },
      { name: "Webcam gaze analysis", included: false },
      { name: "Reading detection", included: false },
      { name: "Multi-face detection", included: false },
    ],
    popular: false,
  },
  {
    name: "Pro",
    badge: "Audio + Video",
    description: "Full audio + video analysis for serious hiring teams",
    monthly: 149,
    annual: 119,
    interviews: 30,
    overage: 6,
    features: [
      { name: "Everything in Starter, plus:", included: true },
      { name: "Webcam gaze & attention analysis", included: true },
      { name: "Screen-reading detection", included: true },
      { name: "Multi-face detection (coaching alert)", included: true },
      { name: "Phone/device detection", included: true },
      { name: "Face presence tracking", included: true },
      { name: "Visual behavior timeline", included: true },
      { name: "Priority support", included: true },
    ],
    popular: true,
  },
  {
    name: "Scale",
    badge: "Audio + Video",
    description: "High-volume hiring with full analysis",
    monthly: 349,
    annual: 279,
    interviews: 100,
    overage: 5,
    features: [
      { name: "Everything in Pro, plus:", included: true },
      { name: "100 interviews per month", included: true },
      { name: "Up to 10 team members", included: true },
      { name: "Shared interview dashboard", included: true },
      { name: "Team analytics & trends", included: true },
      { name: "Bulk candidate import (CSV)", included: true },
      { name: "API access", included: true },
      { name: "Dedicated onboarding call", included: true },
    ],
    popular: false,
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
    a: "Audio analysis scores speech patterns, timing, flow, and linguistic authenticity. Video analysis adds webcam monitoring: gaze tracking, reading detection, multi-face detection, and phone/device detection. Both tiers include browser-level monitoring at no extra cost.",
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
      <Navbar />

      {/* Header */}
      <section className="pt-36 pb-16 px-6 text-center" style={{ background: 'var(--section-gradient-1)' }}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
          Pricing that scales{" "}
          <span className="text-gradient">with your hiring</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
          Start with audio-only analysis or go full coverage with video
          monitoring. Every plan includes a 14-day free trial.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 bg-secondary rounded-full p-1">
          <button
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              !annual
                ? "bg-background shadow-soft text-foreground"
                : "text-muted-foreground"
            }`}
            onClick={() => setAnnual(false)}
          >
            Monthly
          </button>
          <button
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              annual
                ? "bg-background shadow-soft text-foreground"
                : "text-muted-foreground"
            }`}
            onClick={() => setAnnual(true)}
          >
            Annual{" "}
            <span className="text-primary font-semibold">Save 20%</span>
          </button>
        </div>
      </section>

      {/* Cards */}
      <section className="px-6 pb-28" style={{ background: 'var(--section-gradient-2)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 0.1} className="h-full">
            <div
              className={`relative rounded-2xl border p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-primary/30 shadow-elevated bg-card"
                  : "border-border bg-card hover:shadow-elevated"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <span className="inline-block text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 w-fit mb-4">
                {plan.badge}
              </span>

              <h3 className="text-2xl font-bold text-card-foreground">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                {plan.description}
              </p>

              <div className="mb-1">
                <span className="text-4xl font-extrabold text-card-foreground">
                  <AnimatedPrice value={annual ? plan.annual : plan.monthly} />
                </span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                {plan.interviews} interviews/mo &middot; ${plan.overage}/additional
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    {f.included ? (
                      <Check size={16} className="text-primary mt-0.5 shrink-0" />
                    ) : (
                      <X size={16} className="text-muted-foreground/40 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={
                        f.included
                          ? "text-card-foreground"
                          : "text-muted-foreground/50"
                      }
                    >
                      {f.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                className="w-full"
              >
                Start Free Trial
              </Button>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-16 px-6" style={{ background: 'var(--section-gradient-3)' }}>
        <ScrollReveal className="max-w-4xl mx-auto">
          <p className="text-center text-lg font-semibold text-foreground mb-2">
            Enterprise-grade detection at a fraction of the cost
          </p>
          <p className="text-center text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
            Legacy platforms charge $25,000+/year. TrueVoice delivers the same
            detection capabilities starting at $2.63/interview.
          </p>
          <div className="grid grid-cols-3 gap-8">
            <StatItem value={4} label="Scoring dimensions" />
            <StatItem value={20} suffix="s" label="Analysis refresh rate" />
            <StatItem value={6} label="Behavioral signals tracked" />
          </div>
        </ScrollReveal>
      </section>

      <ComparisonTable />

      {/* FAQ */}
      <section className="py-28 px-6" style={{ background: 'var(--section-gradient-2)' }}>
        <ScrollReveal className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border rounded-xl px-6 data-[state=open]:shadow-soft transition-shadow"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="pb-28 px-6" style={{ background: 'var(--section-gradient-1)' }}>
        <ScrollReveal className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to hire with <span className="text-gradient">confidence</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Button variant="hero" size="xl" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Start Free Trial
            <ArrowRight size={18} />
          </Button>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
