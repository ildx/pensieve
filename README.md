# Pensieve

<img width="720" height="358" alt="image" src="https://github.com/user-attachments/assets/4c794863-0c7f-4573-b2ba-4f54ce19e910" />

A magical artifact that remembers what you write.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Validation**: Zod + drizzle-zod
- **Auth**: Better Auth (Passkey/WebAuthn)
- **State Management**: TanStack Query (React Query)
- **Offline Storage**: IndexedDB
- **Editor**: Tiptap
- **Testing**: Vitest + Playwright
- **Linting/Formatting**: Biome
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Bun installed
- PostgreSQL database (Supabase recommended)
- Upstash Redis (for rate limiting)

### Setup

1. **Clone and install:**

```bash
git clone <your-repo>
cd pensieve
bun install
```

2. **Environment variables:**

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. **Database setup:**

```bash
# One command does it all: reset, generate, push, and seed
bun run db:setup:fresh
```

4. **Start development:**

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development
- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server

### Code Quality
- `bun run lint` - Run Biome linter
- `bun run lint:fix` - Fix linting issues
- `bun run format` - Format code with Biome

### Database
- `bun run db:setup:fresh` - Complete fresh database setup
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:push` - Push schema to database
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:reset:migrations` - Clear all migration files

### Testing
- `bun run test` - Run unit & integration tests
- `bun run test:ui` - Run tests with UI
- `bun run test:e2e` - Run E2E tests with Playwright

## Authentication

This app uses **Passkey (WebAuthn)** authentication with email restriction.

### How It Works

1. Enter your email address
2. First time: Register a passkey (biometric or PIN)
3. Subsequent visits: Sign in with one tap!

### Email Restriction

Access is restricted to allowed emails via:
- Client-side validation (UX)
- Server-side API validation
- Database trigger enforcement (security)

Set allowed emails in `.env.local`:
```bash
ALLOWED_EMAILS=you@example.com,other@example.com
```

The `db:setup:fresh` command automatically seeds the database with these emails.

### Security Features

- ✅ Passkey authentication (WebAuthn)
- ✅ Rate limiting (Upstash Redis)
- ✅ Origin validation
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Database-level access control
- ✅ Generic error messages (no enumeration)
- ✅ Input validation with Zod

## Project Structure

```
pensieve/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   ├── login/       # Login page
│   └── page.tsx     # Home page
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── editor/      # Editor components
│   └── sidebar/     # Sidebar components
├── lib/             # Utilities and configurations
│   ├── db/          # Database client and schema
│   ├── hooks/       # Custom React hooks
│   ├── utils/       # Utility functions
│   └── validators/  # Zod schemas
├── tests/           # Test files
│   ├── unit/        # Unit tests
│   ├── integration/ # Integration tests
│   └── e2e/         # E2E tests
├── scripts/         # Utility scripts
└── docs/            # Project documentation
```

## Documentation

- **[Setup Guide](docs/SETUP.md)** - Detailed setup instructions
- **[Technical Plan](docs/TECHNICAL_PLAN.md)** - Architecture and decisions
- **[Project Status](docs/PROJECT_STATUS.md)** - Current implementation status
- **[Tests README](tests/README.md)** - Testing documentation
- **[Scripts README](scripts/README.md)** - Utility scripts documentation

## Features

- ✅ Project initialization
- ✅ Authentication with Passkeys
- ✅ Email-based access restriction
- ✅ Rate limiting & security hardening
- ✅ Comprehensive test suite (51 tests)
- ✅ Zod validation throughout
- ⏳ CRUD operations for notes
- ⏳ Markdown editor with slash commands
- ⏳ Hierarchical note organization
- ⏳ Offline support with sync
- ⏳ PWA support

## Environment Variables

Required variables (see `.env.example` for details):

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Access Control
ALLOWED_EMAILS=your@email.com

# Rate Limiting
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

## Deployment

### Vercel Setup

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

### Database Setup

1. Create Supabase project
2. Use **Connection Pooling (Transaction mode)** URL
3. Run `bun run db:setup:fresh` locally first
4. Verify with Drizzle Studio: `bun run db:studio`

### Upstash Redis Setup

1. Create Upstash Redis database (free tier)
2. Add `KV_REST_API_URL` and `KV_REST_API_TOKEN` to Vercel
3. Redeploy

## License

Private project - All rights reserved
