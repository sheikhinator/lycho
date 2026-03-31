import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.app'
    const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? appUrl).split(',')
    const requestOrigin  = request.headers.get('origin') ?? ''
    const redirectOrigin = allowedOrigins.some(o => requestOrigin.startsWith(o.trim()))
      ? requestOrigin
      : appUrl

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

    // Insert tenant
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

    // Send verification email via Resend (bypass Supabase email system)
    try {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: normalised,
        options: { redirectTo: `${appUrl}/auth/callback` },
      })

      console.log('[signup] generateLink result:', JSON.stringify({ action_link: linkData?.properties?.action_link, error: linkError }))

      if (linkError) {
        console.error('[signup] generateLink error:', linkError)
      } else {
        const actionLink = linkData?.properties?.action_link
        const { error: resendError } = await resend.emails.send({
          from: 'Lycho Systems <onboarding@resend.dev>',
          to: normalised,
          subject: 'Confirm your LYCHO account',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#070707;color:#fff;padding:40px;border-radius:12px">
              <h1 style="color:#C9A84C;font-size:28px;margin-bottom:8px">Welcome to LYCHO</h1>
              <p style="color:#888;margin-bottom:24px">Intelligence. Transmitted.</p>
              <p style="color:#fff;margin-bottom:24px">Click the button below to confirm your account and get started.</p>
              <a href="${actionLink}"
                 style="background:#C9A84C;color:#070707;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">
                Confirm My Account
              </a>
              <p style="color:#444;font-size:12px;margin-top:32px">If you didn't create this account, ignore this email.</p>
            </div>
          `,
        })

        if (resendError) {
          console.error('[signup] Resend error:', resendError)
        } else {
          console.log('[signup] Verification email sent via Resend to:', normalised)
        }
      }
    } catch (emailErr) {
      console.error('[signup] Email send failed (non-fatal):', emailErr)
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
