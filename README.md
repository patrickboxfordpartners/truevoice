# TrueVoice HQ

**AI-Powered Video Interview Analysis Platform**

TrueVoice HQ is a comprehensive video interview platform that combines real-time video conferencing with advanced AI analysis to help hiring teams conduct and evaluate interviews more effectively. Built with modern web technologies and powered by cutting-edge AI services.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

### Core Capabilities
- **Live Video Interviews** — Real-time video conferencing with LiveKit integration
- **AI-Powered Transcription** — Real-time speech-to-text using Deepgram
- **Intelligent Analysis** — Automated interview insights powered by XAI Grok
- **Multi-Role Support** — Separate experiences for interviewers and candidates
- **Team Collaboration** — Company-based access with role-based permissions
- **Automated Reporting** — AI-generated interview reports and candidate evaluations
- **Subscription Management** — Tiered pricing with Stripe integration

### Technical Features
- Real-time audio/video streaming with LiveKit
- Live transcription and sentiment analysis
- Frame-by-frame video analysis for authenticity detection
- Automated drip email campaigns for candidate follow-up
- Custom branding and theming support
- Responsive design with dark mode

## Tech Stack

### Frontend
- **React 18** — Modern UI library with hooks
- **TypeScript** — Type-safe development
- **Vite** — Fast build tooling
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — High-quality UI components
- **Radix UI** — Accessible component primitives
- **Framer Motion** — Smooth animations

### Backend & Services
- **Supabase** — PostgreSQL database, authentication, edge functions
- **LiveKit** — Real-time video/audio streaming
- **Deepgram** — Speech-to-text transcription
- **XAI Grok** — AI-powered interview analysis
- **Stripe** — Payment processing and subscriptions
- **PostHog** — Product analytics

### Key Libraries
- `@livekit/components-react` — Pre-built LiveKit UI components
- `@deepgram/sdk` — Real-time transcription
- `@supabase/supabase-js` — Database and auth client
- `@tanstack/react-query` — Data fetching and caching
- `react-router-dom` — Client-side routing
- `react-hook-form` + `zod` — Form validation

## Project Structure

```
true-voice-insights/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   ├── pages/           # Route components
│   │   ├── Dashboard.tsx
│   │   ├── InterviewRoom.tsx
│   │   ├── InterviewerRoom.tsx
│   │   ├── CandidateInterview.tsx
│   │   └── Report.tsx
│   └── types/           # TypeScript type definitions
├── supabase/
│   ├── functions/       # Edge functions
│   │   ├── analyze-chunk/
│   │   ├── analyze-frame/
│   │   ├── generate-final-report/
│   │   ├── livekit-token/
│   │   └── stripe-*/
│   └── migrations/      # Database migrations
├── scripts/             # Build and setup scripts
└── public/              # Static assets

```

## Getting Started

### Prerequisites
- **Node.js** 18+ or **Bun** runtime
- **Supabase** account and project
- **LiveKit** account and project
- **Deepgram** API key
- **Stripe** account (for billing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/patrickboxfordpartners/true-voice-insights.git
cd true-voice-insights
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Deepgram
VITE_DEEPGRAM_API_KEY=your-deepgram-api-key

# LiveKit
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Site URL
VITE_SITE_URL=http://localhost:8080
```

4. Set up the database:
```bash
# Run the schema in your Supabase SQL Editor
cat supabase-schema.sql
```

5. Deploy edge functions (optional):
```bash
supabase functions deploy
```

### Development

Start the development server:
```bash
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:8080`.

### Building for Production

```bash
npm run build
# or
bun run build
```

The built files will be in the `dist/` directory.

## Configuration

### Stripe Setup
Run the automated Stripe setup script to create products and prices:
```bash
npm run stripe:setup
# or
tsx scripts/stripe-setup.ts
```

### LiveKit Configuration
1. Create a LiveKit Cloud project
2. Add API credentials to `.env`
3. Configure webhooks for recording callbacks

### Deepgram Setup
1. Create a Deepgram account
2. Generate an API key with transcription permissions
3. Add to `.env`

## Database Schema

The application uses several key tables:
- **companies** — Organization accounts
- **profiles** — User profiles with role-based access
- **interviews** — Interview sessions and metadata
- **candidates** — Candidate information
- **transcripts** — Timestamped transcription data
- **analysis_chunks** — Real-time AI analysis segments
- **reports** — Generated interview reports

See `supabase-schema.sql` for the complete schema.

## Edge Functions

Supabase edge functions power the backend:
- `analyze-chunk` — Process interview audio chunks
- `analyze-frame` — Video frame analysis
- `generate-final-report` — Compile interview insights
- `livekit-token` — Generate video room tokens
- `drip-scheduler` — Schedule follow-up emails
- `stripe-*` — Payment processing webhooks

## Branding

Brand assets and design guidelines are documented in `BRANDING.md`.

## Deployment

This project is optimized for deployment on:
- **Vercel** (recommended for frontend)
- **Supabase** (backend and database)
- **LiveKit Cloud** (video infrastructure)

Set environment variables in your deployment platform matching `.env.example`.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: patrick@boxfordpartners.com

## Acknowledgments

Built with:
- [LiveKit](https://livekit.io/) — Real-time video infrastructure
- [Deepgram](https://deepgram.com/) — AI speech recognition
- [XAI Grok](https://x.ai/) — Advanced AI analysis
- [Supabase](https://supabase.com/) — Backend platform
- [shadcn/ui](https://ui.shadcn.com/) — Component library

---

**Status:** Production-ready (Completed April 2026)
