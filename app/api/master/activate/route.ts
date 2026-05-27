import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { Resend } from 'resend'

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? new Resend(apiKey) : null
}

// POST /api/master/activate — activate a tenant's plan (MASTER_SECRET required)
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { tenant_id: string; plan: string; billing_cycle?: string; payment_request_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.tenant_id || !body.plan) {
    return NextResponse.json({ error: 'tenant_id and plan are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Update tenant plan
  const { error: tenantErr } = await admin
    .from('tenants')
    .update({
      plan_status: 'active',
      plan:        body.plan,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', body.tenant_id)

  if (tenantErr) return NextResponse.json({ error: tenantErr.message }, { status: 500 })

  // Mark payment request(s) as approved
  if (body.payment_request_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('payment_requests')
      .update({ status: 'approved' })
      .eq('id', body.payment_request_id)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('payment_requests')
      .update({ status: 'approved' })
      .eq('tenant_id', body.tenant_id)
      .eq('status', 'pending')
  }

  // Send confirmation email to tenant
  const { data: tenant } = await admin
    .from('tenants')
    .select('business_email, business_name')
    .eq('id', body.tenant_id)
    .single()

  const resend = getResendClient()
  if (tenant?.business_email && resend) {
    await resend.emails.send({
      from:    'LYCHO <hello@lycho.ai>',
      to:      tenant.business_email,
      subject: `[LYCHO] Your account is now active — ${body.plan} plan`,
      html: `
<h2>Your LYCHO account is active!</h2>
<p>Hi ${tenant.business_name || 'there'},</p>
<p>Your payment has been confirmed and your account is now on the <strong>${body.plan}</strong> plan (${body.billing_cycle || 'monthly'} billing).</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard">Go to your Dashboard →</a></p>
<p>Thanks for choosing LYCHO!</p>
      `,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, message: 'Tenant activated successfully' })
}
