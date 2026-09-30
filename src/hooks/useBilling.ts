import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useBilling() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const checkout = useAction(api.actions.stripeCheckout.createCheckoutSession);
  const portal = useAction(api.actions.stripePortal.createPortalSession);

  async function startCheckout(priceId: string) {
    if (!priceId) {
      toast({ title: "Configuration error", description: "Price ID not configured.", variant: "destructive" });
      return;
    }

    if (!user) {
      window.location.href = `/signup?redirect=${encodeURIComponent(`/pricing?plan=${priceId}`)}`;
      return;
    }

    setLoading(true);
    try {
      const { url } = await checkout({
        priceId,
        successUrl: `${window.location.origin}/onboarding?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`,
      });
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal() {
    setLoading(true);
    try {
      const { url } = await portal({
        returnUrl: `${window.location.origin}/settings`,
      });
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Billing portal unavailable",
        description: err.message || "Unable to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return { startCheckout, openBillingPortal, loading };
}
