import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Map a Stripe price ID to a subscription tier name. */
function getTierFromPrice(priceId: string): string {
  const priceMap: Record<string, string> = {
    [Deno.env.get("STRIPE_PRICE_STARTER_MONTHLY") || ""]: "starter",
    [Deno.env.get("STRIPE_PRICE_STARTER_YEARLY") || ""]: "starter",
    [Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") || ""]: "pro",
    [Deno.env.get("STRIPE_PRICE_PRO_YEARLY") || ""]: "pro",
    [Deno.env.get("STRIPE_PRICE_SCALE_MONTHLY") || ""]: "scale",
    [Deno.env.get("STRIPE_PRICE_SCALE_YEARLY") || ""]: "scale",
  };

  return priceMap[priceId] || "starter";
}

/** Map Stripe subscription status to our status values. */
function mapSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "past_due";
    default:
      return "inactive";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Supabase admin client for database updates
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`[stripe-webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription" || !session.subscription) {
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const companyId = subscription.metadata?.supabase_company_id;
        if (!companyId) {
          console.error("[stripe-webhook] No supabase_company_id in subscription metadata");
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id || "";
        const tier = getTierFromPrice(priceId);

        const { error } = await supabase
          .from("companies")
          .update({
            subscription_tier: tier,
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
          })
          .eq("id", companyId);

        if (error) {
          console.error("[stripe-webhook] Error updating company:", error);
        } else {
          console.log(`[stripe-webhook] Company ${companyId} activated on ${tier}`);

          // Send welcome drip email to the user who made the purchase
          try {
            const clerkId = subscription.metadata?.clerkId;
            if (clerkId) {
              // Look up the profile by clerkId isn't available here — use customer email
              const customer = await stripe.customers.retrieve(session.customer as string);
              const email = (customer as any).email;
              if (email) {
                await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-drip-email`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({ companyId, sequence: "welcome" }),
                });
              }
            }
          } catch (dripErr) {
            console.error("[stripe-webhook] Drip email failed (non-fatal):", dripErr);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const companyId = subscription.metadata?.supabase_company_id;

        if (!companyId) {
          // Fall back to looking up by stripe_customer_id
          const customerId = subscription.customer as string;
          const { data: company } = await supabase
            .from("companies")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (!company) {
            console.error("[stripe-webhook] Cannot find company for customer:", customerId);
            break;
          }

          const priceId = subscription.items.data[0]?.price?.id || "";
          const tier = getTierFromPrice(priceId);
          const status = mapSubscriptionStatus(subscription.status);

          await supabase
            .from("companies")
            .update({
              subscription_tier: tier,
              subscription_status: status,
              stripe_subscription_id: subscription.id,
            })
            .eq("id", company.id);

          console.log(`[stripe-webhook] Company ${company.id} updated: ${tier} / ${status}`);
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id || "";
        const tier = getTierFromPrice(priceId);
        const status = mapSubscriptionStatus(subscription.status);

        const { error } = await supabase
          .from("companies")
          .update({
            subscription_tier: tier,
            subscription_status: status,
            stripe_subscription_id: subscription.id,
          })
          .eq("id", companyId);

        if (error) {
          console.error("[stripe-webhook] Error updating company:", error);
        } else {
          console.log(`[stripe-webhook] Company ${companyId} updated: ${tier} / ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Look up by customer ID since sub is being deleted
        const { data: company } = await supabase
          .from("companies")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!company) {
          console.error("[stripe-webhook] Cannot find company for customer:", customerId);
          break;
        }

        const { error } = await supabase
          .from("companies")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("id", company.id);

        if (error) {
          console.error("[stripe-webhook] Error downgrading company:", error);
        } else {
          console.log(`[stripe-webhook] Company ${company.id} downgraded to free`);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-webhook] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
