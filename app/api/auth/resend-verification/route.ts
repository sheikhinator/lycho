import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()
    const admin = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.app'

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalised,
      options: { redirectTo: `${appUrl}/auth/callback` },
    })

    if (linkError) {
      console.error('[resend-verification] generateLink error:', linkError)
      return NextResponse.json({ error: linkError.message }, { status: 400 })
    }

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
      console.error('[resend-verification] Resend error:', resendError)
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[resend-verification] Error:', error)
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 })
  }
}
