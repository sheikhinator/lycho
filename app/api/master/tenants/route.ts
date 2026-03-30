import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ok, err, rateGuard, AUTH_LIMITS } from '@/lib/api'

// GET /api/master/tenants — all tenants with agent + conversation counts
export async function GET(req: NextRequest) {
  const limited = await rateGuard(req, AUTH_LIMITS)
  if (limited) return limited

  const expected = process.env.MASTER_SECRET
  if (!expected) return err('Master override not configured', 'NOT_CONFIGURED', 503)

  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== expected) return err('Invalid master secret', 'UNAUTHORIZED', 401)

  const admin = createAdminClient()

  // Fetch tenants + nested counts via PostgREST embedded resource
  const { data, error } = await admin
    .from('tenants')
    .select(`
      id,
      business_name,
      business_email,
      plan,
      plan_status,
      trial_ends_at,
      health_score,
      created_at,
      agents(count),
      conversations(count)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return err('Database error', 'DB_ERROR', 500)

  // Flatten the nested count objects returned by PostgREST
  const tenants = (data ?? []).map((t: any) => ({
    id:                 t.id,
    business_name:      t.business_name,
    business_email:     t.business_email,
    plan:               t.plan,
    plan_status:        t.plan_status,
    trial_ends_at:      t.trial_ends_at,
    health_score:       t.health_score,
    created_at:         t.created_at,
    agent_count:        t.agents?.[0]?.count ?? 0,
    conversation_count: t.conversations?.[0]?.count ?? 0,
  }))

  return ok(tenants)
}
