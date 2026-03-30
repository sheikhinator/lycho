import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.password) {
    return NextResponse.json({ error: 'Password required.' }, { status: 400 })
  }

  const masterSecret = process.env.MASTER_SECRET
  if (!masterSecret) {
    console.error('[master/auth] MASTER_SECRET env var not set')
    return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 })
  }

  if (body.password !== masterSecret) {
    return NextResponse.json({ error: 'Invalid master secret.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('master_session', masterSecret, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   60 * 60 * 24 * 7, // 7 days
    path:     '/',
  })
  return response
}
