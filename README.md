# Last-Minute Life Saver

An AI-powered productivity companion that proactively helps users complete tasks before deadlines are missed.

## Features

- **AI Task Creation** — Natural language input with automatic extraction of title, deadline, priority, effort, and category
- **AI Task Breakdown** — Large tasks automatically split into actionable subtasks
- **Risk Prediction Engine** — 0–100 risk scoring based on deadline proximity, effort, productivity history, and calendar availability
- **Smart Scheduler** — Google Calendar integration for free slot detection and auto-scheduling
- **Daily Planning Assistant** — AI-generated daily focus plan with workload estimates
- **Rescue Mode** — Emergency action plans when risk score exceeds 80
- **Productivity Coach** — Behavioral insights, procrastination patterns, and weekly scores
- **Voice Assistant** — Create tasks via browser speech recognition
- **Gamification** — Streaks, focus hours, productivity score, and badges

## Tech Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui
- Framer Motion · Recharts
- Prisma ORM · PostgreSQL
- Clerk Authentication
- OpenAI API · Google Calendar API

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account ([clerk.com](https://clerk.com))
- OpenAI API key
- Google Cloud project with Calendar API enabled (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your .env.local with:
# - DATABASE_URL
# - Clerk keys
# - OPENAI_API_KEY
# - Google OAuth credentials (optional)

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Open Prisma Studio
npm run db:studio
```

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated routes
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   ├── calendar/
│   │   └── insights/
│   ├── api/            # API routes
│   └── sign-in/        # Clerk auth pages
├── components/
│   ├── dashboard/      # Dashboard widgets
│   ├── tasks/          # Task management
│   ├── calendar/       # Calendar views
│   ├── voice/          # Voice input
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── ai/             # AI services
│   ├── calendar/       # Google Calendar
│   └── prisma/         # Database client
├── hooks/
├── actions/            # Server actions
└── types/
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/tasks/create` | Create task from natural language |
| GET | `/api/tasks` | List user tasks |
| POST | `/api/risk` | Calculate risk scores |
| POST | `/api/schedule` | Schedule task sessions |
| GET/POST | `/api/insights` | Productivity insights |
| GET | `/api/calendar` | Calendar events |
| GET/POST | `/api/rescue` | Rescue mode plans |

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example`
4. Add PostgreSQL (Vercel Postgres, Neon, or Supabase)
5. Deploy

```bash
# Vercel CLI
vercel --prod
```

## Environment Variables

See `.env.example` for the full list.

## License

MIT
# Repository-name-last-minute-life-saver
# Repository-name-last-minute-life-saver
