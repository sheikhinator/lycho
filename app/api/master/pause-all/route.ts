import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ok, err } from '@/lib/api'

// POST /api/master/pause-all — emergency master override, pauses all agents
// Requires header: MASTER_SECRET matching env MASTER_SECRET
export async function POST(req: NextRequest) {
  const secret = req.headers.get('MASTER_SECRET')
  const expected = process.env.MASTER_SECRET

  if (!expected) return err('Master override not configured', 'NOT_CONFIGURED', 503)
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

  if (error) return err(error.message, 'DB_ERROR', 500)

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
