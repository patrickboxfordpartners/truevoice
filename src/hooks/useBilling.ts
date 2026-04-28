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
      console.log("[useBilling] Session check:", { hasSession: !!session, userId: session?.user?.id });

      if (!session) {
        console.log("[useBilling] No session found, redirecting to login");
        window.location.href = `/login?redirect=${encodeURIComponent(`/pricing?plan=${priceId}`)}`;
        return;
      }

      console.log("[useBilling] Calling stripe-checkout Edge Function with priceId:", priceId);

      // Get access token and explicitly pass it
      const accessToken = session.access_token;
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error("[useBilling] Supabase function error:", error);
        throw error;
      }
      if (data?.error) {
        console.error("[useBilling] Edge function returned error:", data.error);
        throw new Error(data.error);
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("[useBilling] No checkout URL returned:", data);
        throw new Error("No checkout URL returned from server");
      }
    } catch (err: any) {
      console.error("[useBilling] Full checkout error:", err);
      toast({
        title: "Checkout failed",
        description: err.message || err.msg || "Unable to start checkout. Please try again.",
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
