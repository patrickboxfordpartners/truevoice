import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with interview analytics",
    features: [
      "3 interviews per month",
      "Full scoring features",
      "Basic email support",
      "Reports stored for 30 days",
    ],
    cta: "Start Free",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    annual: "$470/year",
    description: "For growing hiring teams",
    features: [
      "Unlimited interviews",
      "Full analysis features",
      "PDF report export",
      "90-day report retention",
      "Priority email support",
    ],
    cta: "Start Free Trial",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Team",
    price: "$149",
    period: "/month",
    annual: "$1,430/year",
    description: "Collaborate across your org",
    features: [
      "Everything in Professional",
      "Up to 5 team members",
      "Shared interview dashboard",
      "Team analytics",
      "Video onboarding call",
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large-scale hiring operations",
    features: [
      "Everything in Team",
      "Unlimited team members",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "Custom contract & invoicing",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
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
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Start free and scale as your hiring grows. No hidden fees.
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative glass-card rounded-2xl p-6 flex flex-col ${tier.popular ? "ring-2 ring-primary" : ""}`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">
                  {tier.price === "Custom"
                    ? "Custom"
                    : annual && tier.annual
                    ? `$${Math.round(parseInt(tier.annual.replace(/[^0-9]/g, "")) / 12)}`
                    : tier.price}
                </span>
                {tier.price !== "Custom" && tier.price !== "$0" && (
                  <span className="text-muted-foreground text-sm">/month</span>
                )}
                {annual && tier.annual && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed {tier.annual} annually
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={tier.variant} className={`w-full gap-2 ${tier.popular ? "" : ""}`}>
                {tier.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
