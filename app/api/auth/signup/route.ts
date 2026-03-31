import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessName, email, password, phone, sector, country } = body

    console.log('=== SIGNUP ATTEMPT ===', { email, businessName })

    if (!email || !password || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Step 1: Create user — email_confirm: true skips Supabase email entirely
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { business_name: businessName, phone, sector, country },
    })

    if (userError) {
      console.error('Create user error:', userError)
      if (userError.message.includes('already been registered') || userError.message.includes('already exists')) {
        return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400 })
      }
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    const userId = userData.user.id

    // Step 2: Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        business_name:  String(businessName).slice(0, 200),
        business_email: email.trim().toLowerCase(),
        business_phone: phone  ? String(phone).slice(0, 30)  : null,
        sector:         sector ? String(sector).slice(0, 100) : null,
        country:        country === 'PK' ? 'PK' : 'US',
        currency:       country === 'PK' ? 'PKR' : 'USD',
        plan_status:    'pending',
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Tenant error:', tenantError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Failed to create account: ${tenantError.message}` }, { status: 500 })
    }

    // Step 3: Create user record
    const { error: userRowError } = await supabaseAdmin.from('users').insert({
      id:        userId,
      tenant_id: tenant.id,
      full_name: String(businessName).slice(0, 200),
      role:      'owner',
    })

    if (userRowError) {
      console.error('User row error:', userRowError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Failed to create user record: ${userRowError.message}` }, { status: 500 })
    }

    // Step 4: Send welcome email via Resend (non-blocking)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'LYCHO <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to LYCHO — Your account is ready',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#070707;color:#fff;padding:40px;border-radius:12px">
            <h1 style="color:#C9A84C;font-size:28px;margin-bottom:8px">Welcome to LYCHO</h1>
            <p style="color:#888;margin-bottom:24px">Intelligence. Transmitted.</p>
            <p style="color:#fff;margin-bottom:8px">Your account is ready. No verification needed — just sign in.</p>
            <p style="color:#fff;margin-bottom:24px">Business: <strong>${businessName}</strong></p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
               style="background:#C9A84C;color:#070707;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">
              Sign In to LYCHO →
            </a>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Welcome email failed (non-critical):', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Account created. Please sign in.',
      redirect: '/login',
    })

  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('Signup error:', error)
    return NextResponse.json({ error: e.message || 'Signup failed' }, { status: 500 })
  }
}
