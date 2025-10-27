# Pensieve

<img width="720" height="358" alt="image" src="https://github.com/user-attachments/assets/4c794863-0c7f-4573-b2ba-4f54ce19e910" />

A magical artifact that remembers what you write.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Validation**: Zod + drizzle-zod
- **Auth**: Better Auth
- **State Management**: TanStack Query (React Query)
- **Offline Storage**: IndexedDB
- **Editor**: Tiptap
- **Testing**: Vitest + Playwright
- **Linting/Formatting**: Biome
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Bun installed
- PostgreSQL database (Supabase recommended)
- Google OAuth credentials

### Setup

1. Clone the repository and install dependencies:

```bash
bun install
```

2. Copy `.env.example` to `.env.local` and fill in your environment variables:

```bash
cp .env.example .env.local
```

3. Set up your database (one command does it all!):

```bash
# Fresh setup: resets migrations, generates new ones, pushes to DB, and seeds allowed emails
bun run db:setup:fresh
```

Or manually:
```bash
# Generate migration files
bun run db:generate

# Push schema to database
bun run db:push

# Seed allowed emails from .env
node scripts/setup-allowed-emails.js
```

4. Run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Available Scripts

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run Biome linter
- `bun run lint:fix` - Fix linting issues
- `bun run format` - Format code with Biome
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Run database migrations
- `bun run db:push` - Push schema to database
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:setup:fresh` - Complete fresh database setup (reset, generate, push, seed)
- `bun run db:reset:migrations` - Clear all migration files
- `bun run auth:update-email <email>` - Update allowed email for authentication
- `bun run test` - Run unit tests
- `bun run test:ui` - Run tests with UI
- `bun run test:e2e` - Run E2E tests

## Project Structure

```
pensieve/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── editor/      # Markdown editor components
│   └── sidebar/     # Sidebar components
├── lib/             # Utilities and configurations
│   ├── db/          # Database client and schema
│   ├── hooks/       # Custom React hooks
│   └── utils/       # Utility functions
├── types/           # TypeScript type definitions
└── tests/           # Test files
```

## Authentication

This app uses **Passkey (WebAuthn)** authentication with email restriction. Only the email specified in your configuration can create an account and access the application.

### How It Works

1. Enter your email address
2. If it's your first time, register a passkey (uses your device's biometric or PIN)
3. On subsequent visits, sign in with your passkey (one tap!)

### Allowed Emails

You can restrict access to a list of emails.

Environment variables:
- `ALLOWED_EMAILS` (server-only, comma-separated)

Example `.env.local`:
```
ALLOWED_EMAILS=you@example.com,other@example.com
```

Seed/update the server-side allowlist table and triggers:
```bash
bun node scripts/setup-allowed-emails.js
# or provide emails directly
bun node scripts/setup-allowed-emails.js "you@example.com,other@example.com"
```

Notes:
- The client check is for UX only. The database trigger enforces the allowlist securely.
- Keep both variables in sync for the best experience.

### Rate Limiting & Hardening

We protect the public login form and validation endpoint:
- Upstash Ratelimit (@upstash/ratelimit + @upstash/redis)
- Origin check, generic errors, and small jitter delays
- Security headers via vercel.json (CSP, X-Frame-Options, etc.)

Setup steps:
1) Create an Upstash Redis database (free tier is fine)
2) In Vercel Project Settings → Environment Variables add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3) Ensure `BETTER_AUTH_URL` is set to your production origin (e.g., https://your-domain)
4) Redeploy the app

Optional: adjust limits in `lib/utils/rateLimit.ts`.

## Features

- ✅ Project initialization
- ✅ Authentication with Passkeys (restricted access)
- ⏳ CRUD operations for notes
- ⏳ Markdown editor with slash commands
- ⏳ Hierarchical note organization
- ⏳ Offline support with sync
- ⏳ PWA support
- ⏳ Mobile responsive design

## License

Private project - All rights reserved
