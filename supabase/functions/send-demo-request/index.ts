import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const { name, company, role, volume, message } = await req.json()

    if (!name || !company || !role || !volume) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const postmarkKey = Deno.env.get("POSTMARK_API_KEY")
    if (!postmarkKey) {
      return new Response(JSON.stringify({ error: "POSTMARK_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const htmlBody = `
      <h2>New TrueVoice HQ Demo Request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:480px">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Company</td><td style="padding:8px 0;font-weight:600">${company}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Role</td><td style="padding:8px 0;font-weight:600">${role}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Interviews/month</td><td style="padding:8px 0;font-weight:600">${volume}</td></tr>
        ${message ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Message</td><td style="padding:8px 0">${message}</td></tr>` : ""}
      </table>
    `

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify({
        From: "hello@truevoicehq.com",
        To: "patrick@boxfordpartners.com",
        Subject: `Demo request — ${name} at ${company}`,
        HtmlBody: htmlBody,
        TextBody: `Demo request\n\nName: ${name}\nCompany: ${company}\nRole: ${role}\nInterviews/month: ${volume}${message ? `\nMessage: ${message}` : ""}`,
        MessageStream: "outbound",
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error("[send-demo-request] Postmark error:", err)
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("[send-demo-request] Error:", err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
