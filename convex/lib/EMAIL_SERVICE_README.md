# Multi-Provider Email Service

Joan's deadline reminder system supports 4 email providers:
- **Postmark** (transactional email specialist)
- **Resend** (modern, developer-friendly)
- **SendGrid** (enterprise-grade, high volume)
- **Mailgun** (developer-friendly, powerful)

## Configuration

Set environment variables in Convex dashboard:

### 1. Choose Provider

```bash
EMAIL_PROVIDER=postmark  # or: resend, sendgrid, mailgun
```

### 2. Postmark

```bash
POSTMARK_API_KEY=your-server-token
POSTMARK_FROM_EMAIL=joan@yourdomain.com  # Optional, defaults to joan@truevoice.ai
```

Get your API key: https://account.postmarkapp.com/servers/

### 3. Resend

```bash
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=joan@yourdomain.com  # Optional
```

Get your API key: https://resend.com/api-keys

### 4. SendGrid

```bash
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=joan@yourdomain.com  # Optional
```

Get your API key: https://app.sendgrid.com/settings/api_keys

### 5. Mailgun

```bash
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=yourdomain.com  # Your verified domain
MAILGUN_FROM_EMAIL=joan@yourdomain.com  # Optional
```

Get your API key: https://app.mailgun.com/app/account/security/api_keys

## Setting Environment Variables

**Development:**
```bash
npx convex env set EMAIL_PROVIDER postmark
npx convex env set POSTMARK_API_KEY your-key-here
```

**Production:**
```bash
npx convex env set EMAIL_PROVIDER postmark --prod
npx convex env set POSTMARK_API_KEY your-key-here --prod
```

## For Customers (Multi-Tenant)

Customers can choose their own provider by setting environment variables in their Convex deployment:

1. Go to Convex Dashboard
2. Select your deployment
3. Settings → Environment Variables
4. Add `EMAIL_PROVIDER` + provider-specific keys
5. Redeploy

No code changes needed - the service auto-detects the provider.

## Testing

Test email delivery with:

```typescript
import { sendEmail } from "./convex/lib/emailService";

const result = await sendEmail({
  to: "test@example.com",
  subject: "Test Email",
  body: "This is a test from Joan",
});

console.log(result);
// { success: true, messageId: "..." }
```

## Error Handling

All providers return consistent error format:

```typescript
{
  success: false,
  error: "POSTMARK_API_KEY not configured"
}
```

Joan logs all email failures to the activity log with full error details.

## Provider Comparison

| Provider  | Best For | Pricing | Setup Complexity |
|-----------|----------|---------|------------------|
| Postmark  | Transactional emails, deliverability | $15/mo for 10k | Easy |
| Resend    | Modern API, developer experience | $20/mo for 50k | Very Easy |
| SendGrid  | High volume, enterprise features | $20/mo for 100k | Medium |
| Mailgun   | Flexibility, international | $35/mo for 50k | Medium |

## Production Checklist

- [ ] Email provider configured
- [ ] API key added to Convex environment
- [ ] From email verified (DKIM/SPF/DMARC)
- [ ] Test reminder sent successfully
- [ ] Error logging to Joan activity working
- [ ] Cron job enabled (runs hourly)

## Customer Setup Guide

For customers using TrueVoice with their own email:

1. **Postmark** (Recommended)
   - Sign up at postmarkapp.com
   - Verify domain with DNS records
   - Create server, copy API token
   - Set `EMAIL_PROVIDER=postmark` and `POSTMARK_API_KEY`

2. **Resend**
   - Sign up at resend.com
   - Verify domain
   - Generate API key
   - Set `EMAIL_PROVIDER=resend` and `RESEND_API_KEY`

3. **Already have SendGrid/Mailgun?**
   - Use existing API keys
   - Set `EMAIL_PROVIDER` to match
   - Add domain-specific keys
