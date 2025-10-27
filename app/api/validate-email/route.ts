import { sqlClient } from '@/lib/db/client'
import { getClientIp, sleep, validateEmailLimiter } from '@/lib/utils/rateLimit'
import { validateEmailRequestSchema } from '@/lib/validators/email'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

// Helper to add security headers to responses
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  return response
}

function getErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message
  }
  return String(err)
}

function getErrorCode(err: unknown): string | undefined {
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    typeof (err as { code?: unknown }).code === 'string'
  ) {
    return (err as { code: string }).code
  }
  return undefined
}

export async function POST(req: Request) {
  try {
    const NODE_ENV = String(process.env.NODE_ENV || '')
    const body = await req.json().catch(() => ({}))

    // Validate and sanitize input using Zod
    const validationResult = validateEmailRequestSchema.safeParse(body)

    if (!validationResult.success) {
      if (NODE_ENV !== 'production') {
        console.log('[validate-email] validation failed:', validationResult.error.issues)
      }
      return addSecurityHeaders(NextResponse.json({ message: 'Invalid email' }, { status: 400 }))
    }

    // Email is now validated, trimmed, and lowercased by Zod
    const { email } = validationResult.data

    if (NODE_ENV !== 'production') {
      console.log('[validate-email] incoming email:', email)
    }

    // Fast-path in development: if ALLOWED_EMAILS is set locally, use it and return immediately
    if (NODE_ENV !== 'production') {
      const env = process.env.ALLOWED_EMAILS || ''
      const allowed = env
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
      if (allowed.length > 0) {
        const ok = allowed.includes(email.toLowerCase())
        if (NODE_ENV !== 'production') {
          console.log('[validate-email] dev fast-path via env:', ok)
        }
        return ok
          ? addSecurityHeaders(NextResponse.json({ ok: true }))
          : addSecurityHeaders(
              NextResponse.json({ message: 'Invalid credentials' }, { status: 403 })
            )
      }
    }

    // Basic origin check (production only to avoid local host/IP mismatches)
    if (NODE_ENV === 'production') {
      const origin = req.headers.get('origin') || ''
      if (origin && process.env.BETTER_AUTH_URL) {
        try {
          const allowed = new URL(process.env.BETTER_AUTH_URL)
          if (!origin.startsWith(`${allowed.protocol}//${allowed.host}`)) {
            if (NODE_ENV !== 'production') {
              console.warn('[validate-email] origin rejected', {
                origin,
                allowed: `${allowed.protocol}//${allowed.host}`,
              })
            }
            return addSecurityHeaders(NextResponse.json({ message: 'Forbidden' }, { status: 403 }))
          }
        } catch {}
      }
    }

    // Rate limit per IP (tolerant to misconfiguration/network issues in dev)
    if (validateEmailLimiter) {
      try {
        const { success } = await validateEmailLimiter.limit(getClientIp(req))
        if (!success) {
          await sleep(200 + Math.random() * 300)
          return addSecurityHeaders(
            NextResponse.json({ message: 'Too many requests' }, { status: 429 })
          )
        }
      } catch (e) {
        // Ignore rate-limit errors in development to avoid 500s
        if (NODE_ENV === 'production') {
          console.error('[validate-email] ratelimit error', e)
          return addSecurityHeaders(
            NextResponse.json({ message: 'Validation failed' }, { status: 500 })
          )
        }
        console.warn('[validate-email] ratelimit error (ignored in dev)', e)
      }
    }

    // Validate against database allowlist to avoid exposing any emails client-side
    if (!process.env.DATABASE_URL) {
      return addSecurityHeaders(
        NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 })
      )
    }
    try {
      if (NODE_ENV !== 'production') {
        try {
          const u = new URL(process.env.DATABASE_URL)
          console.log('[validate-email] querying DB host:', u.host)
        } catch {}
      }
      const rows = await sqlClient`
        select 1 from public.allowed_emails where lower(email)=${email} limit 1
      `
      const ok = rows.length > 0
      if (NODE_ENV !== 'production') {
        console.log('[validate-email] db rows length:', rows.length)
      }
      return ok
        ? addSecurityHeaders(NextResponse.json({ ok: true }))
        : addSecurityHeaders(NextResponse.json({ message: 'Invalid credentials' }, { status: 403 }))
    } catch (err: unknown) {
      if (NODE_ENV !== 'production') {
        console.warn(
          '[validate-email] DB connect/query error, will fallback to env:',
          getErrorMessage(err)
        )
      }
      // In development or when relation missing, fall back to env list
      const errCode = getErrorCode(err)
      const errMsg = getErrorMessage(err)
      if (
        NODE_ENV !== 'production' ||
        errCode === '42P01' ||
        /relation .*allowed_emails.* does not exist/i.test(String(errMsg))
      ) {
        if (NODE_ENV !== 'production') {
          console.warn('[validate-email] DB error, falling back to env:', {
            code: errCode,
            message: errMsg,
          })
        }
        const env = process.env.ALLOWED_EMAILS || ''
        const allowed = env
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean)
        const ok = allowed.includes(email)
        if (NODE_ENV !== 'production') {
          console.log('[validate-email] env fallback ok:', ok)
        }
        return ok
          ? addSecurityHeaders(NextResponse.json({ ok: true }))
          : addSecurityHeaders(
              NextResponse.json({ message: 'Invalid credentials' }, { status: 403 })
            )
      }
      console.error('[validate-email] DB error (prod):', getErrorMessage(err))
      return addSecurityHeaders(
        NextResponse.json({ message: 'Validation failed' }, { status: 500 })
      )
    }
  } catch (e) {
    console.error('[validate-email] unexpected error', e)
    return addSecurityHeaders(NextResponse.json({ message: 'Validation failed' }, { status: 500 }))
  }
}
