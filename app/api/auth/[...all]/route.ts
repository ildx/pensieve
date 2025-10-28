import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { type NextRequest, NextResponse } from 'next/server'

const handlers = toNextJsHandler(auth)

// Wrap handlers with logging to diagnose cookie issues
export async function GET(req: NextRequest) {
  const pathname = new URL(req.url).pathname
  console.log('[auth-api] GET', pathname)

  const response = await handlers.GET(req)

  // Log Set-Cookie headers in production to verify they're being sent
  if (process.env.NODE_ENV === 'production') {
    const setCookie = response.headers.get('set-cookie')
    console.log('[auth-api] GET response Set-Cookie:', setCookie ? 'present' : 'missing')
    if (setCookie) {
      console.log('[auth-api] Set-Cookie value:', setCookie.substring(0, 100))
    }
  }

  return response
}

export async function POST(req: NextRequest) {
  const pathname = new URL(req.url).pathname
  console.log('[auth-api] POST', pathname)

  const response = await handlers.POST(req)

  // Log Set-Cookie headers in production to verify they're being sent
  if (process.env.NODE_ENV === 'production') {
    const setCookie = response.headers.get('set-cookie')
    console.log('[auth-api] POST response status:', response.status)
    console.log('[auth-api] POST response Set-Cookie:', setCookie ? 'present' : 'missing')
    if (setCookie) {
      console.log('[auth-api] Set-Cookie value:', setCookie.substring(0, 100))
    }
  }

  return response
}
