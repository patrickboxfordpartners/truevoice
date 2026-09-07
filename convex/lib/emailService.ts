/**
 * Multi-Provider Email Service
 *
 * Supports: Postmark, Resend, SendGrid, Mailgun
 * Provider is selected via EMAIL_PROVIDER env var
 */

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  from?: string;
  html?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via configured provider
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || "postmark";

  switch (provider.toLowerCase()) {
    case "postmark":
      return await sendViaPostmark(payload);
    case "resend":
      return await sendViaResend(payload);
    case "sendgrid":
      return await sendViaSendGrid(payload);
    case "mailgun":
      return await sendViaMailgun(payload);
    default:
      return {
        success: false,
        error: `Unknown email provider: ${provider}`,
      };
  }
}

/**
 * Postmark
 * Docs: https://postmarkapp.com/developer/user-guide/send-email-with-api
 */
async function sendViaPostmark(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.POSTMARK_API_KEY;
  const fromEmail = payload.from || process.env.POSTMARK_FROM_EMAIL || "joan@truevoice.ai";

  if (!apiKey) {
    return { success: false, error: "POSTMARK_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": apiKey,
      },
      body: JSON.stringify({
        From: fromEmail,
        To: payload.to,
        Subject: payload.subject,
        TextBody: payload.body,
        HtmlBody: payload.html,
        MessageStream: "outbound",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Postmark API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.MessageID,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Resend
 * Docs: https://resend.com/docs/send-with-nodejs
 */
async function sendViaResend(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = payload.from || process.env.RESEND_FROM_EMAIL || "joan@truevoice.ai";

  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.to],
        subject: payload.subject,
        text: payload.body,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * SendGrid
 * Docs: https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */
async function sendViaSendGrid(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = payload.from || process.env.SENDGRID_FROM_EMAIL || "joan@truevoice.ai";

  if (!apiKey) {
    return { success: false, error: "SENDGRID_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: payload.to }],
            subject: payload.subject,
          },
        ],
        from: { email: fromEmail },
        content: [
          {
            type: "text/plain",
            value: payload.body,
          },
          ...(payload.html
            ? [
                {
                  type: "text/html",
                  value: payload.html,
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${error}`);
    }

    // SendGrid returns 202 Accepted with X-Message-Id header
    const messageId = response.headers.get("X-Message-Id");
    return {
      success: true,
      messageId: messageId || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Mailgun
 * Docs: https://documentation.mailgun.com/en/latest/api-sending.html#sending
 */
async function sendViaMailgun(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = payload.from || process.env.MAILGUN_FROM_EMAIL || "joan@truevoice.ai";

  if (!apiKey || !domain) {
    return { success: false, error: "MAILGUN_API_KEY or MAILGUN_DOMAIN not configured" };
  }

  try {
    // Mailgun uses form-urlencoded
    const formData = new URLSearchParams();
    formData.append("from", fromEmail);
    formData.append("to", payload.to);
    formData.append("subject", payload.subject);
    formData.append("text", payload.body);
    if (payload.html) {
      formData.append("html", payload.html);
    }

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mailgun API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
