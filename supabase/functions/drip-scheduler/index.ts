import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify cron secret
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || authHeader !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let day3Sent = 0;
  let day7Sent = 0;
  let errors = 0;

  // Helper: call send-drip-email for a profile and update the sent timestamp
  async function sendDrip(
    profileId: string,
    sequence: "day3" | "day7",
    timestampColumn: "drip_day3_sent_at" | "drip_day7_sent_at",
  ): Promise<boolean> {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-drip-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ userId: profileId, sequence }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`[drip-scheduler] send-drip-email failed for ${profileId} (${sequence}): ${res.status} ${text}`);
        return false;
      }

      // Mark as sent
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ [timestampColumn]: new Date().toISOString() })
        .eq("id", profileId);

      if (updateError) {
        console.error(`[drip-scheduler] Failed to update ${timestampColumn} for ${profileId}:`, updateError);
        return false;
      }

      return true;
    } catch (err) {
      console.error(`[drip-scheduler] Exception sending ${sequence} to ${profileId}:`, err);
      return false;
    }
  }

  // Day-3: created_at between 3-4 days ago, drip_day3_sent_at IS NULL, active subscription
  const now = new Date();
  const day3Start = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const day3End = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: day3Profiles, error: day3Error } = await supabase
    .from("profiles")
    .select("id, companies!inner(subscription_status)")
    .gte("created_at", day3Start)
    .lt("created_at", day3End)
    .is("drip_day3_sent_at", null)
    .eq("companies.subscription_status", "active");

  if (day3Error) {
    console.error("[drip-scheduler] Error querying day-3 profiles:", day3Error);
    errors++;
  } else if (day3Profiles) {
    for (const profile of day3Profiles) {
      const ok = await sendDrip(profile.id, "day3", "drip_day3_sent_at");
      if (ok) {
        day3Sent++;
        console.log(`[drip-scheduler] day3 sent to profile ${profile.id}`);
      } else {
        errors++;
      }
    }
  }

  // Day-7: created_at between 7-8 days ago, drip_day7_sent_at IS NULL, active subscription
  const day7Start = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const day7End = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: day7Profiles, error: day7Error } = await supabase
    .from("profiles")
    .select("id, companies!inner(subscription_status)")
    .gte("created_at", day7Start)
    .lt("created_at", day7End)
    .is("drip_day7_sent_at", null)
    .eq("companies.subscription_status", "active");

  if (day7Error) {
    console.error("[drip-scheduler] Error querying day-7 profiles:", day7Error);
    errors++;
  } else if (day7Profiles) {
    for (const profile of day7Profiles) {
      const ok = await sendDrip(profile.id, "day7", "drip_day7_sent_at");
      if (ok) {
        day7Sent++;
        console.log(`[drip-scheduler] day7 sent to profile ${profile.id}`);
      } else {
        errors++;
      }
    }
  }

  const summary = { day3Sent, day7Sent, errors };
  console.log("[drip-scheduler] Complete:", summary);

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
