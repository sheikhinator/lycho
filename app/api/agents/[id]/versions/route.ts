import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'

type Params = { params: { id: string } }

// GET /api/agents/[id]/versions — list all version history for an agent
export async function GET(_req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  // Verify agent belongs to tenant
  const { error: agentError } = await supabase
    .from('agents')
    .select('id')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .single()

  if (agentError) return err('Agent not found', 'NOT_FOUND', 404)

  const { data, error } = await supabase
    .from('agent_versions')
    .select('id, version, changed_by, change_reason, created_at')
    .eq('agent_id', params.id)
    .eq('tenant_id', tenantId)
    .order('version', { ascending: false })

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}
