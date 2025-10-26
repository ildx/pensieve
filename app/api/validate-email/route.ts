import { NextResponse } from 'next/server'
import postgres from 'postgres'
import { validateEmailLimiter, getClientIp, sleep } from '@/lib/utils/rateLimit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Invalid email' }, { status: 400 })
    }

    // Basic origin check
    const origin = req.headers.get('origin') || ''
    if (origin && process.env.BETTER_AUTH_URL) {
      try {
        const allowed = new URL(process.env.BETTER_AUTH_URL)
        if (!origin.startsWith(`${allowed.protocol}//${allowed.host}`)) {
          return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }
      } catch {}
    }

    // Rate limit per IP
    if (validateEmailLimiter) {
      const { success } = await validateEmailLimiter.limit(getClientIp(req))
      if (!success) {
        await sleep(200 + Math.random() * 300)
        return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
      }
    }

    // Validate against database allowlist to avoid exposing any emails client-side
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 })
    }
    const sql = postgres(process.env.DATABASE_URL, { prepare: false })
    try {
      const rows = await sql`
        select 1 from allowed_emails where lower(email)=${email.toLowerCase()} limit 1
      `
      await sql.end()
      const ok = rows.length > 0
      // Use generic responses to avoid email enumeration patterns
      return ok
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ message: 'Invalid credentials' }, { status: 403 })
    } catch {
      try { await sql.end() } catch {}
      return NextResponse.json({ message: 'Validation failed' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ message: 'Validation failed' }, { status: 500 })
  }
}
