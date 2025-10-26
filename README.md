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

3. Set up your database:

```bash
# Generate migration files
bun run db:generate

# Run migrations
bun run db:migrate

# Or push schema directly (for development)
bun run db:push
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

## Features (Planned)

- ✅ Project initialization
- ⏳ Authentication with Google (restricted access)
- ⏳ CRUD operations for notes
- ⏳ Markdown editor with slash commands
- ⏳ Hierarchical note organization
- ⏳ Offline support with sync
- ⏳ PWA support
- ⏳ Mobile responsive design

## License

Private project - All rights reserved
