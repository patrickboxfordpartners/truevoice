"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPortalSession = action({
  args: {
    returnUrl: v.string(),
  },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const Stripe = (await import("stripe")).default;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    const stripe = new Stripe(stripeKey);

    const profile = await ctx.runQuery(
      (await import("../_generated/api")).api.users.viewer,
      {}
    );
    if (!profile?.company?.stripe_customer_id) {
      throw new Error("No billing account found. Please subscribe first.");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.company.stripe_customer_id,
      return_url: args.returnUrl,
    });

    return { url: session.url };
  },
});
