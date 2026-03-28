import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { businessName, email, password, phone, sector, country } = await request.json()

  if (!businessName || !email || !password) {
    return NextResponse.json({ error: 'Business name, email and password are required.' }, { status: 400 })
  }

  // Use the anon client for signUp so Supabase triggers the verification email
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const origin = request.headers.get('origin') ?? 'http://localhost:3000'

  const { data: authData, error: authError } = await anonClient.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const userId = authData.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Signup failed — no user returned.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  // Create tenant
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      business_name: businessName,
      business_email: email,
      business_phone: phone || null,
      sector: sector || null,
      country: country || 'PK',
      currency: country === 'PK' ? 'PKR' : 'USD',
      trial_ends_at: trialEndsAt,
    })
    .select()
    .single()

  if (tenantError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: tenantError.message }, { status: 400 })
  }

  // Create user profile
  const { error: userError } = await admin.from('users').insert({
    id: userId,
    tenant_id: tenant.id,
    full_name: businessName,
    role: 'owner',
  })

  if (userError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
