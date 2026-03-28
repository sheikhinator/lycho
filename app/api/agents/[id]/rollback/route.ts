import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err } from '@/lib/api'

type Params = { params: { id: string } }

// POST /api/agents/[id]/rollback — restore a previous config version
export async function POST(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, userId, tenantId } = ctx

  let body: { version: number }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (typeof body.version !== 'number') {
    return err('version (number) is required', 'VALIDATION_ERROR', 400)
  }

  // Verify agent belongs to tenant
  const { data: current, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .neq('status', 'deleted')
    .single()

  if (agentError || !current) return err('Agent not found', 'NOT_FOUND', 404)

  // Fetch the target version snapshot
  const { data: snapshot, error: snapError } = await supabase
    .from('agent_versions')
    .select('*')
    .eq('agent_id', params.id)
    .eq('tenant_id', tenantId)
    .eq('version', body.version)
    .single()

  if (snapError || !snapshot) {
    return err(`Version ${body.version} not found`, 'VERSION_NOT_FOUND', 404)
  }

  const newVersion = current.version + 1

  // Apply the snapshot config
  const { data: updated, error: updateError } = await supabase
    .from('agents')
    .update({
      config: snapshot.config_snapshot ?? {},
      version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (updateError) return err(updateError.message, 'DB_ERROR', 500)

  // Record the rollback as a new version entry
  await supabase.from('agent_versions').insert({
    agent_id: params.id,
    tenant_id: tenantId,
    version: newVersion,
    config_snapshot: snapshot.config_snapshot,
    changed_by: userId,
    change_reason: `rollback_to_v${body.version}`,
  })

  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'agent.rolled_back',
    resourceType: 'agent',
    resourceId: params.id,
    metadata: { rolled_back_to_version: body.version, new_version: newVersion },
  })

  return ok(updated, `Rolled back to version ${body.version}`)
}
