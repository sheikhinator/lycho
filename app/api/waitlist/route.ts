import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { ok, err } from '@/lib/api'

function generateReferralCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// POST /api/waitlist — add to waitlist and send welcome email
export async function POST(req: NextRequest) {
  let body: { email: string; name?: string; business_type?: string }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.email) return err('email is required', 'VALIDATION_ERROR', 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return err('Invalid email address', 'VALIDATION_ERROR', 400)
  }

  const supabase = createServerSupabase()

  // Check for duplicate
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id, position, referral_code')
    .eq('email', body.email.toLowerCase())
    .single()

  if (existing) {
    return NextResponse.json(
      { data: existing, message: 'Already on the waitlist' },
      { status: 200 },
    )
  }

  // Get current count to assign position
  const { count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })

  const position = (count ?? 0) + 1
  const referralCode = generateReferralCode()
  const cohort = new Date().toISOString().slice(0, 7) // "YYYY-MM"

  const { data: entry, error: insertError } = await supabase
    .from('waitlist')
    .insert({
      email: body.email.toLowerCase(),
      name: body.name ?? null,
      business_type: body.business_type ?? null,
      referral_code: referralCode,
      cohort,
    })
    .select()
    .single()

  if (insertError) return err(insertError.message, 'DB_ERROR', 500)

  // Send welcome email via Resend (gracefully skipped if key not configured)
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: 'LYCHO <waitlist@lychosystems.com>',
        to: body.email,
        subject: `You're on the LYCHO waitlist — position #${position}`,
        html: `
          <div style="font-family: sans-serif; color: #F0EBE1; background: #070707; padding: 40px; max-width: 560px;">
            <h1 style="color: #C9A84C; font-size: 28px; margin-bottom: 8px;">Welcome to LYCHO</h1>
            <p style="color: #6b6b6b; margin-bottom: 24px;">The universal AI agent platform for Pakistani and global businesses.</p>
            <p>You're <strong style="color: #C9A84C;">#${position}</strong> on the waitlist.</p>
            <p style="margin-top: 16px;">Your referral code: <code style="color: #C9A84C;">${referralCode}</code></p>
            <p style="color: #6b6b6b; font-size: 13px; margin-top: 32px;">Share your code to move up the list.</p>
          </div>
        `,
      })
    } catch {
      // Email failure is non-fatal — entry is still created
    }
  }

  return ok({ ...entry, position }, 'Added to waitlist', 201)
}
