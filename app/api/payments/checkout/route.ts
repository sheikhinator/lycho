import { NextRequest } from 'next/server'
import { getAuthContext, ok, err, rateGuard, DEFAULT_LIMITS } from '@/lib/api'
import { calculateAmount } from '@/lib/payments/pricing'
import { initiateSafepayCheckout } from '@/lib/payments/safepay'
import { initiateXpayCheckout } from '@/lib/payments/xpay'

const VALID_PLANS = ['starter', 'growth', 'business', 'enterprise'] as const
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'
const PROVIDERS_CONFIGURED =
  process.env.SAFEPAY_API_KEY !== 'placeholder' ||
  process.env.XPAY_API_KEY !== 'placeholder'

export async function POST(req: NextRequest) {
  const limited = await rateGuard(req, DEFAULT_LIMITS)
  if (limited) return limited

  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorised', 'UNAUTHORISED', 401)
  if (!ctx.tenantId) return err('Tenant not found', 'NO_TENANT', 400)

  const body = await req.json().catch(() => null)
  if (!body) return err('Invalid request body', 'BAD_BODY', 400)

  const { plan, billing_cycle, provider, trial, currency = 'PKR' } = body as {
    plan: string
    billing_cycle: 'monthly' | 'annual'
    provider: 'safepay' | 'xpay'
    trial?: boolean
    currency?: string
  }

  if (!VALID_PLANS.includes(plan as (typeof VALID_PLANS)[number])) {
    return err('Invalid plan', 'INVALID_PLAN', 400)
  }
  if (!['monthly', 'annual'].includes(billing_cycle)) {
    return err('Invalid billing cycle', 'INVALID_CYCLE', 400)
  }
  if (!['safepay', 'xpay'].includes(provider)) {
    return err('Invalid provider', 'INVALID_PROVIDER', 400)
  }

  // Trial override — always PKR 999 regardless of plan
  const amount = trial ? 999 : calculateAmount(plan, billing_cycle, currency)
  if (!amount) return err('Could not calculate amount', 'CALC_ERROR', 400)

  if (!PROVIDERS_CONFIGURED) {
    return ok({
      mock: true,
      message: 'Payment coming soon. Email hello@lycho.app to activate.',
    })
  }

  const successUrl = trial
    ? `${APP_URL}/dashboard?status=trial_started&plan=${plan}`
    : `${APP_URL}/dashboard/billing?status=success&plan=${plan}`
  const cancelUrl = `${APP_URL}/dashboard/activate?status=cancelled`

  let result: { checkout_url: string | null; error?: string }

  if (provider === 'safepay') {
    result = await initiateSafepayCheckout(amount, plan, ctx.tenantId, successUrl, cancelUrl)
  } else {
    result = await initiateXpayCheckout(amount, plan, ctx.tenantId, successUrl, cancelUrl)
  }

  if (!result.checkout_url) {
    return ok({
      mock: true,
      message: 'Payment coming soon. Email hello@lycho.app to activate.',
    })
  }

  return ok({ checkout_url: result.checkout_url })
}
