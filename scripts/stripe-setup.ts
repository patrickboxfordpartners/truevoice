/**
 * Stripe Product & Price Setup Script
 *
 * Creates TrueVoice HQ subscription products and prices in Stripe.
 * Run with: npx tsx scripts/stripe-setup.ts
 *
 * Requires STRIPE_SECRET_KEY in environment or .env file.
 */

import Stripe from "stripe";
import { config } from "dotenv";

config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is required. Set it in .env or as an environment variable.");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });

interface PlanDefinition {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

const plans: PlanDefinition[] = [
  {
    name: "Starter",
    description: "Audio-only analysis - 30 interviews/mo",
    monthlyPrice: 7900, // $79.00
    yearlyPrice: 75600, // $756.00 ($63/mo)
  },
  {
    name: "Pro",
    description: "Audio + video analysis - 30 interviews/mo",
    monthlyPrice: 14900, // $149.00
    yearlyPrice: 142800, // $1,428.00 ($119/mo)
  },
  {
    name: "Scale",
    description: "High-volume hiring - 100 interviews/mo",
    monthlyPrice: 34900, // $349.00
    yearlyPrice: 334800, // $3,348.00 ($279/mo)
  },
];

async function main() {
  console.log("Creating Stripe products and prices for TrueVoice HQ...\n");

  const envVars: Record<string, string> = {};

  for (const plan of plans) {
    const tierKey = plan.name.toUpperCase();

    // Create product
    const product = await stripe.products.create({
      name: `TrueVoice HQ ${plan.name}`,
      description: plan.description,
      metadata: {
        app: "truevoicehq",
        tier: plan.name.toLowerCase(),
      },
    });

    console.log(`Created product: ${product.name} (${product.id})`);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPrice,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: {
        app: "truevoicehq",
        tier: plan.name.toLowerCase(),
        interval: "month",
      },
    });

    console.log(`  Monthly: $${plan.monthlyPrice / 100}/mo (${monthlyPrice.id})`);
    envVars[`STRIPE_PRICE_${tierKey}_MONTHLY`] = monthlyPrice.id;

    // Create yearly price
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.yearlyPrice,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: {
        app: "truevoicehq",
        tier: plan.name.toLowerCase(),
        interval: "year",
      },
    });

    console.log(`  Yearly:  $${plan.yearlyPrice / 100}/yr (${yearlyPrice.id})\n`);
    envVars[`STRIPE_PRICE_${tierKey}_YEARLY`] = yearlyPrice.id;
  }

  console.log("========================================");
  console.log("Add these to your .env file:");
  console.log("========================================\n");

  for (const [key, value] of Object.entries(envVars)) {
    console.log(`${key}=${value}`);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
