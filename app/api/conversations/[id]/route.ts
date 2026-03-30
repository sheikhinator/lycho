import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/conversations/[id] — update status (resolve, escalate, etc.)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, userId, tenantId } = ctx

  let body: { status?: string }
  try { body = await req.json() } catch { return err('Invalid JSON', 'INVALID_BODY', 400) }

  const validStatuses = ['open', 'resolved', 'escalated', 'abandoned']
  if (body.status && !validStatuses.includes(body.status)) {
    return err(`status must be one of: ${validStatuses.join(', ')}`, 'VALIDATION_ERROR', 400)
  }

  const updatePayload: Record<string, unknown> = {}
  if (body.status) {
    updatePayload.status = body.status
    if (body.status === 'resolved') updatePayload.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('conversations')
    .update(updatePayload)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error || !data) return err('Conversation not found', 'NOT_FOUND', 404)

  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: `conversation.${body.status ?? 'updated'}`,
    resourceType: 'conversation',
    resourceId: id,
    metadata: { status: body.status },
  })

  return ok(data)
}
