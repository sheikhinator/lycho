import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err, rateGuard } from '@/lib/api'
import { sanitiseInput } from '@/lib/sanitise'

// GET /api/agents — list all agents for the authenticated tenant
export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('tenant_id', tenantId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}

// POST /api/agents — create a new agent
export async function POST(req: NextRequest) {
  const rl = await rateGuard(req)
  if (rl) return rl

  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, userId, tenantId } = ctx

  let body: {
    agent_type: string
    display_name?: string
    channels?: string[]
    config?: Record<string, unknown>
  }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.agent_type) return err('agent_type is required', 'VALIDATION_ERROR', 400)

  if (body.display_name) {
    const s = sanitiseInput(body.display_name)
    if (!s.safe) return err('Invalid input detected', 'INVALID_INPUT', 400)
    body.display_name = s.cleaned
  }

  // Create the agent
  const { data: agent, error: insertError } = await supabase
    .from('agents')
    .insert({
      tenant_id: tenantId,
      agent_type: body.agent_type,
      display_name: body.display_name ?? null,
      channels: body.channels ?? [],
      config: body.config ?? {},
      status: 'configuring',
      version: 1,
    })
    .select()
    .single()

  if (insertError) return err(insertError.message, 'DB_ERROR', 500)

  // Create initial version snapshot
  await supabase.from('agent_versions').insert({
    agent_id: agent.id,
    tenant_id: tenantId,
    version: 1,
    config_snapshot: body.config ?? {},
    changed_by: userId,
    change_reason: 'initial_creation',
  })

  // Audit log
  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'agent.created',
    resourceType: 'agent',
    resourceId: agent.id,
    metadata: { agent_type: body.agent_type, display_name: body.display_name },
  })

  return ok(agent, 'Agent created', 201)
}
