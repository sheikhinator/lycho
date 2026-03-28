import { getAuthContext, ok, err } from '@/lib/api'

// GET /api/me — returns basic identity for the TopBar
export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)

  const { supabase, userId, tenantId } = ctx

  if (!tenantId) {
    return ok({ businessName: 'Your Business', initials: 'Y', planStatus: null, plan: null, trialDays: 0 })
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name, plan, plan_status, trial_ends_at')
    .eq('id', tenantId)
    .single()

  const businessName = tenant?.business_name ?? 'Your Business'
  const initials = businessName.charAt(0).toUpperCase()
  const trialEndsAt = tenant?.trial_ends_at ?? null
  const trialDays = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0

  return ok({
    userId,
    businessName,
    initials,
    plan: tenant?.plan ?? null,
    planStatus: tenant?.plan_status ?? null,
    trialDays,
  })
}
