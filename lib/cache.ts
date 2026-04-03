import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

export interface CacheOptions {
  ttl: number
  prefix?: string
}

const DEFAULT_TTL = 300

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis()
  if (!r) return null
  try {
    const data = await r.get(key)
    return data as T | null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, opts?: CacheOptions): Promise<boolean> {
  const r = getRedis()
  if (!r) return false
  try {
    const ttl = opts?.ttl ?? DEFAULT_TTL
    await r.set(key, JSON.stringify(value), { ex: ttl })
    return true
  } catch {
    return false
  }
}

export async function cacheInvalidate(pattern: string): Promise<boolean> {
  const r = getRedis()
  if (!r) return false
  try {
    const keys = await r.keys(pattern)
    if (keys.length === 0) return true
    await r.del(...keys)
    return true
  } catch {
    return false
  }
}

export function cacheKey(...parts: string[]): string {
  return `lycho:${parts.join(':')}`
}

export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  opts?: CacheOptions,
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const fresh = await fn()
  await cacheSet(key, fresh, opts)
  return fresh
}
