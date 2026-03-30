import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'

// GET /api/automations — list all for tenant
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)
  const { supabase, tenantId } = ctx

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('automations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: automations, error } = await query
  if (error) return err(error.message, 'DB_ERROR', 500)

  // Compute today's runs + success rates from automation_logs
  const today = new Date(); today.setHours(0, 0, 0, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logs } = await (supabase.from('automation_logs') as any)
    .select('automation_id, status')
    .eq('tenant_id', tenantId)
    .gte('created_at', today.toISOString())

  // Build per-automation stats
  const statsMap: Record<string, { runs_today: number; success: number; total: number }> = {}
  for (const log of logs ?? []) {
    if (!statsMap[log.automation_id]) statsMap[log.automation_id] = { runs_today: 0, success: 0, total: 0 }
    statsMap[log.automation_id].runs_today++
    statsMap[log.automation_id].total++
    if (log.status === 'success') statsMap[log.automation_id].success++
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = (automations ?? []).map((a: any) => {
    const s = statsMap[a.id] ?? { runs_today: 0, success: 0, total: 0 }
    return {
      id:            a.id,
      tenant_id:     a.tenant_id,
      name:          a.name,
      description:   (a.action_config as Record<string, unknown>)?._description ?? '',
      trigger_type:  a.trigger_type,
      trigger:       { type: a.trigger_type, filters: (a.trigger_config as Record<string, unknown>)?.filters ?? {} },
      trigger_config: a.trigger_config,
      steps:         (a.action_config as Record<string, unknown>)?.steps ?? [],
      status:        a.status,
      run_count:     a.run_count ?? 0,
      last_run_at:   a.last_run_at,
      created_at:    a.created_at,
      runs_today:    s.runs_today,
      success_rate:  s.total > 0 ? Math.round((s.success / s.total) * 100) : 100,
    }
  })

  return ok(enriched)
}

// POST /api/automations — create new
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)
  const { supabase, tenantId } = ctx

  let body: {
    name: string
    description?: string
    trigger_config: { type: string; filters?: Record<string, unknown> }
    steps: unknown[]
    status?: string
  }
  try { body = await req.json() } catch { return err('Invalid JSON', 'INVALID_BODY', 400) }

  if (!body.name) return err('name is required', 'VALIDATION_ERROR', 400)
  if (!body.trigger_config?.type) return err('trigger_config.type is required', 'VALIDATION_ERROR', 400)

  const { data, error } = await supabase
    .from('automations')
    .insert({
      tenant_id:      tenantId,
      name:           body.name,
      trigger_type:   body.trigger_config.type,
      trigger_config: body.trigger_config,
      action_type:    (body.steps as Array<{ type: string }>)?.[0]?.type ?? 'multi_step',
      action_config:  { _description: body.description ?? '', steps: body.steps ?? [] },
      status:         body.status ?? 'active',
    })
    .select()
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data, 'Automation created', 201)
}
