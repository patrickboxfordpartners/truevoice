# TrueVoice HQ - Complete Installation Guide

**Version:** 2.0 (August 2026 - Security Hardened)  
**Estimated Setup Time:** 45-60 minutes  
**Skill Level:** Intermediate developer with cloud service experience

---

## Prerequisites

Before starting, create accounts and gather credentials for:

### Required Services

1. **Supabase** (Database + Auth + Edge Functions)
   - Create project: https://supabase.com/dashboard
   - Choose region closest to your users
   - Save: Project URL, Anon Key, Service Role Key

2. **LiveKit** (Video Infrastructure)
   - Create project: https://cloud.livekit.io/
   - Save: API Key, API Secret, WebSocket URL

3. **Deepgram** (Speech-to-Text)
   - Create account: https://console.deepgram.com/
   - Create API key with "usage:write" scope
   - Save: API Key

4. **XAI/Grok** (AI Analysis)
   - Get API access: https://x.ai/
   - Generate API key
   - Save: API Key

5. **Stripe** (Payments)
   - Create account: https://dashboard.stripe.com/
   - Get test keys first, then live keys
   - Save: Secret Key, Publishable Key, Webhook Secret

6. **Vercel** (Frontend Hosting - Optional)
   - Create account: https://vercel.com/
   - Connect GitHub repository

### Local Tools

- **Node.js** 18+ or **Bun** runtime
- **Git** for version control
- **Supabase CLI**: `npm install -g supabase`

---

## Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/patrickboxfordpartners/true-voice-insights.git
cd true-voice-insights

# Install dependencies
npm install
# or if using Bun
bun install
```

---

## Step 2: Environment Configuration

### Frontend Environment (`.env.local`)

Copy the example and fill in values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase (from Supabase Dashboard → Settings → API)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key

# LiveKit (frontend only needs WebSocket URL)
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud

# Stripe (frontend only needs publishable key)
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs (will be generated in Step 5)
VITE_STRIPE_PRICE_STARTER_MONTHLY=price_...
VITE_STRIPE_PRICE_STARTER_YEARLY=price_...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_...
VITE_STRIPE_PRICE_PRO_YEARLY=price_...
VITE_STRIPE_PRICE_SCALE_MONTHLY=price_...
VITE_STRIPE_PRICE_SCALE_YEARLY=price_...

# Site URL
VITE_SITE_URL=http://localhost:5173
```

### Supabase Secrets (Backend)

Set these in Supabase Dashboard → Settings → Edge Functions → Manage Secrets:

```bash
# Or via CLI after linking project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set DEEPGRAM_API_KEY="your-deepgram-key"
supabase secrets set LIVEKIT_API_KEY="your-livekit-api-key"
supabase secrets set LIVEKIT_API_SECRET="your-livekit-api-secret"
supabase secrets set LIVEKIT_URL="wss://your-project.livekit.cloud"
supabase secrets set XAI_API_KEY="your-xai-key"
supabase secrets set STRIPE_SECRET_KEY="sk_test_..."
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
supabase secrets set SITE_URL="https://yourdomain.com"
```

---

## Step 3: Database Setup

### 3.1 Link Supabase Project

```bash
supabase link --project-ref your-project-ref
```

### 3.2 Apply Database Migrations

```bash
# Push all migrations to Supabase
supabase db push
```

This will create:
- Core tables (companies, profiles, interviews, candidates)
- Security tables (rate_limit_log, audit_log, report_tokens)
- Performance indexes
- Row Level Security policies

### 3.3 Verify Database

```bash
# Check migrations applied
supabase db remote list

# Should show:
# - 20260422_api_keys.sql
# - 20260422_candidates.sql
# - 20260422_panel_interviews.sql
# - 20260707_report_tokens.sql
# - 20260813_rate_limiting.sql
# - 20260813_security_indexes.sql
# - 20260813_report_token_expiration.sql
# - 20260813_audit_log.sql
```

---

## Step 4: Deploy Edge Functions

### 4.1 Deploy All Functions

```bash
# Deploy all edge functions at once
supabase functions deploy --all
```

This deploys:
- `deepgram-token` - Secure transcription token generation
- `livekit-token` - Video room access tokens
- `analyze-chunk` - Real-time interview analysis
- `analyze-frame` - Video frame analysis
- `generate-final-report` - Report generation
- `api-create-interview` - Interview creation API
- `get-public-report` - Public report sharing
- `stripe-checkout` - Payment checkout
- `stripe-webhook` - Payment webhooks
- `stripe-portal` - Customer portal
- And more...

### 4.2 Verify Deployment

```bash
# List deployed functions
supabase functions list

# Should show all functions with status: ACTIVE
```

---

## Step 5: Stripe Setup

### 5.1 Create Products & Prices

Run the automated setup script:

```bash
npm run stripe:setup
# or
tsx scripts/stripe-setup.ts
```

This creates:
- 3 Products: Starter, Pro, Scale
- 6 Prices: Monthly and yearly for each tier
- Outputs price IDs to add to `.env.local`

### 5.2 Add Price IDs to Environment

Copy the generated price IDs into your `.env.local`:

```env
VITE_STRIPE_PRICE_STARTER_MONTHLY=price_1ABC...
VITE_STRIPE_PRICE_STARTER_YEARLY=price_1DEF...
# ... etc
```

### 5.3 Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret
5. Add to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

---

## Step 6: Development Testing

### 6.1 Start Dev Server

```bash
npm run dev
# or
bun dev
```

App runs at `http://localhost:5173`

### 6.2 Test Key Flows

**1. Authentication**
- Navigate to `/login`
- Sign up with email
- Verify you can log in

**2. Company Setup**
- After signup, you should auto-create a company
- Check Supabase Dashboard → Table Editor → companies
- Verify your company exists

**3. Create Interview**
- Dashboard → Create Interview
- Fill in candidate details
- Copy interview link

**4. Test Video Room (requires 2 browsers)**
- Browser 1: Join as host (requires auth)
- Browser 2: Join with candidate link
- Verify video/audio works
- Check transcription appears

**5. Test Payment Flow**
- Settings → Upgrade Plan
- Use Stripe test card: `4242 4242 4242 4242`
- Verify redirect after payment

---

## Step 7: Production Deployment

### 7.1 Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect via Vercel Dashboard:
1. Import Git repository
2. Framework: Vite
3. Add environment variables from `.env.local`
4. Deploy

### 7.2 Configure Custom Domain

In Vercel Dashboard:
1. Settings → Domains
2. Add: `yourdomain.com`
3. Configure DNS records as shown

### 7.3 Update Environment for Production

Update Supabase secrets with production values:

```bash
supabase secrets set SITE_URL="https://yourdomain.com"
supabase secrets set STRIPE_SECRET_KEY="sk_live_..."
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..." # from production webhook
```

Update `.env.local` → `.env.production`:
- Use live Stripe keys
- Update VITE_SITE_URL

### 7.4 Update Stripe Webhook for Production

1. Stripe Dashboard → Webhooks
2. Add new endpoint: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
3. Same events as before
4. Get new webhook secret
5. Update Supabase secret

---

## Step 8: Security Verification

### 8.1 Test Rate Limiting

```bash
# Hit an endpoint 25 times rapidly
for i in {1..25}; do
  curl https://yourdomain.com/api/livekit-token
done

# Should get 429 after ~20 requests
```

### 8.2 Test CORS Protection

```bash
# Try from unauthorized origin
curl -H "Origin: https://evil.com" \
  https://your-project-ref.supabase.co/functions/v1/livekit-token

# Should not return Access-Control-Allow-Origin: evil.com
```

### 8.3 Test Authentication

```bash
# Try to get LiveKit token without auth
curl -X POST https://your-project-ref.supabase.co/functions/v1/livekit-token \
  -H "Content-Type: application/json" \
  -d '{"room_name":"test","participant_name":"Attacker","is_host":true}'

# Should return 401 Unauthorized
```

### 8.4 Check Audit Logs

```sql
-- In Supabase SQL Editor
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;
```

---

## Step 9: Monitoring Setup

### 9.1 Supabase Monitoring

Dashboard → Project → Database:
- Monitor CPU/Memory usage
- Check connection count
- Review slow queries

### 9.2 Edge Function Logs

```bash
# Watch logs in real-time
supabase functions logs deepgram-token --tail
supabase functions logs livekit-token --tail
supabase functions logs analyze-chunk --tail
```

### 9.3 Rate Limit Monitoring

```sql
-- Check rate limit violations
SELECT 
  key,
  COUNT(*) as hits,
  MAX(created_at) as last_hit
FROM rate_limit_log
WHERE created_at > now() - interval '1 hour'
GROUP BY key
HAVING COUNT(*) > 100
ORDER BY hits DESC;
```

---

## Step 10: Optional Enhancements

### 10.1 PostHog Analytics

1. Create PostHog account
2. Add to `.env.local`:
   ```env
   VITE_POSTHOG_KEY=your-posthog-key
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```

### 10.2 Email Provider (for drip campaigns)

Currently uses Postmark. To configure:
1. Create Postmark account
2. Add sender signature
3. Add to Supabase secrets:
   ```bash
   supabase secrets set POSTMARK_API_KEY="your-key"
   ```

### 10.3 Custom Branding

See `BRANDING.md` for logo, colors, and theme customization.

---

## Troubleshooting

### Database Connection Errors

```bash
# Reset connection pooler
supabase db reset

# Check connection string
supabase status
```

### Edge Function Errors

```bash
# Check function logs
supabase functions logs <function-name>

# Verify secrets are set
supabase secrets list
```

### Authentication Issues

Check Supabase Dashboard → Authentication → Policies:
- RLS should be enabled on all tables
- Policies should allow authenticated users

### Video Not Working

1. Check LiveKit credentials in Supabase secrets
2. Verify CORS allows your domain
3. Check browser console for WebSocket errors
4. Test with: https://livekit.io/webrtc-test

### Transcription Not Working

1. Verify Deepgram secret is set in Supabase
2. Check edge function logs:
   ```bash
   supabase functions logs deepgram-token
   ```
3. Verify token generation in browser console

---

## Security Checklist

Before going live, verify:

- [ ] All API keys are in Supabase secrets (not `.env.local`)
- [ ] Row Level Security enabled on all tables
- [ ] CORS restricted to your domain
- [ ] Rate limiting active (test it)
- [ ] Stripe webhook signatures verified
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] Database backups configured (Supabase does this automatically)
- [ ] Audit logging working
- [ ] Report tokens expire after 30 days

---

## Cost Estimates (Monthly)

**Free Tier:**
- Supabase: Free (500MB DB, 2GB bandwidth)
- LiveKit: Free (10,000 minutes)
- Deepgram: Free (45,000 minutes transcription)
- Vercel: Free (100GB bandwidth)
- **Total:** $0/mo for development

**Production (Low Volume - 100 interviews/mo):**
- Supabase Pro: $25
- LiveKit: ~$40 (4,000 minutes video)
- Deepgram: ~$30 (2,000 minutes transcription)
- XAI Grok: ~$10
- Stripe: ~2.9% + $0.30 per transaction
- Vercel Pro: $20
- **Total:** ~$125/mo + transaction fees

**Production (High Volume - 1,000 interviews/mo):**
- Supabase Pro: $25
- LiveKit: ~$400 (40,000 minutes)
- Deepgram: ~$300 (20,000 minutes)
- XAI Grok: ~$100
- Stripe: 2.9% + $0.30 per transaction
- Vercel Pro: $20
- **Total:** ~$845/mo + transaction fees

---

## Getting Help

**Documentation:**
- `SECURITY-FIXES-2026-08-13.md` - Security details
- `DEPLOY-SECURITY-FIXES.md` - Deployment guide
- `BRANDING.md` - Design guidelines
- `PRODUCT.md` - Feature specifications

**Support:**
- GitHub Issues: https://github.com/patrickboxfordpartners/true-voice-insights/issues
- Email: patrick@boxfordpartners.com

**Common Resources:**
- Supabase Docs: https://supabase.com/docs
- LiveKit Docs: https://docs.livekit.io/
- Deepgram Docs: https://developers.deepgram.com/
- Stripe Docs: https://stripe.com/docs

---

## Next Steps After Installation

1. **Customize Branding** - Update colors, logo, company name
2. **Configure Email Templates** - Customize interview invites
3. **Set Up Team Members** - Invite other interviewers
4. **Create Interview Templates** - Set up question sets
5. **Test End-to-End** - Run a full mock interview
6. **Go Live** - Share with your first real candidate!

---

**Installation Complete! 🎉**

Your TrueVoice HQ instance is now fully configured and secure.
