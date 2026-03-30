import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { err, rateGuard, AUTH_LIMITS } from '@/lib/api'

// POST /api/master/auth/login — validates MASTER_SECRET and issues a session cookie
export async function POST(req: NextRequest) {
  const limited = await rateGuard(req, AUTH_LIMITS)
  if (limited) return limited

  const expected = process.env.MASTER_SECRET
  // Fail CLOSED — no secret configured means no access
  if (!expected) return err('Master access not configured', 'NOT_CONFIGURED', 403)

  const body = await req.json().catch(() => null)
  if (!body?.secret) return err('Missing secret', 'BAD_REQUEST', 400)

  if (body.secret !== expected) return err('Invalid master secret', 'UNAUTHORIZED', 401)

  // Build a time-bound HMAC token so the cookie is verifiable and non-replayable indefinitely
  const timestamp = Date.now().toString()
  const token = createHmac('sha256', expected)
    .update(`${expected}:${timestamp}`)
    .digest('hex')
  const sessionValue = `${timestamp}.${token}`

  const res = NextResponse.json({ data: { ok: true } })
  res.cookies.set('master_session', sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })

  return res
}
