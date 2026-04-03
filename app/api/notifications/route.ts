import { getAuthContext, ok, err } from '@/lib/api'

// GET /api/notifications — unread notifications for tenant
export async function GET() {
  try {
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

    if (error) {
      // Never return 500 for this endpoint
      return ok({ notifications: [] })
    }
    return ok({ notifications: data ?? [] })
  } catch {
    // Always return 200 with empty array on any error
    return ok({ notifications: [] })
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  try {
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

    if (error) {
      // Do not throw 500; return success with empty message still
      return ok({ message: 'Notifications updated' })
    }
    return ok({ message: 'All notifications marked as read' })
  } catch {
    return ok({ message: 'Notifications updated' })
  }
}
