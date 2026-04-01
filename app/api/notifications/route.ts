import { getAuthContext, ok, err } from '@/lib/api'

// GET /api/notifications — unread notifications for tenant
export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notifications')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok({ notifications: data ?? [] })
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ read: true })
    .eq('tenant_id', tenantId)
    .eq('read', false)

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok({ message: 'All notifications marked as read' })
}
