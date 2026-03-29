import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { rateGuard, AUTH_LIMITS } from '@/lib/api'

export async function POST(request: NextRequest) {
  // Rate-limit signup attempts — prevent account enumeration and bulk creation
  const limited = await rateGuard(request, AUTH_LIMITS)
  if (limited) return limited

  const { businessName, email, password, phone, sector, country } = await request.json()

  if (!businessName || !email || !password) {
    return NextResponse.json({ error: 'Business name, email and password are required.' }, { status: 400 })
  }

  // Basic input validation
  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  // Use the anon client for signUp so Supabase triggers the verification email
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Allow only same-origin redirects to prevent open-redirect abuse
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
    // Return a generic error — don't reveal whether the email already exists
    return NextResponse.json({ error: 'Signup failed. Please check your details and try again.' }, { status: 400 })
  }

  const userId = authData.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Signup failed — please try again.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  // Create tenant
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      business_name:  String(businessName).slice(0, 200),
      business_email: email,
      business_phone: phone  ? String(phone).slice(0, 30)  : null,
      sector:         sector ? String(sector).slice(0, 100) : null,
      country:        country === 'PK' ? 'PK' : 'US',
      currency:       country === 'PK' ? 'PKR' : 'USD',
      trial_ends_at:  trialEndsAt,
    })
    .select()
    .single()

  if (tenantError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Account creation failed. Please try again.' }, { status: 400 })
  }

  // Create user profile
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
