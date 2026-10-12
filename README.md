# TrueVoice HQ

**AI-Powered Video Interview Analysis Platform**

TrueVoice HQ is a comprehensive video interview platform that combines real-time video conferencing with advanced AI analysis to help hiring teams conduct and evaluate interviews more effectively. Built with modern web technologies and powered by cutting-edge AI services.


## Features

### Core Capabilities
- **Live Video Interviews** — Real-time video conferencing with LiveKit integration
- **AI-Powered Transcription** — Real-time speech-to-text using AssemblyAI
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
- **Convex** — Database, auth, server functions, crons, and HTTP endpoints
- **LiveKit** — Real-time video/audio streaming
- **AssemblyAI** — Live interview transcription
- **Deepgram** — Alternate speech-to-text path (token action only)
- **xAI Grok** — AI-powered interview analysis
- **Stripe** — Payment processing and subscriptions
- **PostHog** — Product analytics

### Key Libraries
- `@livekit/components-react` — Pre-built LiveKit UI components
- `convex` — Reactive client for queries, mutations, and actions
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
├── convex/              # Schema, queries, mutations, actions, HTTP routes
├── supabase/            # Legacy edge functions with no Convex equivalent yet
├── scripts/             # Build and setup scripts
└── public/              # Static assets

```

## Getting Started

### Quick Start (Recommended)

Run our interactive setup wizard that adapts to your skill level:

```bash
npm install
npm run setup
```

The wizard will:
- Assess your technical experience
- Guide you through configuration
- Recommend installation options (DIY, Guided, or White Glove)
- Automate common setup tasks

### Manual Installation

**Not sure if you can handle the technical setup?** See [Installation Services](INSTALLATION-SERVICES.md) for guided and white-glove setup options ($499-$1,500).

**Experienced developer?** See the complete [Installation Guide](INSTALLATION.md) for detailed step-by-step instructions (45-60 minutes).

### Prerequisites
- **Node.js** 18+ or **Bun** runtime
- **Convex** account and deployment
- **LiveKit** account and project
- **AssemblyAI** API key (live transcription)
- **xAI/Grok** API key
- **Stripe** account (for billing)

The browser only needs public URLs. Put API keys in the Convex dashboard, not in `VITE_*` variables. See `.env.example`.

```bash
npx convex dev
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
2. Set `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_URL` in the Convex dashboard
3. Set `VITE_LIVEKIT_URL` for the browser

Live interview transcription uses AssemblyAI (`ASSEMBLYAI_API_KEY` in Convex, HTTP route `/assemblyai/token`).

## Database Schema

The schema lives in `convex/schema.ts`. Core tables include `interviews`, `hiring_pipeline`, `interview_reports`, `transcript_chunks`, and the Joan tables (`action_items`, `autopilot_queue`, `intelligence_briefs`).

## Backend functions

Convex actions and HTTP routes replace the old Supabase edge functions for analysis, tokens, email, and Stripe. A few Supabase functions are still in `supabase/functions/` because nothing in Convex replaces them yet: LiveKit egress recording (`start-recording`, `stop-recording`, `transcribe-recording`), drip email (`drip-scheduler`, `send-drip-email`), and the external interview API (`api-create-interview`, `api-get-report`). The app does not call those from the client.

## Branding

Brand assets and design guidelines are documented in `BRANDING.md`.

## Deployment

This project is optimized for deployment on:
- **Convex** (backend, and optional static hosting via `@convex-dev/static-hosting`)
- **Vercel** (frontend; `vercel.json` sets security headers)
- **LiveKit Cloud** (video infrastructure)

Set environment variables in your deployment platform matching `.env.example`.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Source-available. You may read and fork this code for personal or educational use. Commercial use, redistribution, or deployment in a competing product is not permitted without written permission from Boxford Partners.

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: patrick@boxfordpartners.com

## Acknowledgments

Built with:
- [LiveKit](https://livekit.io/) — Real-time video infrastructure
- [Deepgram](https://deepgram.com/) — AI speech recognition
- [XAI Grok](https://x.ai/) — Advanced AI analysis
- [Convex](https://convex.dev/) — Backend platform
- [shadcn/ui](https://ui.shadcn.com/) — Component library

---

**Status:** Production-ready (Completed April 2026)
