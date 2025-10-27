import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Prefer Vercel KV env names; fall back to legacy UPSTASH_* if present
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

const redis =
  REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : undefined

export const validateEmailLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 s'), // 5 requests per 10 seconds per key
      prefix: 'rl:validate-email',
    })
  : undefined

export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 m'), // 10 requests per 10 minutes per key
      prefix: 'rl:auth',
    })
  : undefined

export function getClientIp(req: Request): string {
  // In Vercel Edge/Node, try common headers first
  const ip =
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  return ip
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
