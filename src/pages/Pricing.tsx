import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Minus, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Starter",
    description: "Audio-only analysis",
    monthly: 79,
    annual: 63,
    interviews: "30 interviews/mo",
    cta: "Get started",
    features: [
      "Real-time speech pattern scoring",
      "Response timing analysis",
      "Conversational flow detection",
      "Linguistic authenticity scoring",
      "Tab & window focus monitoring",
      "Clipboard paste detection",
      "Post-interview reports",
      "Email invitation templates",
    ],
    popular: false,
  },
  {
    name: "Pro",
    description: "Audio + video analysis",
    monthly: 149,
    annual: 119,
    interviews: "30 interviews/mo",
    cta: "Get started",
    features: [
      "Everything in Starter",
      "Webcam gaze & attention analysis",
      "Screen-reading detection",
      "Multi-face detection",
      "Phone/device detection",
      "Face presence tracking",
      "Visual behavior timeline",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Scale",
    description: "High-volume hiring",
    monthly: 349,
    annual: 279,
    interviews: "100 interviews/mo",
    cta: "Get started",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared interview dashboard",
      "Team analytics & trends",
      "Bulk candidate import (CSV)",
      "API access",
      "Dedicated onboarding call",
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
    a: "No. Audio is transcribed in real-time and discarded. Only the text transcript and analysis scores are stored. Webcam frames are analyzed and immediately discarded.",
  },
  {
    q: "Do candidates know they're being analyzed?",
    a: "Yes. Candidates receive disclosure in the email invitation, on the welcome page, and must explicitly consent before the session begins.",
  },
  {
    q: "What's the difference between audio and video analysis?",
    a: "Audio analysis scores speech patterns, timing, flow, and linguistic authenticity. Video adds webcam monitoring: gaze tracking, reading detection, multi-face detection, and phone/device detection.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
  },
];

const Pricing = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <section className="pt-40 pb-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-5">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Pick the plan that fits your hiring volume.
          </p>
        </div>
      </section>

      {/* Toggle */}
      <div className="flex justify-center mb-16 px-6">
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              !annual
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setAnnual(false)}
          >
            Monthly
          </button>
          <button
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              annual
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setAnnual(true)}
          >
            Annually <span className="text-emerald-600 font-semibold text-xs ml-1">-20%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <section className="px-6 pb-32">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0 md:items-start">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 0.08} className="h-full">
              <div
                className={`relative flex flex-col h-full px-8 py-10 ${
                  plan.popular
                    ? "bg-gray-900 text-white md:-my-4 md:py-14 md:rounded-2xl md:shadow-2xl md:z-10"
                    : i === 0
                      ? "bg-white md:rounded-l-2xl md:border md:border-r-0 md:border-gray-200"
                      : "bg-white md:rounded-r-2xl md:border md:border-l-0 md:border-gray-200"
                } ${i !== 1 ? "border-b md:border-b border-gray-200 md:border-b-gray-200" : ""}`}
              >
                {plan.popular && (
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-6">Most popular</p>
                )}
                {!plan.popular && <div className="mb-6" />}

                <h3 className={`text-lg font-semibold ${plan.popular ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mt-1 ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>
                  {plan.description}
                </p>

                <div className="mt-6 mb-1 text-center">
                  <span className={`text-5xl font-bold tracking-tight ${plan.popular ? "text-white" : "text-gray-900"}`}>
                    ${annual ? plan.annual : plan.monthly}
                  </span>
                  <span className={`text-sm ${plan.popular ? "text-gray-500" : "text-gray-400"}`}>/mo</span>
                </div>
                <p className={`text-xs text-center ${plan.popular ? "text-gray-500" : "text-gray-400"}`}>
                  {plan.interviews}
                </p>

                <Button
                  size="lg"
                  className={`w-full mt-8 mb-8 ${
                    plan.popular
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </Button>

                <div className={`h-px ${plan.popular ? "bg-gray-700" : "bg-gray-100"}`} />

                <ul className="mt-8 space-y-4 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check size={16} className={`mt-0.5 shrink-0 ${plan.popular ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={plan.popular ? "text-gray-300" : "text-gray-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Comparison — collapsed by default */}
      <section className="px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <details className="group">
              <summary className="flex items-center justify-center gap-2 cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors select-none list-none">
                <span>Compare all features</span>
                <ArrowRight size={14} className="transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <div className="mt-10">
                <CompactComparison />
              </div>
            </details>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-32">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
              {/* Left column — sticky heading */}
              <div className="md:col-span-4 md:sticky md:top-28 md:self-start">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Support</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Frequently asked questions
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Can't find what you're looking for? <a href="mailto:hello@boxfordpartners.com" className="text-gray-900 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900 transition-colors">Reach out</a> and we'll get back to you.
                </p>
              </div>

              {/* Right column — accordion */}
              <div className="md:col-span-8">
                <Accordion type="single" collapsible className="space-y-0">
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="border-0 border-b border-gray-100 last:border-0"
                    >
                      <AccordionTrigger className="text-[15px] font-medium text-gray-900 hover:no-underline py-6 text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-6">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-32">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto bg-gray-900 rounded-2xl px-8 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to get started?
            </h2>
            <p className="text-gray-400 mb-8">
              Set up in minutes. Cancel anytime.
            </p>
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              Get started
              <ArrowRight size={16} />
            </Button>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
};

/* Inline compact comparison table */
const comparisonRows: { feature: string; starter: boolean | string; pro: boolean | string; scale: boolean | string }[] = [
  { feature: "Speech pattern scoring", starter: true, pro: true, scale: true },
  { feature: "Response timing analysis", starter: true, pro: true, scale: true },
  { feature: "Conversational flow detection", starter: true, pro: true, scale: true },
  { feature: "Linguistic authenticity scoring", starter: true, pro: true, scale: true },
  { feature: "Tab & window monitoring", starter: true, pro: true, scale: true },
  { feature: "Clipboard paste detection", starter: true, pro: true, scale: true },
  { feature: "Post-interview reports", starter: true, pro: true, scale: true },
  { feature: "Webcam gaze analysis", starter: false, pro: true, scale: true },
  { feature: "Screen-reading detection", starter: false, pro: true, scale: true },
  { feature: "Multi-face detection", starter: false, pro: true, scale: true },
  { feature: "Phone/device detection", starter: false, pro: true, scale: true },
  { feature: "Visual behavior timeline", starter: false, pro: true, scale: true },
  { feature: "Team members", starter: "1", pro: "3", scale: "10" },
  { feature: "Interviews per month", starter: "30", pro: "30", scale: "100" },
  { feature: "Shared dashboard", starter: false, pro: false, scale: true },
  { feature: "Team analytics", starter: false, pro: false, scale: true },
  { feature: "Bulk import (CSV)", starter: false, pro: false, scale: true },
  { feature: "API access", starter: false, pro: false, scale: true },
  { feature: "Priority support", starter: false, pro: true, scale: true },
  { feature: "Dedicated onboarding", starter: false, pro: false, scale: true },
];

const Cell = ({ value }: { value: boolean | string }) => {
  if (typeof value === "string") return <span className="text-sm font-medium text-gray-900">{value}</span>;
  return value
    ? <Check size={16} className="text-gray-900" />
    : <Minus size={16} className="text-gray-300" />;
};

const CompactComparison = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 pr-4 font-medium text-gray-400 w-1/2">Feature</th>
          <th className="text-center py-3 px-2 font-medium text-gray-900">Starter</th>
          <th className="text-center py-3 px-2 font-medium text-gray-900">Pro</th>
          <th className="text-center py-3 px-2 font-medium text-gray-900">Scale</th>
        </tr>
      </thead>
      <tbody>
        {comparisonRows.map((row) => (
          <tr key={row.feature} className="border-b border-gray-50">
            <td className="py-3 pr-4 text-gray-600">{row.feature}</td>
            <td className="py-3 px-2 text-center"><Cell value={row.starter} /></td>
            <td className="py-3 px-2 text-center"><Cell value={row.pro} /></td>
            <td className="py-3 px-2 text-center"><Cell value={row.scale} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Pricing;
