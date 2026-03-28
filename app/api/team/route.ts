import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase'

// GET /api/team — list team members for tenant
export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx
  const admin = createAdminClient()

  // Get users for this tenant
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, role, email_verified, last_login_at, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (error) return err(error.message, 'DB_ERROR', 500)

  // Enrich with emails from auth.users (admin only)
  const enriched = await Promise.all(
    (users ?? []).map(async u => {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(u.id)
        return { ...u, email: authUser?.user?.email ?? null }
      } catch {
        return { ...u, email: null }
      }
    })
  )

  return ok(enriched)
}

// POST /api/team — invite a new team member
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, userId, tenantId } = ctx

  // Only owners/admins can invite
  const { data: inviter } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
    return err('Only owners and admins can invite members', 'FORBIDDEN', 403)
  }

  let body: { email: string; role: string }
  try { body = await req.json() } catch { return err('Invalid JSON', 'INVALID_BODY', 400) }

  if (!body.email) return err('email is required', 'VALIDATION_ERROR', 400)
  if (!body.role)  return err('role is required', 'VALIDATION_ERROR', 400)

  const validRoles = ['admin', 'member', 'viewer']
  if (!validRoles.includes(body.role)) {
    return err(`role must be one of: ${validRoles.join(', ')}`, 'VALIDATION_ERROR', 400)
  }

  const admin = createAdminClient()

  // Invite via Supabase auth (sends email)
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    body.email,
    { data: { tenant_id: tenantId, role: body.role } }
  )

  if (inviteError) return err(inviteError.message, 'INVITE_ERROR', 500)

  // Create users row
  await admin.from('users').upsert({
    id: invited.user.id,
    tenant_id: tenantId,
    role: body.role,
  }, { onConflict: 'id' })

  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'team.member_invited',
    resourceType: 'user',
    resourceId: invited.user.id,
    metadata: { email: body.email, role: body.role },
  })

  return ok({ id: invited.user.id, email: body.email, role: body.role }, 'Invitation sent', 201)
}
