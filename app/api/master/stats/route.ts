import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ok, err, rateGuard, AUTH_LIMITS } from '@/lib/api'

// GET /api/master/stats — platform-wide KPI snapshot for master dashboard
export async function GET(req: NextRequest) {
  const limited = await rateGuard(req, AUTH_LIMITS)
  if (limited) return limited

  const expected = process.env.MASTER_SECRET
  if (!expected) return err('Master override not configured', 'NOT_CONFIGURED', 503)

  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== expected) return err('Invalid master secret', 'UNAUTHORIZED', 401)

  const admin = createAdminClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Run all queries in parallel for speed
  const [
    { count: total_tenants },
    { count: active_trials },
    { count: paying_clients },
    { data: mrrData },
    { count: interactions_today },
    { count: agents_deployed },
    { data: recent_signups },
  ] = await Promise.all([
    admin.from('tenants').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    admin.from('tenants').select('*', { count: 'exact', head: true }).eq('plan_status', 'trialing').is('deleted_at', null),
    admin.from('tenants').select('*', { count: 'exact', head: true }).eq('plan_status', 'active').is('deleted_at', null),
    admin.from('subscriptions').select('amount_pkr').eq('status' as never, 'active'),
    admin.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    admin.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('tenants')
      .select('id, business_name, plan, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const total_mrr_pkr = (mrrData ?? []).reduce((sum, s) => sum + (Number(s.amount_pkr) || 0), 0)

  return ok({
    total_tenants:      total_tenants ?? 0,
    active_trials:      active_trials ?? 0,
    paying_clients:     paying_clients ?? 0,
    total_mrr_pkr,
    interactions_today: interactions_today ?? 0,
    agents_deployed:    agents_deployed ?? 0,
    recent_signups:     recent_signups ?? [],
  })
}
