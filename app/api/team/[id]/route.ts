import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

// PUT /api/team/[id] — update team member role
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, userId, tenantId } = ctx

  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!actor || !['owner', 'admin'].includes(actor.role)) {
    return err('Only owners and admins can change roles', 'FORBIDDEN', 403)
  }

  // Cannot change role of the owner
  const { data: target } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!target) return err('User not found', 'NOT_FOUND', 404)
  if (target.role === 'owner') return err('Cannot change the owner role', 'FORBIDDEN', 403)

  let body: { role: string }
  try { body = await req.json() } catch { return err('Invalid JSON', 'INVALID_BODY', 400) }

  const validRoles = ['admin', 'member', 'viewer']
  if (!validRoles.includes(body.role)) {
    return err(`role must be one of: ${validRoles.join(', ')}`, 'VALIDATION_ERROR', 400)
  }

  const { error } = await supabase
    .from('users')
    .update({ role: body.role })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return err(error.message, 'DB_ERROR', 500)

  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'team.role_changed',
    resourceType: 'user',
    resourceId: id,
    metadata: { new_role: body.role },
  })

  return ok({ id: id, role: body.role }, 'Role updated')
}

// DELETE /api/team/[id] — remove team member
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, userId, tenantId } = ctx

  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!actor || !['owner', 'admin'].includes(actor.role)) {
    return err('Only owners and admins can remove members', 'FORBIDDEN', 403)
  }

  const { data: target } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!target) return err('User not found', 'NOT_FOUND', 404)
  if (target.role === 'owner') return err('Cannot remove the owner', 'FORBIDDEN', 403)

  const admin = createAdminClient()

  // Remove from tenant (null out tenant_id rather than deleting auth user)
  await supabase
    .from('users')
    .update({ tenant_id: null })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'team.member_removed',
    resourceType: 'user',
    resourceId: id,
  })

  // Suppress unused var warning
  void admin

  return ok({ id: id }, 'Member removed')
}
