import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'

// GET /api/automations/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)
  const { supabase, tenantId } = ctx

  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) return err('Not found', 'NOT_FOUND', 404)

  return ok({
    ...data,
    description:  (data.action_config as Record<string, unknown>)?._description ?? '',
    trigger:      { type: data.trigger_type, filters: (data.trigger_config as Record<string, unknown>)?.filters ?? {} },
    steps:        (data.action_config as Record<string, unknown>)?.steps ?? [],
  })
}

// PUT /api/automations/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)
  const { supabase, tenantId } = ctx

  let body: {
    name?: string
    description?: string
    trigger_config?: { type: string; filters?: Record<string, unknown> }
    steps?: unknown[]
    status?: string
  }
  try { body = await req.json() } catch { return err('Invalid JSON', 'INVALID_BODY', 400) }

  // Get current record first
  const { data: existing } = await supabase
    .from('automations')
    .select('action_config, trigger_config')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!existing) return err('Not found', 'NOT_FOUND', 404)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentSteps = (existing.action_config as any)?.steps ?? []
  const currentDesc  = (existing.action_config as any)?._description ?? ''

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.name)           updatePayload.name         = body.name
  if (body.status)         updatePayload.status       = body.status
  if (body.trigger_config) {
    updatePayload.trigger_type   = body.trigger_config.type
    updatePayload.trigger_config = body.trigger_config
  }
  if (body.steps !== undefined || body.description !== undefined) {
    updatePayload.action_config = {
      _description: body.description ?? currentDesc,
      steps:        body.steps       ?? currentSteps,
    }
    if (body.steps) {
      updatePayload.action_type = (body.steps as Array<{ type: string }>)?.[0]?.type ?? 'multi_step'
    }
  }

  const { data, error } = await supabase
    .from('automations')
    .update(updatePayload)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}

// DELETE /api/automations/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)
  const { supabase, tenantId } = ctx

  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok({ deleted: true })
}
