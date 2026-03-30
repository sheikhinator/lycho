import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'

// POST /api/automations/[id]/toggle — active ↔ paused
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)
  const { supabase, tenantId } = ctx

  const { data: existing } = await supabase
    .from('automations')
    .select('status')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!existing) return err('Not found', 'NOT_FOUND', 404)

  const newStatus = existing.status === 'active' ? 'paused' : 'active'

  const { data, error } = await supabase
    .from('automations')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .select('id, status')
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}
