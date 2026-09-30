"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
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
    if (!profile?.company) throw new Error("No company associated with user");

    const company = profile.company;
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: company.name ?? undefined,
        metadata: { convex_company_id: company._id },
      });
      customerId = customer.id;

      await ctx.runMutation(
        (await import("../_generated/api")).internal.users.updateCompanyStripeId as any,
        { companyId: company._id, stripeCustomerId: customerId }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      subscription_data: {
        metadata: { convex_company_id: company._id },
      },
    });

    if (!session.url) throw new Error("No checkout URL returned");
    return { url: session.url };
  },
});
