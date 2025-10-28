# Environment Variables Setup

## Critical Variables for Production

### 1. BETTER_AUTH_SECRET
**Required**: Yes (production & development)  
**Format**: Random string, minimum 32 characters  
**Example**: `openssl rand -base64 32`  
**Purpose**: Used to sign and encrypt session tokens

⚠️ **IMPORTANT**: This MUST be set in Vercel environment variables. Without it, Better Auth cannot create secure sessions.

### 2. BETTER_AUTH_URL
**Required**: Yes (production), optional (development)  
**Format**: Full URL including protocol, NO trailing slash  
**Production Example**: `https://pensieve.ilei.pw`  
**Development Example**: `http://localhost:3000`  
**Purpose**: Base URL for Better Auth API endpoints and cookie domain

⚠️ **IMPORTANT**: Must match your actual domain exactly. This determines the cookie domain.

### 3. NEXT_PUBLIC_BETTER_AUTH_URL
**Required**: Yes (production), optional (development)  
**Format**: Same as BETTER_AUTH_URL  
**Purpose**: Used by client-side code to make auth API calls

⚠️ **IMPORTANT**: Must match BETTER_AUTH_URL exactly.

### 4. DATABASE_URL
**Required**: Yes  
**Format**: PostgreSQL connection string  
**Example**: `postgresql://user:password@host:port/database`  
**Purpose**: Database connection for Drizzle ORM

### 5. KV_REST_API_URL & KV_REST_API_TOKEN
**Required**: Yes (for rate limiting)  
**Format**: Upstash Redis REST API credentials  
**Purpose**: Rate limiting for validation endpoint

### 6. ALLOWED_EMAILS
**Required**: Optional (fallback in development)  
**Format**: Comma-separated email addresses  
**Example**: `user1@example.com,user2@example.com`  
**Purpose**: Fallback email allowlist when database is unavailable

## Vercel Setup Checklist

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add ALL of the following:
   - `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `BETTER_AUTH_URL` (e.g., `https://pensieve.ilei.pw`)
   - `NEXT_PUBLIC_BETTER_AUTH_URL` (same as BETTER_AUTH_URL)
   - `DATABASE_URL` (from Supabase)
   - `KV_REST_API_URL` (from Upstash/Vercel KV)
   - `KV_REST_API_TOKEN` (from Upstash/Vercel KV)
   - `ALLOWED_EMAILS` (your email addresses)

3. **CRITICAL**: After adding variables, redeploy your app (or trigger a new deployment)

## Local Development Setup

Create a `.env.local` file in the project root with:

```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-local-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
ALLOWED_EMAILS=your@email.com
```

## Common Issues

### Issue: "Session token not set" in production
**Cause**: Missing or incorrect `BETTER_AUTH_SECRET`  
**Fix**: Ensure `BETTER_AUTH_SECRET` is set in Vercel and is at least 32 characters

### Issue: "Cookie not being sent"
**Cause**: `BETTER_AUTH_URL` doesn't match your actual domain  
**Fix**: Verify `BETTER_AUTH_URL` exactly matches your production URL (no trailing slash, correct protocol)

### Issue: "CORS errors"
**Cause**: `NEXT_PUBLIC_BETTER_AUTH_URL` doesn't match `BETTER_AUTH_URL`  
**Fix**: Ensure both variables have the exact same value

