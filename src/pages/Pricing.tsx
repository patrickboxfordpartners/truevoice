import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Check, Minus, ArrowRight, Loader2, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import { useBilling } from "@/hooks/useBilling";
import { plans as planDefs } from "@/lib/plans";

const plans = planDefs.map((p) => ({
  name: p.name,
  description: p.description,
  monthly: p.monthlyPrice,
  annual: p.annualMonthly,
  annualTotal: p.annualPrice,
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

type Cell = boolean | string;
type ComparisonGroup = { name: string; rows: { feature: string; starter: Cell; pro: Cell; scale: Cell }[] };

const comparison: ComparisonGroup[] = [
  {
    name: "Audio Analysis",
    rows: [
      { feature: "Speech pattern scoring", starter: true, pro: true, scale: true },
      { feature: "Response timing analysis", starter: true, pro: true, scale: true },
      { feature: "Conversational flow detection", starter: true, pro: true, scale: true },
      { feature: "Linguistic authenticity scoring", starter: true, pro: true, scale: true },
    ],
  },
  {
    name: "Browser Monitoring",
    rows: [
      { feature: "Tab & window focus monitoring", starter: true, pro: true, scale: true },
      { feature: "Clipboard paste detection", starter: true, pro: true, scale: true },
    ],
  },
  {
    name: "Video Analysis",
    rows: [
      { feature: "Webcam gaze & attention analysis", starter: false, pro: true, scale: true },
      { feature: "Screen-reading detection", starter: false, pro: true, scale: true },
      { feature: "Multi-face detection", starter: false, pro: true, scale: true },
      { feature: "Phone/device detection", starter: false, pro: true, scale: true },
      { feature: "Visual behavior timeline", starter: false, pro: true, scale: true },
    ],
  },
  {
    name: "Team & Scale",
    rows: [
      { feature: "Interviews per month", starter: "30", pro: "30", scale: "100" },
      { feature: "Team members", starter: "1", pro: "3", scale: "10" },
      { feature: "Shared dashboard", starter: false, pro: false, scale: true },
      { feature: "Team analytics", starter: false, pro: false, scale: true },
      { feature: "Bulk import (CSV)", starter: false, pro: false, scale: true },
      { feature: "API access", starter: false, pro: false, scale: true },
    ],
  },
  {
    name: "Support",
    rows: [
      { feature: "Post-interview reports", starter: true, pro: true, scale: true },
      { feature: "Email invitation templates", starter: true, pro: true, scale: true },
      { feature: "Priority support", starter: false, pro: true, scale: true },
      { feature: "Dedicated onboarding call", starter: false, pro: false, scale: true },
    ],
  },
];

function CellValue({ value, popular }: { value: Cell; popular?: boolean }) {
  if (value === true)
    return (
      <span className={[
        "inline-flex h-6 w-6 items-center justify-center rounded-full",
        popular ? "bg-accent/20" : "bg-secondary",
      ].join(" ")}>
        <Check size={13} className={popular ? "text-accent" : "text-muted-foreground"} />
      </span>
    );
  if (value === false)
    return <Minus size={15} className="text-muted-foreground/30" />;
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-[15px] font-medium text-foreground">{q}</span>
        <ChevronDown
          size={16}
          className={["shrink-0 text-muted-foreground transition-transform duration-200", open ? "rotate-180" : ""].join(" ")}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
      )}
    </div>
  );
}

const Pricing = () => {
  const [annual, setAnnual] = useState(false);
  const { startCheckout, loading } = useBilling();
  const { setTheme } = useTheme();
  useEffect(() => { setTheme("light"); }, [setTheme]);

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
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-2 py-1.5 text-sm">
          <button
            onClick={() => setAnnual(false)}
            className={[
              "rounded-full px-5 py-2 font-semibold transition-all duration-200",
              !annual ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={[
              "rounded-full px-5 py-2 font-semibold transition-all duration-200",
              annual ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Annual
          </button>
          {annual && (
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
              Save 20%
            </span>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <section className="px-4 sm:px-6 pb-24 sm:pb-32">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={[
                "relative flex flex-col h-full px-6 sm:px-8 py-8 sm:py-10 bg-card rounded-2xl border",
                plan.popular
                  ? "border-accent shadow-lg shadow-accent/10 ring-1 ring-accent/20"
                  : "border-border hover:border-accent/40 transition-colors",
              ].join(" ")}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                </div>
              )}

              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="text-sm mt-1 text-muted-foreground">{plan.description}</p>

              <div className="mt-6 mb-1">
                <span className="text-5xl font-bold tracking-tight text-foreground">
                  ${annual ? plan.annual : plan.monthly}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {annual ? `Billed $${plan.annualTotal}/yr · ` : ""}{plan.interviews}
              </p>

              <div className="mt-8">
                <Button
                  size="lg"
                  disabled={loading}
                  onClick={() => startCheckout(annual ? plan.priceIds.yearly : plan.priceIds.monthly)}
                  className={[
                    "w-full h-12 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated",
                    plan.popular
                      ? "bg-accent text-white hover:bg-accent/85"
                      : "bg-foreground text-background hover:bg-foreground/85",
                  ].join(" ")}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose plan"}
                </Button>
              </div>

              <div className="h-px bg-border mt-8 mb-8" />

              <ul className="space-y-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check size={15} className={["mt-0.5 shrink-0", plan.popular ? "text-accent" : "text-muted-foreground"].join(" ")} />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Prices in USD. Taxes calculated at checkout.
        </p>
      </section>

      {/* Comparison table */}
      <section className="border-t border-border px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Compare every detail
            </h2>
            <p className="mt-3 text-muted-foreground">
              A side-by-side look at what's included on each plan.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Features</th>
                    {plans.map((p) => (
                      <th key={p.name} className={["px-6 py-4 text-left text-sm font-semibold", p.popular ? "text-accent" : "text-foreground"].join(" ")}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((group) => (
                    <>
                      <tr key={group.name}>
                        <td colSpan={4} className="border-t border-border bg-secondary/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.name}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.feature} className="border-t border-border">
                          <td className="px-6 py-4 text-sm text-foreground/80">{row.feature}</td>
                          <td className="px-6 py-4"><CellValue value={row.starter} /></td>
                          <td className="px-6 py-4 bg-accent/5"><CellValue value={row.pro} popular /></td>
                          <td className="px-6 py-4"><CellValue value={row.scale} /></td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-4 md:sticky md:top-28 md:self-start text-center md:text-left">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Support</p>
              <h2 className="text-3xl font-bold text-foreground mb-4">Frequently asked questions</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Can't find what you're looking for?{" "}
                <a href="mailto:hello@truevoicehq.com" className="text-accent hover:underline transition-colors">
                  Reach out
                </a>{" "}
                and we'll get back to you.
              </p>
            </div>
            <div className="md:col-span-8 rounded-2xl border border-border bg-card px-6">
              {faqs.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-4 sm:px-6 pb-24 sm:pb-32">
        <div className="max-w-5xl mx-auto overflow-hidden rounded-3xl border border-accent/20 bg-accent/5 px-8 py-16 text-center md:px-16 md:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Ready to protect your process?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Set up in minutes. No credit card required to start. Cancel anytime.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              disabled={loading}
              onClick={() => startCheckout(plans[1].priceIds.monthly)}
              className="bg-accent text-white hover:bg-accent/85 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get started with Pro"}
              {!loading && <ArrowRight size={16} className="ml-2" />}
            </Button>
            <a
              href="mailto:hello@truevoicehq.com?subject=Scale%20Plan%20Inquiry"
              className="rounded-lg border-2 border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent/60 hover:bg-accent/10"
            >
              Contact sales
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
