import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifySafepayWebhook } from '@/lib/payments/safepay'
import { verifyXpayWebhook } from '@/lib/payments/xpay'
import { Resend } from 'resend'

const FROM = 'LYCHO <alerts@lycho.ai>'

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? new Resend(apiKey) : null
}

// Always return 200 to webhooks — even on error — so providers don't retry
function webhook200(msg = 'ok') {
  return NextResponse.json({ received: true, msg }, { status: 200 })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params
  const payload = await req.text()

  // ── Signature verification ────────────────────────────────────────────────
  let verified = false

  if (provider === 'safepay') {
    const sig = req.headers.get('x-sfpy-signature') ?? ''
    verified = verifySafepayWebhook(payload, sig)
  } else if (provider === 'xpay') {
    const sig = req.headers.get('x-xpay-signature') ?? ''
    verified = verifyXpayWebhook(payload, sig)
  } else {
    return webhook200('unknown provider')
  }

  if (!verified) return webhook200('signature mismatch — ignored')

  // ── Parse payload ─────────────────────────────────────────────────────────
  let data: Record<string, unknown>
  try {
    data = JSON.parse(payload)
  } catch {
    return webhook200('invalid json')
  }

  // Normalise metadata across providers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = ((data?.metadata ?? (data?.data as any)?.metadata ?? {}) as Record<string, string>)
  const tenantId  = metadata?.tenant_id
  const plan      = metadata?.plan

  if (!tenantId || !plan) return webhook200('missing metadata')

  const admin = createAdminClient()

  // ── Determine if trial payment ────────────────────────────────────────────
  const isTrial = metadata?.is_trial === 'true'
  const trialEndsAt = isTrial
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null

  // ── Update tenant plan ────────────────────────────────────────────────────
  await admin
    .from('tenants')
    .update({
      plan,
      plan_status:   isTrial ? 'trial' : 'active',
      trial_ends_at: trialEndsAt,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', tenantId)

  // ── Insert subscription record ────────────────────────────────────────────
  await admin.from('subscriptions').insert({
    tenant_id:    tenantId,
    plan,
    provider,
    status:       isTrial ? 'trial' : 'active',
    activated_at: new Date().toISOString(),
    raw_payload:  data,
  })

  // ── Send confirmation email ───────────────────────────────────────────────
  try {
    const { data: tenantRow } = await admin
      .from('tenants')
      .select('business_email, business_name')
      .eq('id', tenantId)
      .single()

    const resend = getResendClient()
    if (tenantRow?.business_email && resend) {
      await resend.emails.send({
        from: FROM,
        to: tenantRow.business_email,
        subject: 'Your LYCHO subscription is active',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#F0EBE1;background:#070707;padding:32px;border-radius:12px">
            <h1 style="color:#C9A84C;font-size:24px;margin-bottom:8px">Subscription Activated</h1>
            <p style="color:#a0a0a0;margin-bottom:24px">Hi ${tenantRow.business_name ?? 'there'},</p>
            <p>Your <strong style="color:#C9A84C">${plan.charAt(0).toUpperCase() + plan.slice(1)}</strong> plan is now active. You have full access to all features included in your plan.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'}/dashboard" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#C9A84C;color:#070707;border-radius:8px;text-decoration:none;font-weight:600">Open Dashboard</a>
            <p style="margin-top:32px;font-size:12px;color:#555">Questions? Reply to this email or reach us at hello@lycho.app</p>
          </div>
        `,
      })
    }
  } catch {
    // Email failure is non-fatal
  }

  return webhook200('processed')
}
