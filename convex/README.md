# Convex Backend — Joan AI Coordinator

This directory contains the Convex backend for TrueVoice HQ, powering Joan — the AI hiring coordinator.

## Overview

Joan automates hiring workflows through:
- **Action Item Extraction** — Extracts tasks from interview transcripts via OpenAI
- **Email Routing** — Routes incoming emails to the correct candidates via AgentMail
- **Deadline Reminders** — Sends automated reminders for upcoming deadlines
- **Pipeline Management** — Tracks candidates through hiring stages
- **Real-time Collaboration** — Powers live sessions, shared notes, and scores

## File Structure

```
convex/
├── schema.ts              # Database schema definitions
├── queries.ts             # Read operations (queries)
├── mutations.ts           # Write operations (mutations)
├── crons.ts              # Scheduled jobs (hourly deadline reminders)
├── http.ts               # HTTP endpoints (AgentMail webhook)
└── actions/
    ├── extractActionItems.ts       # OpenAI action item extraction
    ├── enrichCandidate.ts          # Firecrawl candidate enrichment
    └── sendDeadlineReminders.ts    # Automated deadline reminders
```

## Environment Variables

Set these in the [Convex Dashboard](https://dashboard.convex.dev) → Settings → Environment Variables:

### Required for Action Item Extraction
- `OPENAI_API_KEY` — OpenAI API key for GPT-4 extraction

### Required for Deadline Reminders
- `AGENTMAIL_API_URL` — AgentMail API endpoint (e.g., `https://api.agentmail.dev/send`)
- `AGENTMAIL_API_KEY` — AgentMail API key for authentication
- `AGENTMAIL_FROM_EMAIL` — Sender email address (defaults to `joan@truevoice.ai`)

### Required for Candidate Enrichment
- `FIRECRAWL_API_KEY` — Firecrawl API key for scraping LinkedIn/GitHub profiles

## Scheduled Jobs (Crons)

### Deadline Reminder Check
**Schedule:** Hourly  
**Function:** `internal.actions.sendDeadlineReminders.sendDeadlineReminders`

Automatically scans for action items due within 48 hours and sends email reminders via AgentMail.

**What it does:**
1. Queries action items with `dueDate` in the next 48 hours
2. Filters items where `reminderSent = false` and status is not completed/cancelled
3. Sends personalized reminder email to candidate via AgentMail
4. Marks `reminderSent = true` and logs activity

**Monitoring:**
Check the `joan_activity` table for logs of all reminder actions (successful and failed).

## HTTP Endpoints

### AgentMail Webhook
**Path:** `/agentmail/webhook`  
**Method:** `POST`  
**Auth:** `x-agentmail-signature` header

Receives incoming emails from AgentMail and routes them to candidates in the hiring pipeline.

**Webhook URL to configure in AgentMail:**
```
https://your-deployment.convex.site/agentmail/webhook
```

## Development

### Deploy to Convex
```bash
npx convex dev        # Development mode with hot reload
npx convex deploy     # Production deployment
```

### Test Cron Jobs Locally
```bash
npx convex run internal.actions.sendDeadlineReminders.sendDeadlineReminders
```

### View Logs
```bash
npx convex logs --tail
```

### Query Data
```bash
npx convex data      # Open database explorer
```

## Database Schema

Key tables:
- `hiring_pipeline` — Candidates moving through hiring stages
- `action_items` — Tasks extracted from transcripts (with due dates)
- `email_threads` — Email conversations routed by Joan
- `joan_activity` — Audit log of all Joan actions
- `live_sessions` — Real-time collaboration sessions
- `shared_notes` — Collaborative annotations
- `interview_scores` — Real-time authenticity scores

## Architecture Notes

### Why Convex?
- **Real-time subscriptions** — UI updates instantly when data changes
- **Serverless functions** — No infrastructure management
- **Type-safe** — TypeScript throughout the stack
- **Built-in crons** — Scheduled jobs without external services
- **ACID transactions** — Data consistency guaranteed

### Performance Considerations
- Queries use indexes (`by_company`, `by_due_date`, etc.) for fast lookups
- Deadline reminder query bounded to 48-hour window to prevent full table scans
- AgentMail webhook responds immediately (< 200ms) and processes async

### Security
- AgentMail webhook validates `x-agentmail-signature` header
- OpenAI API key stored in Convex environment (never exposed to client)
- Internal queries/actions cannot be called from client code
- All database queries respect company boundaries

## Troubleshooting

### Reminders not sending?
1. Check environment variables are set in Convex dashboard
2. Verify AgentMail API credentials are valid
3. Check `joan_activity` table for error messages
4. Run manual test: `npx convex run internal.actions.sendDeadlineReminders.sendDeadlineReminders`

### AgentMail webhook failing?
1. Verify webhook URL is configured in AgentMail dashboard
2. Check webhook signature validation in logs
3. Test webhook locally with curl:
   ```bash
   curl -X POST https://your-deployment.convex.site/agentmail/webhook \
     -H "Content-Type: application/json" \
     -H "x-agentmail-signature: test" \
     -H "x-agentmail-timestamp: $(date +%s)" \
     -d '{"from":"test@example.com","to":"joan@truevoice.ai","subject":"Test","body":"Test message"}'
   ```

### Action item extraction not working?
1. Verify `OPENAI_API_KEY` is set in Convex dashboard
2. Check OpenAI API quota and rate limits
3. Review extraction logs in `joan_activity` table
4. Test extraction manually from Convex dashboard

## Future Enhancements

Planned features:
- [ ] Smart reminder timing (send reminders based on candidate timezone)
- [ ] Reminder escalation (send multiple reminders for overdue items)
- [ ] Bulk email sending for team announcements
- [ ] Integration with calendar systems (Google Calendar, Outlook)
- [ ] SMS reminders via Twilio
- [ ] Slack notifications for urgent action items
