import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Minus, ArrowRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useBilling } from "@/hooks/useBilling";
import { plans as planDefs } from "@/lib/plans";

const plans = planDefs.map((p) => ({
  name: p.name,
  description: p.description,
  monthly: p.monthlyPrice,
  annual: p.annualMonthly,
  interviews: p.interviews,
  features: p.features,
  popular: p.popular,
  priceIds: p.priceIds,
}));

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
  const { startCheckout, loading } = useBilling();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-40 pb-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium text-accent uppercase tracking-wider mb-4">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Pick the plan that fits your hiring volume.
          </p>
        </div>
      </section>

      {/* Toggle */}
      <div className="flex justify-center mb-12 sm:mb-16 px-6">
        <div className="inline-flex items-center bg-secondary rounded-lg p-1">
          <button
            className={`px-4 sm:px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              !annual
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setAnnual(false)}
          >
            Monthly
          </button>
          <button
            className={`px-4 sm:px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              annual
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setAnnual(true)}
          >
            Annually <span className="text-accent font-semibold text-xs ml-1">-20%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <section className="px-4 sm:px-6 pb-24 sm:pb-32">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:items-stretch">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 0.08} className="h-full">
              <div
                className={`relative flex flex-col h-full px-6 sm:px-8 py-8 sm:py-10 bg-card rounded-xl border text-center ${
                  plan.popular
                    ? "border-accent shadow-elevated"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-4">Most popular</p>
                )}
                {!plan.popular && <div className="mb-4" />}

                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm mt-1 text-muted-foreground">
                  {plan.description}
                </p>

                <div className="mt-6 mb-1">
                  <span className="text-5xl font-bold tracking-tight text-foreground">
                    ${annual ? plan.annual : plan.monthly}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mb-8">
                  {plan.interviews}
                </p>

                <Button
                  size="lg"
                  disabled={loading}
                  onClick={() => startCheckout(annual ? plan.priceIds.yearly : plan.priceIds.monthly)}
                  className={`w-full h-12 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated ${
                    plan.popular
                      ? "bg-accent text-white hover:bg-accent/85"
                      : "bg-foreground text-background hover:bg-foreground/85"
                  }`}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose plan"}
                </Button>

                <div className="h-px bg-border mt-8 mb-8" />

                <ul className="space-y-4 flex-1 text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check size={16} className={`mt-0.5 shrink-0 ${plan.popular ? "text-accent" : "text-muted-foreground"}`} />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="px-4 sm:px-6 pb-24 sm:pb-32">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <details className="group">
              <summary className="flex items-center justify-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors select-none list-none">
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
      <section className="px-4 sm:px-6 pb-24 sm:pb-32">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
              <div className="md:col-span-4 md:sticky md:top-28 md:self-start text-center md:text-left">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Support</p>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Frequently asked questions
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Can't find what you're looking for? <a href="mailto:hello@truevoicehq.com" className="text-accent hover:underline transition-colors">Reach out</a> and we'll get back to you.
                </p>
              </div>

              <div className="md:col-span-8">
                <Accordion type="single" collapsible className="space-y-0">
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="border-0 border-b border-border last:border-0"
                    >
                      <AccordionTrigger className="text-[15px] font-medium text-foreground hover:no-underline py-6 text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-6">
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
      <section className="px-4 sm:px-6 pb-24 sm:pb-32">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto border border-border rounded-xl px-6 sm:px-8 py-12 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Ready to protect your process?
            </h2>
            <p className="text-muted-foreground mb-8">
              Set up in minutes. Cancel anytime.
            </p>
            <Button
              size="lg"
              disabled={loading}
              onClick={() => startCheckout(plans[1].priceIds.monthly)}
              className="bg-foreground text-background hover:bg-accent transition-colors hover:-translate-y-0.5 hover:shadow-elevated duration-200"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose Pro"}
              {!loading && <ArrowRight size={16} className="ml-2" />}
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
  if (typeof value === "string") return <span className="text-sm font-medium text-foreground">{value}</span>;
  return value
    ? <Check size={16} className="text-accent" />
    : <Minus size={16} className="text-muted-foreground/40" />;
};

const CompactComparison = () => (
  <div className="overflow-x-auto -mx-4 sm:mx-0">
    <table className="w-full text-sm min-w-[500px]">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left py-3 pr-4 font-medium text-muted-foreground w-1/2">Feature</th>
          <th className="text-center py-3 px-2 font-medium text-foreground">Starter</th>
          <th className="text-center py-3 px-2 font-medium text-foreground">Pro</th>
          <th className="text-center py-3 px-2 font-medium text-foreground">Scale</th>
        </tr>
      </thead>
      <tbody>
        {comparisonRows.map((row) => (
          <tr key={row.feature} className="border-b border-border/50">
            <td className="py-3 pr-4 text-muted-foreground">{row.feature}</td>
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
