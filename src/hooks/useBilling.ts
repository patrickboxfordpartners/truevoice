import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useBilling() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function startCheckout(priceId: string) {
    if (!priceId) {
      toast({ title: "Configuration error", description: "Price ID not configured.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Redirect to sign up, then back to pricing
        window.location.href = `/signup?redirect=${encodeURIComponent(`/pricing?plan=${priceId}`)}`;
        return;
      }

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("[useBilling] checkout error:", err);
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
      const { data, error } = await supabase.functions.invoke("stripe-portal", {
        body: { returnUrl: `${window.location.origin}/settings` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("[useBilling] portal error:", err);
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
