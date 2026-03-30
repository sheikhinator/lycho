import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'

// GET /api/automations/[id]/logs — paginated run logs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)
  const { supabase, tenantId } = ctx

  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = 20
  const from  = (page - 1) * limit
  const to    = from + limit - 1

  // Verify this automation belongs to this tenant
  const { data: automation } = await supabase
    .from('automations')
    .select('id, name')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!automation) return err('Not found', 'NOT_FOUND', 404)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logs, error, count } = await (supabase.from('automation_logs') as any)
    .select('*', { count: 'exact' })
    .eq('automation_id', id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return err(error.message, 'DB_ERROR', 500)

  return ok({ logs: logs ?? [], total: count ?? 0, page, limit })
}
