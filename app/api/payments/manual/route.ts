import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase'
import { Resend } from 'resend'

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? new Resend(apiKey) : null
}

// POST /api/payments/manual — submit a manual payment request
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { tenantId } = ctx

  let body: {
    plan: string
    billing_cycle?: string
    amount_pkr: number
    payment_method: string
    transaction_id?: string
    notes?: string
  }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.plan)            return err('plan is required', 'VALIDATION_ERROR', 400)
  if (!body.amount_pkr)      return err('amount_pkr is required', 'VALIDATION_ERROR', 400)
  if (!body.payment_method)  return err('payment_method is required', 'VALIDATION_ERROR', 400)

  const admin = createAdminClient()

  const { data: tenant } = await admin
    .from('tenants')
    .select('business_name, business_email')
    .eq('id', tenantId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payment, error } = await (admin as any)
    .from('payment_requests')
    .insert({
      tenant_id:      tenantId,
      plan:           body.plan,
      billing_cycle:  body.billing_cycle || 'monthly',
      amount_pkr:     body.amount_pkr,
      payment_method: body.payment_method,
      transaction_id: body.transaction_id || null,
      notes:          body.notes || null,
      status:         'pending',
    })
    .select()
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)

  const masterEmail = process.env.MASTER_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const resend = getResendClient()
  if (masterEmail && resend) {
    await resend.emails.send({
      from:    'LYCHO Payments <payments@lycho.ai>',
      to:      masterEmail,
      subject: `[LYCHO] Manual Payment — ${tenant?.business_name || tenantId} — PKR ${body.amount_pkr.toLocaleString()}`,
      html: `
<h2>Manual Payment Received</h2>
<p><strong>Business:</strong> ${tenant?.business_name || '-'}</p>
<p><strong>Email:</strong> ${tenant?.business_email || '-'}</p>
<p><strong>Plan:</strong> ${body.plan} (${body.billing_cycle || 'monthly'})</p>
<p><strong>Amount:</strong> PKR ${body.amount_pkr.toLocaleString()}</p>
<p><strong>Method:</strong> ${body.payment_method}</p>
<p><strong>Transaction ID:</strong> ${body.transaction_id || 'Not provided'}</p>
${body.notes ? `<p><strong>Notes:</strong> ${body.notes}</p>` : ''}
<p><strong>Payment Request ID:</strong> ${(payment as { id: string }).id}</p>
<hr>
<p><a href="${appUrl}/master">Activate in Master Panel →</a></p>
      `,
    }).catch(() => {})
  }

  return ok(
    { payment_id: (payment as { id: string }).id },
    'Payment request submitted. Your account will be activated within 24 hours after verification.',
  )
}
