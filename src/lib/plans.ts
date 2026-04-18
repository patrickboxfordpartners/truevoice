/**
 * TrueVoice HQ subscription plan definitions.
 *
 * Price IDs are loaded from environment variables set after running
 * scripts/stripe-setup.ts.
 */

export interface Plan {
  key: "starter" | "pro" | "scale";
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  annualMonthly: number;
  interviews: string;
  features: string[];
  popular: boolean;
  priceIds: {
    monthly: string;
    yearly: string;
  };
}

export const plans: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    description: "Audio-only analysis",
    monthlyPrice: 79,
    annualPrice: 756,
    annualMonthly: 63,
    interviews: "30 interviews/mo",
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
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY || "",
      yearly: import.meta.env.VITE_STRIPE_PRICE_STARTER_YEARLY || "",
    },
  },
  {
    key: "pro",
    name: "Pro",
    description: "Audio + video analysis",
    monthlyPrice: 149,
    annualPrice: 1428,
    annualMonthly: 119,
    interviews: "30 interviews/mo",
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
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || "",
      yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || "",
    },
  },
  {
    key: "scale",
    name: "Scale",
    description: "High-volume hiring",
    monthlyPrice: 349,
    annualPrice: 3348,
    annualMonthly: 279,
    interviews: "100 interviews/mo",
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
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_SCALE_MONTHLY || "",
      yearly: import.meta.env.VITE_STRIPE_PRICE_SCALE_YEARLY || "",
    },
  },
];

/** Get the Stripe price ID for a plan given the billing interval. */
export function getPriceId(planKey: Plan["key"], interval: "monthly" | "yearly"): string {
  const plan = plans.find((p) => p.key === planKey);
  if (!plan) throw new Error(`Unknown plan: ${planKey}`);
  return plan.priceIds[interval];
}
