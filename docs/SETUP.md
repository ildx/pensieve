# Setup Guide

## Initial Setup Completed ✅

The project has been initialized with the following:

### Installed Dependencies

**Core:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Bun package manager

**Database & ORM:**
- Drizzle ORM
- postgres driver
- drizzle-kit (migrations)
- drizzle-zod (schema validation)

**Authentication:**
- Better Auth

**State Management:**
- TanStack Query (React Query)
- TanStack Query Devtools

**Validation:**
- Zod

**UI Components:**
- Radix UI primitives (Dialog, Dropdown, Scroll Area, Separator, Slot)
- cmdk (Command menu)
- lucide-react (Icons)
- class-variance-authority
- clsx & tailwind-merge

**Editor:**
- Tiptap React
- Tiptap Starter Kit
- Tiptap Placeholder extension

**Utilities:**
- nanoid (ID generation)
- idb (IndexedDB wrapper)
- date-fns (Date formatting)

**Development Tools:**
- Biome (Linting & Formatting)
- Vitest (Unit testing)
- Playwright (E2E testing)
- React Testing Library

### Configuration Files Created

- ✅ `package.json` - All dependencies and scripts
- ✅ `biome.json` - Biome configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `drizzle.config.ts` - Drizzle ORM configuration
- ✅ `vitest.config.ts` - Vitest testing configuration
- ✅ `playwright.config.ts` - Playwright E2E testing configuration
- ✅ `components.json` - shadcn/ui configuration
- ✅ `.env.example` - Environment variables template
- ✅ `.gitignore` - Git ignore rules

### Project Structure Created

```
pensieve/
├── app/                    # Next.js app directory
│   ├── actions/           # Server actions (empty, ready for implementation)
│   ├── globals.css        # Global styles with shadcn/ui variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # shadcn/ui components (empty, ready for installation)
│   ├── editor/            # Editor components (empty)
│   └── sidebar/           # Sidebar components (empty)
├── lib/
│   ├── db/
│   │   ├── client.ts      # Drizzle database client
│   │   └── schema.ts      # Database schema with Zod validation
│   ├── hooks/             # Custom React hooks (empty)
│   └── utils/
│       └── cn.ts          # Tailwind class merger utility
├── types/
│   └── index.ts           # TypeScript type definitions
├── tests/
│   ├── setup.ts           # Test setup
│   ├── unit/              # Unit tests (empty)
│   ├── integration/       # Integration tests (empty)
│   └── e2e/               # E2E tests (empty)
└── drizzle/
    └── migrations/        # Database migrations (empty)
```

### Database Schema Defined

The `notes` table schema has been created with:
- `id` (UUID, primary key)
- `userId` (text, required)
- `parentId` (UUID, self-reference for hierarchy)
- `title` (text, required, max 200 chars)
- `content` (text, max 100,000 chars)
- `position` (integer, for ordering)
- `createdAt`, `updatedAt`, `deletedAt` (timestamps)
- `clientUpdatedAt` (for conflict resolution)
- `version` (for optimistic locking)

Zod validation schemas are auto-generated from the Drizzle schema.

## Next Steps

### 1. Set Up Database

Create a Supabase project:
1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string
4. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://...
   ```

### 2. Set Up Google OAuth

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add credentials to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### 3. Configure Better Auth

Add to `.env.local`:
```
BETTER_AUTH_SECRET=your-random-secret-key
BETTER_AUTH_URL=http://localhost:3000
ALLOWED_EMAIL=your-email@gmail.com
```

### 4. Run Database Migrations

```bash
bun run db:push
```

### 5. Install shadcn/ui Components

As needed:
```bash
bunx shadcn@latest add button
bunx shadcn@latest add dialog
bunx shadcn@latest add dropdown-menu
# etc.
```

## Available Commands

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run lint` - Check code quality
- `bun run format` - Format code
- `bun run test` - Run tests
- `bun run db:push` - Push schema to database
- `bun run db:studio` - Open Drizzle Studio

## Status

✅ Project initialized
✅ Dependencies installed
✅ Configuration files created
✅ Folder structure created
✅ Database schema defined
✅ Linting and formatting configured
✅ Testing framework set up

⏳ Ready for feature implementation!

