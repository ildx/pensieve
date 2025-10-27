# Pensieve - Technical Architecture Plan

## Overview
A personal, offline-first note-taking app with markdown support and hierarchical organization.

## Tech Stack Recommendations

### Core Framework
- **Next.js 15** (App Router) - React 19 with TypeScript
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library (built on Radix UI)
- **Bun** - Package manager and runtime
- **Vercel** - Deployment platform (free tier)
- **Biome** - Ultra-fast formatter and linter

### Database & Backend
**PostgreSQL with Supabase**
- PostgreSQL database with generous free tier (500MB storage, 2GB bandwidth)
- Real-time subscriptions (useful for future sync features)
- Row Level Security (RLS) for user isolation
- REST and GraphQL APIs
- **Drizzle ORM** for type-safe database queries

**Why not Vercel Postgres?**
- Smaller free tier
- Less real-time functionality
- But could work as an alternative

**Recommendation: PostgreSQL on Supabase + Drizzle ORM** - best balance of features, free tier, and developer experience.

### Authentication
**Better Auth** ([better-auth.com](https://www.better-auth.com/))
- Modern TypeScript-first authentication framework
- Simpler and faster than NextAuth/Auth.js
- Built-in support for Google OAuth and session management
- Excellent TypeScript support and DX
- Endorsed by Vercel's CEO and growing community

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { Pool } from "pg"

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  // Restrict to your email
  callbacks: {
    async signIn({ user }) {
      return user.email === 'your-email@gmail.com'
    }
  }
})
```

### Markdown Editor
**Recommended: Tiptap v2 with extensions**
- Most flexible and production-ready
- Built-in slash command support via `tiptap-extension-slash-commands`
- Rich ecosystem of extensions
- Good TypeScript support

**Alternative: BlockNote**
- Built on Tiptap, higher-level abstractions
- Notion-like slash menu out of the box
- Less customization than raw Tiptap

**Recommendation: Start with BlockNote for faster development, migrate to Tiptap if you need more control.**

### PWA & Offline Support
**next-pwa v5**
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})
```

**Offline Strategy:**
1. **Service Worker** - Cache static assets and API responses
2. **IndexedDB** - Local note storage via `idb` library
3. **Sync Queue** - Track pending changes when offline
4. **Background Sync API** - Auto-sync when connection restored

### State Management & Caching
**TanStack Query (React Query) v5**
- Perfect for offline-first apps
- Built-in cache persistence
- Optimistic updates
- Background sync
- Automatic retries

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    }
  }
})
```

**Additional: Zustand** (optional, for UI-only state)
- Lightweight (~1KB)
- Good for sidebar state, selected notes, etc.

### Testing
**Vitest** - Unit & Integration tests
- Drop-in Jest replacement, much faster
- Native ESM support
- TypeScript out of the box

**React Testing Library** - Component tests

**Playwright** - E2E tests
- Test offline scenarios
- Cross-browser testing (important for PWA)

### Additional Libraries

**UI Components:**
- `shadcn/ui` - Beautiful, accessible components built on Radix UI
- `cmdk` - Command menu component (for slash commands)
- `lucide-react` - Icons (used by shadcn)

**Utilities:**
- `nanoid` - Generate client-side IDs for notes
- `idb` - IndexedDB wrapper (promise-based)
- `date-fns` - Date formatting
- `zod` - Runtime type validation and parsing
- `drizzle-zod` - Generate Zod schemas from Drizzle schemas

**Development:**
- `@biomejs/biome` - Ultra-fast formatter and linter (replaces Prettier + ESLint)
- Alternative: `prettier` + `eslint` if you prefer the traditional setup
- `husky` + `lint-staged` - Pre-commit hooks
- **Recommendation**: Start with Biome for speed and simplicity, it's 25x faster than ESLint

## Architecture Decisions: Deep Dive

### Q: Do we need a key-value store for caching?

**Short answer: No, not for v1.**

**Caching Strategy for Maximum Speed:**

1. **Client-Side Caching (Primary):**
   - **React Query** - In-memory cache (instant reads after first load)
   - **IndexedDB** - Persistent local storage (works offline, survives page refresh)
   - This gives you sub-10ms response times for all note operations

2. **Database Layer:**
   - **PostgreSQL with proper indexes** - Fast enough for single-user app
   - With indexes on `user_id`, `parent_id`, and `updated_at`, queries will be <50ms
   - Connection pooling via Supabase

3. **When you might need Redis/KV later:**
   - If you add full-text search (cache search results)
   - If you add real-time collaboration (cache presence data)
   - If you have complex computed data (cache calculation results)
   - For now: **Skip it, add later if needed**

**Performance Benchmarks:**
```
Without KV:
- Cold load: ~200-300ms (database query)
- Hot load: <10ms (React Query cache)
- Offline: <5ms (IndexedDB)

With KV (minimal improvement for single-user):
- Cold load: ~100-150ms (Redis query)
- Hot load: <10ms (same, React Query cache)
- Offline: <5ms (same, IndexedDB)
```

**Verdict**: React Query + IndexedDB + well-indexed PostgreSQL is already extremely fast. KV stores add complexity without meaningful gains for a personal note-taking app.

### Q: Drizzle ORM - Do we need it?

**Recommendation: Yes, use Drizzle.**

**Pros:**
- **Type Safety**: Full end-to-end TypeScript types for your queries
- **Lightweight**: No runtime overhead, compiles to SQL
- **SQL-like**: Easy to learn if you know SQL
- **Great with Serverless**: Perfect for Vercel/Next.js
- **Migration Tools**: Built-in schema migration system
- **Works with Supabase**: Can use with any PostgreSQL database

**Cons:**
- Extra abstraction layer (but minimal)
- Learning curve (but small)

**Alternative: Supabase Client**
- Pros: Simple, built-in, no setup
- Cons: Not as type-safe, harder to do complex queries

**Code Comparison:**

```typescript
// Without Drizzle (Supabase client)
const { data, error } = await supabase
  .from('notes')
  .select('*')
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order('updated_at', { ascending: false })

// With Drizzle
const notes = await db
  .select()
  .from(notes)
  .where(and(
    eq(notes.userId, userId),
    isNull(notes.deletedAt)
  ))
  .orderBy(desc(notes.updatedAt))
```

**Verdict**: **Use Drizzle**. The type safety and better developer experience is worth it. You'll catch bugs at compile-time instead of runtime.

**Setup:**
```bash
bun add drizzle-orm postgres
bun add -d drizzle-kit
```

### Q: tRPC - Do we need it?

**Recommendation: No, use Next.js Server Actions instead.**

**tRPC Pros:**
- End-to-end type safety
- No API route boilerplate
- Great DX with React Query integration

**tRPC Cons:**
- Extra complexity and learning curve
- Adds bundle size
- Overkill for simple CRUD operations
- Less useful with Server Actions available

**Better Alternative: Next.js 15 Server Actions**

Server Actions give you similar benefits with less setup:

```typescript
// app/actions/notes.ts
'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function createNote(data: { title: string; content: string }) {
  const session = await auth.getSession()
  if (!session) throw new Error('Unauthorized')
  
  return await db.insert(notes).values({
    userId: session.userId,
    title: data.title,
    content: data.content,
  })
}

// In your component
import { createNote } from '@/app/actions/notes'

function NoteForm() {
  const mutation = useMutation({
    mutationFn: createNote,
  })
  
  // Full type safety! ✅
}
```

**Benefits of Server Actions:**
- Built into Next.js (no extra dependencies)
- Full type safety
- Automatic POST endpoint generation
- Progressive enhancement (works without JS)
- Simpler than tRPC

**When to use tRPC:**
- If you have a separate backend (not Next.js API routes)
- If you need to expose APIs to other clients
- If you're already familiar with tRPC

**Verdict**: **Skip tRPC, use Server Actions**. It's simpler, built-in, and perfect for your use case.

### Q: Zod for validation - Do we need it?

**Recommendation: Yes, definitely use Zod.**

**Why Zod is Essential:**

1. **Server Actions are Public Endpoints**
   - Anyone can call your Server Actions (they're just POST requests)
   - Without validation, malicious users could send invalid data
   - Zod ensures data integrity before it hits your database

2. **Runtime Type Safety**
   - TypeScript only validates at compile-time
   - User input is always unsafe and needs runtime validation
   - Zod bridges the gap between compile-time and runtime

3. **Better Error Messages**
   ```typescript
   // Without Zod
   if (!title || title.length > 200) {
     throw new Error("Invalid title")
   }
   
   // With Zod
   const noteSchema = z.object({
     title: z.string().min(1).max(200),
     content: z.string(),
     parentId: z.string().uuid().optional(),
   })
   
   const result = noteSchema.safeParse(data)
   if (!result.success) {
     return { errors: result.error.flatten() }
   }
   // Get structured, field-specific errors automatically
   ```

4. **Integration with Drizzle**
   ```typescript
   // lib/db/schema.ts
   import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
   import { createInsertSchema } from 'drizzle-zod'
   
   export const notes = pgTable('notes', {
     id: uuid('id').primaryKey().defaultRandom(),
     title: text('title').notNull(),
     content: text('content').notNull(),
     parentId: uuid('parent_id'),
   })
   
   // Automatically generate Zod schema from Drizzle schema!
   export const insertNoteSchema = createInsertSchema(notes, {
     title: z => z.title.min(1).max(200),
     content: z => z.content.min(0).max(100000),
   })
   ```

5. **Form Validation**
   - Use with React Hook Form (if needed)
   - Client-side validation before submitting
   - Same schema for client and server (no duplication!)

6. **API Safety**
   ```typescript
   // app/actions/notes.ts
   'use server'
   
   import { insertNoteSchema } from '@/lib/db/schema'
   
   export async function createNote(data: unknown) {
     // Validate first - if this fails, nothing else runs
     const validated = insertNoteSchema.parse(data)
     
     const session = await auth.getSession()
     if (!session) throw new Error('Unauthorized')
     
     return await db.insert(notes).values({
       ...validated,
       userId: session.userId,
     })
   }
   ```

**Real-World Example - What Could Go Wrong Without Zod:**

```typescript
// ❌ Without validation
export async function createNote(data: any) {
  await db.insert(notes).values(data)
}

// User could send:
// - title: "" (empty)
// - title: "x".repeat(1000000) (DoS attack)
// - content: null (crashes app)
// - parentId: "not-a-uuid" (database error)
// - userId: "someone-else" (security breach!)
```

```typescript
// ✅ With Zod
export async function createNote(rawData: unknown) {
  const data = insertNoteSchema.parse(rawData) // Throws if invalid
  const session = await auth.getSession()
  
  await db.insert(notes).values({
    ...data,
    userId: session.userId, // We control this
  })
}

// All invalid inputs are rejected before touching the database
```

**Performance:**
- Zod is very fast (~5-10ms for typical validations)
- Negligible overhead compared to database queries
- Can skip validation in internal functions (only validate at boundaries)

**Bundle Size:**
- ~14KB gzipped
- Tree-shakeable (only pay for what you use)
- Much smaller than alternatives like Yup

**Alternatives:**
- **Valibot**: Smaller bundle (~1-2KB), newer, less ecosystem support
- **ArkType**: Very fast, TypeScript-first, newer project
- **TypeBox**: JSON Schema based, good for APIs

**Verdict**: **Definitely use Zod**. It's the most mature, has the best ecosystem (especially with Drizzle), and prevents entire categories of bugs and security issues. The `drizzle-zod` integration alone makes it worth it - you define your schema once and get both database types and validation schemas.

## Database Schema

### Notes Table
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  parent_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown or JSON (Tiptap JSON)
  position INTEGER NOT NULL DEFAULT 0, -- For ordering siblings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  client_updated_at TIMESTAMPTZ NOT NULL, -- For conflict resolution
  version INTEGER DEFAULT 1 -- Optimistic locking
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_parent_id ON notes(parent_id);
CREATE INDEX idx_notes_deleted_at ON notes(deleted_at);

-- Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own notes"
  ON notes FOR ALL
  USING (user_id = auth.uid()::text);
```

### Sync Log Table (Optional, for advanced conflict resolution)
```sql
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'create', 'update', 'delete'
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Application Architecture

### Folder Structure
```
pensieve/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── unauthorized/
│   │       └── page.tsx
│   ├── (main)/
│   │   ├── layout.tsx          # Main app layout with sidebar
│   │   ├── page.tsx             # Notes view
│   │   └── notes/
│   │       └── [id]/
│   │           └── page.tsx     # Individual note view
│   ├── actions/
│   │   ├── notes.ts             # Server actions for notes
│   │   └── sync.ts              # Server actions for sync
│   ├── api/
│   │   └── auth/                # Better Auth API routes
│   │       └── [...all]/
│   │           └── route.ts
│   ├── layout.tsx               # Root layout
│   └── globals.css
├── components/
│   ├── editor/
│   │   ├── Editor.tsx
│   │   ├── SlashMenu.tsx
│   │   └── Toolbar.tsx
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── NoteTree.tsx
│   │   └── NoteItem.tsx
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── dropdown-menu.tsx
│       ├── dialog.tsx
│       └── ...
├── lib/
│   ├── auth.ts                  # Better Auth instance
│   ├── db/
│   │   ├── client.ts            # Drizzle client
│   │   ├── schema.ts            # Drizzle schema
│   │   ├── indexeddb.ts         # IndexedDB wrapper
│   │   └── sync.ts              # Sync manager
│   ├── hooks/
│   │   ├── useNotes.ts
│   │   ├── useOfflineSync.ts
│   │   └── useNote.ts
│   └── utils/
│       ├── cn.ts                # Class name utility
│       └── format.ts
├── public/
│   ├── manifest.json
│   ├── sw.js                    # Service worker
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── drizzle/
│   └── migrations/              # Database migrations
├── types/
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── biome.json                   # Biome config
├── drizzle.config.ts            # Drizzle config
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Offline-First Architecture

### Data Flow

**Online Mode:**
```
User Edit → React Query (optimistic update) → Supabase → React Query (refetch)
                                             ↓
                                        IndexedDB (cache)
```

**Offline Mode:**
```
User Edit → React Query (optimistic update) → IndexedDB
                                             ↓
                                        Sync Queue (pending)
```

**Reconnect:**
```
Sync Queue → Supabase (batch upload) → React Query (sync) → IndexedDB
```

### Conflict Resolution Strategy

**Last-Write-Wins with Version Check:**
1. Each note has `client_updated_at` timestamp
2. When syncing, compare timestamps
3. Server timestamp wins in conflicts
4. Optionally: Show conflict UI and let user choose

**Alternative: Operational Transform / CRDT**
- More complex but better UX
- Library: `yjs` or `automerge`
- Consider for v2 if needed

### Sync Implementation

```typescript
// lib/db/sync.ts
interface PendingChange {
  id: string
  noteId: string
  operation: 'create' | 'update' | 'delete'
  data: Note
  timestamp: number
}

class SyncManager {
  private queue: PendingChange[] = []
  
  async addToQueue(change: PendingChange) {
    // Add to IndexedDB sync queue
  }
  
  async sync() {
    if (!navigator.onLine) return
    
    // Get all pending changes
    // Sort by timestamp
    // Batch upload to Supabase
    // Handle conflicts
    // Clear queue on success
    // Trigger React Query refetch
  }
}
```

## PWA Configuration

### manifest.json
```json
{
  "name": "Pensieve",
  "short_name": "Pensieve",
  "description": "Personal note-taking app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Strategy
- **Static Assets**: Cache-first
- **API Calls**: Network-first, fallback to cache
- **Background Sync**: Queue failed requests

## Security Considerations

1. **Authentication**
   - NextAuth.js with httpOnly cookies
   - CSRF protection built-in
   - Restrict to single email address

2. **Database**
   - Row Level Security in Supabase
   - User can only access their own notes
   - Use service role key only in API routes, never client

3. **API Routes**
   - Validate session on every request
   - Rate limiting (Vercel provides this)
   - Input validation with Zod

## Performance Optimizations

1. **Code Splitting**
   - Lazy load editor component
   - Dynamic imports for heavy libraries

2. **Image Optimization**
   - Use Next.js Image component
   - Store images in Supabase Storage

3. **Caching Layers**
   - React Query cache (5 min stale time)
   - Service Worker cache (static assets)
   - IndexedDB (offline data)

4. **Virtual Scrolling**
   - Use `@tanstack/react-virtual` for long note lists

## Development Phases

### Phase 1: Core Setup (MVP)
- [ ] Next.js project setup with Bun
- [ ] Tailwind configuration
- [ ] NextAuth.js with Google (restricted)
- [ ] Supabase setup (database + auth)
- [ ] Basic database schema

### Phase 2: Note CRUD
- [ ] Create/Read/Update/Delete notes
- [ ] Basic markdown editor (Tiptap/BlockNote)
- [ ] Sidebar with note list
- [ ] React Query integration

### Phase 3: Hierarchy
- [ ] Nested notes (parent_id relationship)
- [ ] Tree view in sidebar
- [ ] Drag & drop reordering
- [ ] Breadcrumbs

### Phase 4: Offline Support
- [ ] PWA setup (next-pwa)
- [ ] IndexedDB integration
- [ ] Sync queue implementation
- [ ] Online/offline indicators
- [ ] Background sync

### Phase 5: Polish
- [ ] Slash command menu
- [ ] Keyboard shortcuts
- [ ] Search functionality
- [ ] Dark mode
- [ ] Mobile responsive design

### Phase 6: Testing & Deployment
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Playwright)
- [ ] Offline scenario tests
- [ ] Deploy to Vercel
- [ ] PWA installation testing

## Open Questions & Decisions Needed

1. **Editor Format**: Store as Markdown or Tiptap JSON?
   - Markdown: More portable, easier to migrate
   - JSON: Better for complex formatting, faster rendering
   - **Recommendation**: Start with Markdown, migrate to JSON if needed

2. **Real-time Collaboration**: Not in requirements, but Supabase makes it easy
   - Could add in future if you want to share notes
   - Skip for MVP

3. **File Attachments**: Images, PDFs, etc.
   - Supabase Storage (generous free tier)
   - Skip for MVP, add later

4. **Search**: Full-text search
   - PostgreSQL full-text search (built-in)
   - Or Algolia/Meilisearch for better experience
   - Start with simple PostgreSQL ILIKE, upgrade later

5. **Note Linking**: [[wiki-style]] links between notes
   - Great feature but complex
   - Phase 7 (future enhancement)

## Estimated Timeline

- **Phase 1**: 1-2 days
- **Phase 2**: 2-3 days
- **Phase 3**: 2-3 days
- **Phase 4**: 3-5 days (most complex)
- **Phase 5**: 2-3 days
- **Phase 6**: 2-3 days

**Total**: ~2-3 weeks of focused development

## Cost Analysis (Monthly)

- **Vercel**: Free (Hobby plan, sufficient for personal use)
- **Supabase**: Free (500MB DB, 2GB bandwidth, 50MB storage)
- **Domain** (optional): $10-15/year (~$1/month)
- **Total**: $0-1/month ✅

## Recommended Starting Point

1. Initialize Next.js project with Bun
2. Set up Tailwind, shadcn/ui, and Biome
3. Configure Better Auth with Google provider
4. Set up Supabase project and PostgreSQL database
5. Set up Drizzle ORM with initial schema
6. Implement basic note CRUD with Server Actions (no offline yet)
7. Add markdown editor with slash commands
8. Add hierarchical structure
9. Then iterate on offline features (PWA, IndexedDB, sync)

## Final Tech Stack Summary

| Category | Technology | Why? |
|----------|-----------|------|
| **Framework** | Next.js 15 (App Router) | Best React framework, great DX, Server Actions |
| **Language** | TypeScript | Type safety, better DX |
| **Styling** | Tailwind + shadcn/ui | Fast styling, beautiful components |
| **Linting/Formatting** | Biome | 25x faster than ESLint, all-in-one solution |
| **Database** | PostgreSQL (Supabase) | Free tier, reliable, real-time features |
| **ORM** | Drizzle | Type-safe queries, lightweight, great DX |
| **Validation** | Zod + drizzle-zod | Runtime validation, security, DX |
| **Auth** | Better Auth | Modern, TypeScript-first, simpler than NextAuth |
| **API Layer** | Server Actions | Built-in, type-safe, no boilerplate |
| **State/Cache** | React Query | Perfect for offline-first, optimistic updates |
| **Local Storage** | IndexedDB | Persistent offline storage |
| **PWA** | next-pwa | Easy PWA setup for Next.js |
| **Editor** | Tiptap/BlockNote | Rich markdown editing, slash commands |
| **Testing** | Vitest + Playwright | Fast tests, E2E coverage |
| **Deployment** | Vercel | Free, zero-config, perfect for Next.js |

## Key Decisions Recap

✅ **Use Better Auth** instead of NextAuth (simpler, better DX)  
✅ **Use Drizzle ORM** (type safety worth the small abstraction)  
✅ **Use Zod** for validation (essential for Server Actions security)  
✅ **Skip tRPC** (Server Actions provide similar benefits)  
✅ **Skip Redis/KV** for v1 (React Query + IndexedDB is fast enough)  
✅ **Use Biome** for linting/formatting (faster, simpler)  
✅ **Use shadcn/ui** (beautiful, accessible, based on Radix)  
✅ **Store as Markdown** (portable, simple)  
✅ **No attachments yet** (add in v2)  

## Performance Targets

- **First Load**: <500ms (with caching: <10ms)
- **Note Creation**: <100ms (optimistic update: instant)
- **Offline Operations**: <10ms (IndexedDB)
- **Sync**: <1s for batch updates

## Estimated Costs

- **Month 1-12**: $0 (all free tiers)
- **After scaling** (if needed): ~$5-10/month

---

This plan provides a solid, modern foundation with excellent DX. All technologies chosen are production-ready, well-maintained, and perfect for your use case. 

**Ready to start building when you are! 🚀**

