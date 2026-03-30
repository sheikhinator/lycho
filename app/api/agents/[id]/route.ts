import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

// GET /api/agents/[id] — get single agent
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .neq('status', 'deleted')
    .single()

  if (error) return err('Agent not found', 'NOT_FOUND', 404)
  return ok(data)
}

// PUT /api/agents/[id] — update agent config and increment version
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, userId, tenantId } = ctx

  let body: {
    config?: Record<string, unknown>
    display_name?: string
    channels?: string[]
    status?: string
    confidence_threshold?: number
  }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  // Fetch current agent to get current version + config
  const { data: current, error: fetchError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .neq('status', 'deleted')
    .single()

  if (fetchError || !current) return err('Agent not found', 'NOT_FOUND', 404)

  const newVersion = current.version + 1

  // Validate status against allowlist to prevent business-logic abuse
  const VALID_STATUSES = ['active', 'paused', 'configuring'] as const
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
    return err(`Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`, 'INVALID_STATUS', 400)
  }

  // Build update payload (only include provided fields)
  const updatePayload: Record<string, unknown> = {
    version: newVersion,
    updated_at: new Date().toISOString(),
  }
  if (body.config !== undefined) updatePayload.config = body.config
  if (body.display_name !== undefined) updatePayload.display_name = body.display_name
  if (body.channels !== undefined) updatePayload.channels = body.channels
  if (body.status !== undefined) updatePayload.status = body.status
  if (body.confidence_threshold !== undefined) updatePayload.confidence_threshold = body.confidence_threshold

  const { data: updated, error: updateError } = await supabase
    .from('agents')
    .update(updatePayload)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (updateError) return err(updateError.message, 'DB_ERROR', 500)

  // Snapshot new version
  await supabase.from('agent_versions').insert({
    agent_id: id,
    tenant_id: tenantId,
    version: newVersion,
    config_snapshot: body.config ?? current.config,
    changed_by: userId,
    change_reason: 'config_update',
  })

  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'agent.updated',
    resourceType: 'agent',
    resourceId: id,
    metadata: { new_version: newVersion, fields_updated: Object.keys(body) },
  })

  return ok(updated, 'Agent updated')
}

// DELETE /api/agents/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, userId, tenantId } = ctx

  const { data, error } = await supabase
    .from('agents')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .neq('status', 'deleted')
    .select()
    .single()

  if (error || !data) return err('Agent not found', 'NOT_FOUND', 404)

  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'agent.deleted',
    resourceType: 'agent',
    resourceId: id,
  })

  return ok({ id: id }, 'Agent deleted')
}
