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
        subject: `You're #${position} on the LYCHO waitlist`,
        html: `
          <div style="font-family: sans-serif; background: #070707; padding: 48px 40px; max-width: 560px; margin: 0 auto; border-radius: 16px;">
            <h1 style="color: #C9A84C; font-size: 32px; margin-bottom: 4px; letter-spacing: 4px;">LYCHO</h1>
            <p style="color: #6b6b6b; font-size: 12px; letter-spacing: 3px; margin-bottom: 32px;">INTELLIGENCE. TRANSMITTED.</p>

            <div style="background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
              <p style="color: #6b6b6b; font-size: 13px; margin-bottom: 8px;">You're</p>
              <p style="color: #F0EBE1; font-size: 48px; font-weight: 700; margin: 0 0 4px;">#${position}</p>
              <p style="color: #6b6b6b; font-size: 13px;">on the LYCHO waitlist</p>
            </div>

            <p style="color: #F0EBE1; font-size: 14px; margin-bottom: 8px;">Move up by referring friends:</p>
            <div style="background: #141414; border: 1px solid rgba(201,168,76,0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/?ref=${referralCode}" style="color: #C9A84C; font-size: 13px; word-break: break-all; text-decoration: none;">${process.env.NEXT_PUBLIC_APP_URL}/?ref=${referralCode}</a>
            </div>

            <a href="https://wa.me/?text=${encodeURIComponent(`I just joined the LYCHO waitlist — the AI platform that runs your business 24/7. Join here: ${process.env.NEXT_PUBLIC_APP_URL}/?ref=${referralCode}`)}"
               style="display: inline-block; background: #25D366; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; text-decoration: none; margin-bottom: 24px;">
              Share on WhatsApp
            </a>

            <p style="color: #6b6b6b; font-size: 12px; margin-top: 16px;">Each referral moves you up the list. Top 10 referrers get early access.</p>
          </div>
        `,
      })
    } catch {
      // Email failure is non-fatal — entry is still created
    }
  }

  return ok({ ...entry, position }, 'Added to waitlist', 201)
}
