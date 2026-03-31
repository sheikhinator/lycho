import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch((e: unknown) => {
      console.error('[signup] JSON parse error:', e)
      return null
    })

    console.log('=== SIGNUP ATTEMPT ===')
    console.log('Body received:', JSON.stringify(body))

    if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

    const { businessName, email, password, phone, sector, country } = body

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
    const normalised = email.trim().toLowerCase()

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.app').split(',')
    const requestOrigin  = request.headers.get('origin') ?? ''
    const redirectOrigin = allowedOrigins.some(o => requestOrigin.startsWith(o.trim()))
      ? requestOrigin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.app')

    const { data: authData, error: authError } = await anonClient.auth.signUp({
      email: normalised,
      password,
      options: { emailRedirectTo: `${redirectOrigin}/auth/callback` },
    })

    console.log('Supabase signUp response:', JSON.stringify({ data: authData?.user?.id, error: authError }))
    if (authError) {
      console.error('Supabase error:', authError.message, authError.status)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user?.id
    if (!userId) {
      console.error('[signup] auth.signUp returned no user ID. authData:', authData)
      return NextResponse.json({ error: 'Signup failed — no user returned. User may already exist.' }, { status: 400 })
    }

    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .insert({
        business_name:  String(businessName).slice(0, 200),
        business_email: normalised,
        business_phone: phone  ? String(phone).slice(0, 30)   : null,
        sector:         sector ? String(sector).slice(0, 100)  : null,
        country:        country === 'PK' ? 'PK' : 'US',
        currency:       country === 'PK' ? 'PKR' : 'USD',
        plan_status:    'pending',
      })
      .select()
      .single()

    if (tenantError) {
      console.error('[signup] Tenant insert error:', tenantError)
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Tenant creation failed: ${tenantError.message}` }, { status: 400 })
    }

    const { error: userError } = await admin.from('users').insert({
      id:        userId,
      tenant_id: tenant.id,
      full_name: String(businessName).slice(0, 200),
      role:      'owner',
    })

    if (userError) {
      console.error('[signup] User insert error:', userError)
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `User creation failed: ${userError.message}` }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    const e = error as { message?: string; code?: string; status?: number }
    console.error('=== SIGNUP ERROR ===', error)
    console.error('Error message:', e.message)
    console.error('Error code:', e.code)
    console.error('Error status:', e.status)
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 })
  }
}
