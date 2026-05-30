import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Only instantiate if env vars are present (avoids build errors without Redis config)
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

interface RateLimitOptions {
  /** Max requests per window */
  limit: number
  /** Window in seconds */
  window: number
}

const DEFAULTS: RateLimitOptions = { limit: 100, window: 60 }
const AUTH_LIMITS: RateLimitOptions = { limit: 10, window: 60 }

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function checkRateLimit(
  req: NextRequest,
  opts: RateLimitOptions = DEFAULTS,
): Promise<NextResponse | null> {
  const redis = getRedis()
  if (!redis) return null // Skip rate limiting if Redis not configured

  const ip = getIp(req)
  const key = `rl:${ip}:${req.nextUrl.pathname}`

  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, opts.window)
    }
    if (count > opts.limit) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: {
            'Retry-After': String(opts.window),
            'X-RateLimit-Limit': String(opts.limit),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }
  } catch {
    // Redis failure is non-fatal — allow request through
    return null
  }

  return null
}

export async function rateLimit(key: string, limit: number = 60, windowSec: number = 60): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return true
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSec)
    return count <= limit
  } catch {
    return true
  }
}

export type { RateLimitOptions }
export { AUTH_LIMITS, DEFAULTS as DEFAULT_LIMITS }
