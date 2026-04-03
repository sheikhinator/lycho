import { createAdminClient } from '@/lib/supabase'
import { sendTrialExpiry } from '@/lib/email-service'
import { createNotification } from '@/lib/notifications/notification-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authHeader = process.env.CRON_SECRET
  if (!authHeader) {
    return Response.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const supabase = createAdminClient()

  const now = new Date().toISOString()

  const { data: expiringTenants, error: fetchError } = await supabase
    .from('tenants')
    .select('id, business_name, business_email, plan_status, trial_ends_at')
    .eq('plan_status', 'trialing')
    .lt('trial_ends_at', now)

  if (fetchError) {
    return Response.json({ ok: false, error: fetchError.message }, { status: 500 })
  }

  if (!expiringTenants || expiringTenants.length === 0) {
    return Response.json({ ok: true, expired: 0, message: 'No trials to expire' })
  }

  const expired: string[] = []
  const errors: string[] = []

  for (const tenant of expiringTenants) {
    try {
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ plan_status: 'expired' })
        .eq('id', tenant.id)

      if (updateError) {
        errors.push(`${tenant.business_name}: ${updateError.message}`)
        continue
      }

      if (tenant.business_email) {
        await sendTrialExpiry(tenant.business_email, tenant.business_name, 0)
      }

      try {
        await createNotification(
          tenant.id,
          'trial_expiring',
          'Trial Expired',
          `Your LYCHO trial has expired. Upgrade to continue using all features.`,
          '/dashboard/billing',
          supabase,
        )
      } catch {
        errors.push(`${tenant.business_name}: notification failed`)
      }

      expired.push(tenant.id)
    } catch (e) {
      errors.push(`${tenant.business_name}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  const { data: warningTenants } = await supabase
    .from('tenants')
    .select('id, business_name, business_email, trial_ends_at')
    .eq('plan_status', 'trialing')
    .gte('trial_ends_at', now)
    .lte('trial_ends_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())

  const warned: string[] = []
  if (warningTenants) {
    for (const tenant of warningTenants) {
      try {
        if (!tenant.trial_ends_at) continue
        const daysRemaining = Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (tenant.business_email && daysRemaining >= 0) {
          await sendTrialExpiry(tenant.business_email, tenant.business_name, daysRemaining)
        }
        warned.push(tenant.id)
      } catch {
        errors.push(`${tenant.business_name}: warning email failed`)
      }
    }
  }

  return Response.json({
    ok: true,
    expired: expired.length,
    expired_ids: expired,
    warned: warned.length,
    warned_ids: warned,
    errors,
  })
}
