import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ok, err, rateGuard, AUTH_LIMITS } from '@/lib/api'
import { sanitiseInput } from '@/lib/sanitise'

function generateReferralCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// POST /api/waitlist — add to waitlist and send welcome email
export async function POST(req: NextRequest) {
  const rl = await rateGuard(req, AUTH_LIMITS)
  if (rl) return rl

  let body: { email: string; name?: string; business_type?: string; referred_by?: string }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.email) return err('email is required', 'VALIDATION_ERROR', 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return err('Invalid email address', 'VALIDATION_ERROR', 400)
  }

  // Sanitise text inputs
  if (body.name) {
    const s = sanitiseInput(body.name)
    if (!s.safe) return err('Invalid input detected', 'INVALID_INPUT', 400)
    body.name = s.cleaned
  }

  const supabase = createAdminClient()

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

  // If a referral code was supplied — increment referrer's count (non-fatal)
  if (body.referred_by) {
    const { data: referrer } = await supabase
      .from('waitlist')
      .select('id, referral_count')
      .eq('referral_code', body.referred_by.toUpperCase())
      .single()

    if (referrer) {
      await supabase
        .from('waitlist')
        .update({ referral_count: (referrer.referral_count ?? 0) + 1 })
        .eq('id', referrer.id)
    }
  }

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
            <p style="margin-top: 16px;">Your referral link:</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/?ref=${referralCode}" style="color: #C9A84C; word-break: break-all;">${process.env.NEXT_PUBLIC_APP_URL}/?ref=${referralCode}</a>
            <p style="color: #6b6b6b; font-size: 13px; margin-top: 32px;">Share your link to move up the list.</p>
          </div>
        `,
      })
    } catch {
      // Email failure is non-fatal — entry is still created
    }
  }

  return ok({ ...entry, position }, 'Added to waitlist', 201)
}
