import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ok, err, rateGuard, AUTH_LIMITS } from '@/lib/api'

// POST /api/master/pause-all — emergency master override, pauses all agents
// Requires header: x-master-secret matching env MASTER_SECRET
export async function POST(req: NextRequest) {
  // Rate-limit BEFORE checking the secret so brute-force is not possible
  const limited = await rateGuard(req, AUTH_LIMITS)
  if (limited) return limited

  const expected = process.env.MASTER_SECRET
  // Fail CLOSED — if secret is not configured, deny all requests
  if (!expected) return err('Master override not configured', 'NOT_CONFIGURED', 503)

  // Use lowercase header name — HTTP headers are case-insensitive and many
  // proxies normalise to lowercase, so reading a mixed-case header is unreliable.
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== expected) {
    return err('Invalid master secret', 'UNAUTHORIZED', 401)
  }

  // Use admin client — bypasses RLS to hit all tenants
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('agents')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .not('status', 'in', '("deleted","paused")')
    .select('id')

  if (error) return err('Database error', 'DB_ERROR', 500)

  const agentsStopped = data?.length ?? 0

  // Audit log — no tenant scope since this is cross-tenant
  await admin.from('audit_log').insert({
    tenant_id: null,
    actor_type: 'system',
    actor_id: 'master_override',
    action: 'master.pause_all',
    resource_type: 'agents',
    metadata: { agents_stopped: agentsStopped },
  })

  return ok({ paused: true, agents_stopped: agentsStopped })
}
