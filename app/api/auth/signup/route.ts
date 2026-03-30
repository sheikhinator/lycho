import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

async function checkSignupRateLimit(ip: string): Promise<boolean> {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return false
  const redis = new Redis({ url, token })
  const key   = `signup:ip:${ip}`
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 3600)
    return count > 3
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const ip = getIp(request)
  if (await checkSignupRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many signup attempts. Please try again later.' }, { status: 429 })
  }

  const { businessName, email, password, phone, sector, country } = await request.json()

  if (!businessName || !email || !password) {
    return NextResponse.json({ error: 'Business name, email and password are required.' }, { status: 400 })
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Max 1 account per email ever
  const { data: existing } = await admin
    .from('tenants')
    .select('id')
    .eq('business_email', email.toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').split(',')
  const requestOrigin  = request.headers.get('origin') ?? ''
  const redirectOrigin = allowedOrigins.some(o => requestOrigin.startsWith(o.trim()))
    ? requestOrigin
    : (process.env.NEXTAUTH_URL ?? 'https://lycho.app')

  const { data: authData, error: authError } = await anonClient.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${redirectOrigin}/auth/callback` },
  })

  if (authError) {
    return NextResponse.json({ error: 'Signup failed. Please check your details and try again.' }, { status: 400 })
  }

  const userId = authData.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Signup failed — please try again.' }, { status: 400 })
  }

  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      business_name:  String(businessName).slice(0, 200),
      business_email: email,
      business_phone: phone   ? String(phone).slice(0, 30)   : null,
      sector:         sector  ? String(sector).slice(0, 100)  : null,
      country:        country === 'PK' ? 'PK' : 'US',
      currency:       country === 'PK' ? 'PKR' : 'USD',
      plan_status:    'pending',
    })
    .select()
    .single()

  if (tenantError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Account creation failed. Please try again.' }, { status: 400 })
  }

  const { error: userError } = await admin.from('users').insert({
    id:        userId,
    tenant_id: tenant.id,
    full_name: String(businessName).slice(0, 200),
    role:      'owner',
  })

  if (userError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Account creation failed. Please try again.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
