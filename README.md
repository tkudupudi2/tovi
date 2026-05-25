# ToVi — Token Visualizer

> A lighthouse guiding you through AI spend

ToVi helps engineering managers track and manage AI tool credit usage across their team. Monitor Windsurf, Claude, and GitHub Copilot from a single dashboard.

## Features

- **Unified Dashboard** — Total spend, per-tool breakdown, sortable user table
- **Ghost Seat Detection** — Flags users inactive 14+ days in red
- **Burn Rate Projection** — Predicts credit exhaustion date
- **Alert Rules** — Set thresholds for user spend and team burn rate
- **Weekly Digest** — Cron-powered email summary every Monday via Resend
- **Demo Mode** — Toggle to show realistic fake data for demos

## Tech Stack

- **Next.js 14** with TypeScript and App Router
- **Tailwind CSS** for styling
- **Supabase** for database, auth, and row-level security
- **Resend** for transactional emails
- **Vercel Cron** for weekly digest

## Getting Started

```bash
# Install dependencies
npm install

# Copy env and configure
cp .env.example .env.local
# Edit .env.local with your Supabase/Resend keys
# Set NEXT_PUBLIC_DEMO_MODE=true to run without Supabase

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the homepage.

## Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` to bypass auth and populate all views with realistic mock data. Toggle demo on/off from the dashboard header.

## Database Setup

Run `supabase/schema.sql` in your Supabase SQL editor to create:
- `organizations` — one per account
- `api_connections` — encrypted API keys per tool
- `usage_records` — normalized usage data
- `alert_rules` — threshold-based alert configs

All tables have row-level security policies.

## API Integrations

| Tool | Endpoint | Status |
|------|----------|--------|
| Anthropic | `https://api.anthropic.com/v1/usage` | Mocked (endpoint may not exist yet) |
| GitHub Copilot | `GET /orgs/{org}/copilot/usage` | Mocked (falls back on error) |
| Windsurf | No public API | Mocked with realistic data |

All integrations gracefully fall back to mock data if the real API is unavailable.

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app shell
│   │   ├── dashboard/      # Main dashboard
│   │   ├── alerts/         # Alert rules management
│   │   └── settings/       # Tool connections
│   ├── api/
│   │   ├── dashboard/      # Dashboard data endpoint
│   │   ├── sync/           # Data sync endpoint
│   │   ├── alerts/         # Alert CRUD
│   │   ├── onboarding/     # Onboarding flow
│   │   └── cron/           # Weekly digest cron
│   ├── login/              # Auth pages
│   ├── signup/
│   ├── onboarding/         # Tool connection wizard
│   └── page.tsx            # Landing page
├── components/ui/          # UI components (Tailwind v3)
└── lib/
    ├── demo-data.ts        # Mock data generator
    ├── sync-service.ts     # API integration + mocks
    ├── types.ts            # TypeScript types
    └── supabase/           # Supabase client/server/middleware
```

## Deploy

Deploy to Vercel with the Supabase integration. The `vercel.json` configures the weekly digest cron to run every Monday at 9am UTC.
