import { createHmac } from 'crypto'

const BASE = process.env.SAFEPAY_ENV === 'production'
  ? 'https://api.getsafepay.com'
  : 'https://sandbox.api.getsafepay.com'

export async function initiateSafepayCheckout(
  amount_pkr: number,
  plan: string,
  tenantId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ checkout_url: string | null; error?: string }> {
  if (!process.env.SAFEPAY_API_KEY) return { checkout_url: null, error: 'Payment integration pending' }
  try {
    const res = await fetch(`${BASE}/order/v1/init/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SFPY-MERCHANT-SECRET': process.env.SAFEPAY_API_KEY,
      },
      body: JSON.stringify({
        amount: amount_pkr * 100,
        currency: 'PKR',
        order_id: `lycho_${tenantId}_${Date.now()}`,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { plan, tenant_id: tenantId },
      }),
    })
    if (!res.ok) return { checkout_url: null, error: 'Safepay request failed' }
    const data = await res.json()
    return { checkout_url: data?.data?.checkout_url ?? null }
  } catch {
    return { checkout_url: null, error: 'Payment integration error' }
  }
}

export function verifySafepayWebhook(payload: string, signature: string): boolean {
  if (!process.env.SAFEPAY_SECRET_KEY) return false
  const expected = createHmac('sha256', process.env.SAFEPAY_SECRET_KEY).update(payload).digest('hex')
  return signature === expected
}
