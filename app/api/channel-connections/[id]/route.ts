import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err } from '@/lib/api'
import { sanitiseInput } from '@/lib/sanitise'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  const { data, error } = await supabase
    .from('channel_connections')
    .select('*, agents(display_name, agent_type)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) return err(error.message, 'NOT_FOUND', 404)
  return ok(data)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  let body: {
    channel_identifier?: string
    display_name?: string
    credentials?: Record<string, unknown>
    config?: Record<string, unknown>
    status?: string
  }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  const validStatuses = ['active', 'paused', 'pending', 'deleted']
  if (body.status && !validStatuses.includes(body.status)) {
    return err(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 'VALIDATION_ERROR', 400)
  }

  if (body.display_name) {
    const s = sanitiseInput(body.display_name)
    if (!s.safe) return err('Invalid input detected', 'INVALID_INPUT', 400)
    body.display_name = s.cleaned
  }

  const { data, error } = await supabase
    .from('channel_connections')
    .update({
      ...(body.channel_identifier !== undefined && { channel_identifier: body.channel_identifier }),
      ...(body.display_name !== undefined && { display_name: body.display_name }),
      ...(body.credentials !== undefined && { credentials: body.credentials }),
      ...(body.config !== undefined && { config: body.config }),
      ...(body.status !== undefined && { status: body.status }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)
  if (!data) return err('Connection not found', 'NOT_FOUND', 404)

  await auditLog(supabase, {
    tenantId,
    actorId: ctx.userId,
    action: 'channel_connection.updated',
    resourceType: 'channel_connection',
    resourceId: id,
    metadata: { changes: Object.keys(body) },
  })

  return ok(data, 'Channel connection updated')
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  const { error } = await supabase
    .from('channel_connections')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return err(error.message, 'DB_ERROR', 500)

  await auditLog(supabase, {
    tenantId,
    actorId: ctx.userId,
    action: 'channel_connection.deleted',
    resourceType: 'channel_connection',
    resourceId: id,
  })

  return ok(null, 'Channel connection deleted')
}
