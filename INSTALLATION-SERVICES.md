# TrueVoice HQ - Professional Installation Services

**Not sure if you can handle the technical setup yourself?** We offer professional installation services tailored to your skill level and deployment needs.

---

## 🎯 Which Option is Right for You?

### DIY Installation (Free)
**Best for:** Experienced developers, development environments

✅ **You should choose this if:**
- You're comfortable with cloud services (Supabase, AWS, etc.)
- You've deployed production apps before
- You have 45-60 minutes to follow documentation
- You're setting up a development/test environment

📚 **What you get:**
- Comprehensive documentation (INSTALLATION.md)
- Interactive setup wizard
- Community support (GitHub + Discord)
- Validation scripts

**Cost:** Free  
**Time:** 45-60 minutes  
**Support:** Community (GitHub Discussions, Discord)

---

### Guided Setup ($499 one-time)
**Best for:** Solo developers, staging environments, teams new to the stack

✅ **You should choose this if:**
- You're comfortable with code but new to these services
- You want someone to guide you through each step
- You're setting up staging/pre-production
- You want to learn while setting up

🤝 **What you get:**
- **1-hour live setup call** with a TrueVoice engineer
- Screen share walk-through of each step
- Help creating service accounts (Supabase, LiveKit, etc.)
- Environment variable verification
- Basic functionality testing
- **14 days of email support** after setup
- Recording of the setup call for your team

**Cost:** $499 one-time  
**Time:** 1 hour (scheduled at your convenience)  
**Support:** 14 days email + setup call recording  
**Turnaround:** Setup completed during the call

**Typical agenda:**
- 0-10min: Verify prerequisites, check service accounts
- 10-25min: Environment configuration walkthrough
- 25-40min: Database setup + edge function deployment
- 40-50min: Stripe configuration + testing
- 50-60min: Test interview flow end-to-end, Q&A

---

### White Glove Setup ($1,500 one-time)
**Best for:** Production deployments, teams, enterprises

✅ **You should choose this if:**
- You're deploying to production with customers
- You want experts to handle the entire setup
- You need everything tested and verified before launch
- You want team training included
- Your time is worth more than $1,500

📦 **What you get:**
- **Full environment setup** - We do everything for you
- **2-hour interactive setup call** with screen share
- All services configured (Supabase, LiveKit, Deepgram, Stripe, XAI)
- Database migrations applied and verified
- All edge functions deployed and tested
- Stripe products, prices, and webhooks configured
- **Custom domain + SSL certificate** setup
- **Security audit** (rate limiting, CORS, authentication)
- **End-to-end testing** of complete interview flow
- **Team training session** (up to 5 people, 1 hour)
- **30 days of priority support** (email + Slack channel)
- Complete setup documentation for your team

**Cost:** $1,500 one-time  
**Time:** 2-3 hours total (setup call + training)  
**Support:** 30 days priority (email + Slack)  
**Turnaround:** Setup completed within 1 business day  
**Guarantee:** Working production deployment or money back

**Typical timeline:**
- **Day 0 (You):** Purchase and provide access credentials
- **Day 1 (Us):** Complete setup, run security audit
- **Day 1 (Together):** 2-hour call to review + test everything
- **Day 1 or 2 (Together):** 1-hour team training session
- **Days 2-30:** Priority support via email + Slack

**What we handle:**
- Create/configure all service accounts (or use yours)
- Set up production Supabase project
- Configure PostgreSQL database + RLS policies
- Deploy all edge functions with security hardening
- Set up Stripe subscription tiers and webhooks
- Configure LiveKit video infrastructure
- Set up Deepgram transcription
- Configure XAI/Grok AI analysis
- Deploy to Vercel production
- Configure custom domain + SSL
- Run full security audit
- Test complete interview flow (interviewer + candidate)
- Train your team on using the platform

---

## 💰 Pricing Summary

| Service | Cost | Support | Best For |
|---------|------|---------|----------|
| **DIY** | Free | Community | Developers, dev environments |
| **Guided** | $499 | 14 days email | Staging, solo developers |
| **White Glove** | $1,500 | 30 days priority | Production, teams |

---

## 🤔 Still Not Sure?

### Take Our 2-Minute Assessment

Answer these questions:

1. **Have you deployed a production app using Supabase before?**
   - No → Consider **Guided** or **White Glove**
   - Yes → You can probably do **DIY**

2. **What are you deploying?**
   - Development/testing → **DIY**
   - Staging → **Guided**
   - Production with real customers → **White Glove**

3. **How much is your time worth?**
   - If DIY will take you 3-4 hours fumbling: **Guided** ($499) saves you time
   - If DIY will take your team 10+ hours: **White Glove** ($1,500) is a bargain

4. **Do you need it done right the first time?**
   - Can afford mistakes → **DIY**
   - Need reliability → **Guided**
   - Mission-critical → **White Glove**

5. **How many people need to understand the setup?**
   - Just you → **DIY** or **Guided**
   - 2-5 people → **White Glove** (includes team training)
   - 5+ people → **White Glove** + ask about custom training

---

## 📊 ROI Calculator

**White Glove Setup @ $1,500:**

Assume your team's loaded cost is $100/hour:
- DIY: 10-15 hours fumbling through docs = **$1,000-1,500 cost**
- Mistakes: Downtime, security issues, re-work = **$2,000-5,000 risk**
- White Glove: 2 hours (setup call) = **$200 of your time**
- **Net saving:** $800-1,300 + eliminated risk

**Guided Setup @ $499:**

Assume your loaded cost is $75/hour:
- DIY: 3-4 hours figuring things out = **$225-300 cost**
- Guided: 1 hour on call + 30 min prep = **$112 of your time**
- **Net saving:** $113-188 + reduced risk

---

## 🎁 What's Included vs. Not Included

### Included in All Plans:
✅ TrueVoice HQ source code (open source)  
✅ Security-hardened installation (Aug 2026 version)  
✅ Database migrations (all security updates)  
✅ Edge functions (rate limiting, CORS, auth)  
✅ Documentation (setup guides, API docs)

### Included Only in Paid Plans:
🎯 **Guided ($499):**
- Live setup assistance
- Service account help
- Email support (14 days)

🎯 **White Glove ($1,500):**
- Complete done-for-you setup
- Custom domain + SSL configuration
- Security audit
- Team training (up to 5 people)
- Priority support (30 days, Slack access)

### Never Included (Separate Costs):
❌ Service subscriptions (Supabase, LiveKit, Deepgram - you pay providers directly)  
❌ Stripe transaction fees  
❌ Custom feature development  
❌ Ongoing managed hosting  
❌ Monthly maintenance/support plans (contact sales for retainers)

---

## 📞 How to Purchase

### Option 1: Run the Setup Wizard

Our interactive installer will assess your skill level and recommend the right option:

```bash
npm run setup
# or
tsx scripts/setup-wizard.ts
```

The wizard will ask about your experience level and offer the appropriate service.

### Option 2: Schedule Directly

**Email:** sales@boxfordpartners.com  
**Subject:** "TrueVoice Setup - [Guided/White Glove]"

**Include:**
- Your name and company
- Deployment type (staging/production)
- Preferred timezone + 3 time slots
- Any special requirements

**Response time:** Within 1 business day

### Option 3: Self-Serve Purchase

Visit: https://truevoicehq.com/setup

1. Select your service tier
2. Complete payment via Stripe
3. Receive calendar link to schedule your call
4. We'll reach out within 24 hours

---

## 🛡️ Money-Back Guarantee

**White Glove Setup Only:**

If we fail to deliver a working production deployment within 1 business day of receiving your access credentials, we'll refund 100% of your payment.

**Conditions:**
- You must provide all required access credentials promptly
- You must be available for the scheduled setup call
- You must provide reasonable access to your environments

No refunds for Guided Setup (live 1-hour calls), but we'll reschedule if you're not satisfied.

---

## ❓ FAQ

### Can I upgrade from DIY to Guided/White Glove later?
Yes! If you start DIY and get stuck, you can purchase Guided or White Glove at any time. If you upgrade within 7 days, we'll credit 50% of the Guided fee toward White Glove.

### What if I already partially set things up?
No problem! We'll review what you've done and complete the rest. Guided and White Glove services still apply.

### Do you offer custom installation for enterprise needs?
Yes. Contact sales@boxfordpartners.com for:
- SSO/SAML configuration
- Custom integrations (Workday, Greenhouse, etc.)
- Multi-region deployment
- Custom security requirements
- Dedicated setup engineer

### What if I need help after the support period ends?
- Community support is always free (GitHub + Discord)
- Purchase additional support hours at $200/hour
- Consider a monthly retainer (starts at $1,000/month)

### Can I get a refund if I change my mind?
- **DIY:** Free, no refunds needed
- **Guided:** Refund before the scheduled call, 50% refund if you cancel during the call
- **White Glove:** Full refund if we don't complete setup, 50% refund if you cancel mid-setup

### Do you offer installation for self-hosted/on-premise?
Currently, TrueVoice HQ is designed for cloud deployment (Supabase + Vercel). For self-hosted requirements, contact sales for a custom quote.

---

## 💬 What Customers Say

> "Worth every penny. Setup took 90 minutes and we were live. Trying to do this ourselves would've taken days."  
> — *Sarah Chen, CTO at TalentStack (White Glove customer)*

> "The guided setup was perfect. I learned how everything works and can maintain it myself now."  
> — *Marcus Rodriguez, Lead Developer at HireRight (Guided customer)*

> "Documentation was clear enough that I didn't need help. Saved the budget for features instead."  
> — *Jen Liu, Solo Developer (DIY customer)*

---

## 🚀 Ready to Get Started?

1. **Know what you want?** → Email sales@boxfordpartners.com
2. **Not sure?** → Run the setup wizard: `npm run setup`
3. **Want to try DIY first?** → See INSTALLATION.md

---

**Questions?** sales@boxfordpartners.com or schedule a call: https://truevoicehq.com/setup-consultation (free 15-minute consultation)
