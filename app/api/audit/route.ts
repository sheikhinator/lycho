import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'

const VALID_ACTIONS = [
  'all', 'agent.created', 'agent.updated', 'agent.deleted', 'agent.paused', 'agent.activated',
  'agent.rolled_back', 'conversation.deleted', 'team.invited', 'team.role_changed', 'team.removed',
  'channel.connected', 'channel.disconnected', 'tenant.updated', 'account.deleted',
  'forged_agent.created', 'syndicate.launched', 'simulation.started',
]

const ACTION_LABELS: Record<string, string> = {
  all: 'All Actions',
  'agent.created': 'Agent Created',
  'agent.updated': 'Agent Updated',
  'agent.deleted': 'Agent Deleted',
  'agent.paused': 'Agent Paused',
  'agent.activated': 'Agent Activated',
  'agent.rolled_back': 'Agent Rolled Back',
  'conversation.deleted': 'Conversation Deleted',
  'team.invited': 'Team Member Invited',
  'team.role_changed': 'Team Role Changed',
  'team.removed': 'Team Member Removed',
  'channel.connected': 'Channel Connected',
  'channel.disconnected': 'Channel Disconnected',
  'tenant.updated': 'Settings Updated',
  'account.deleted': 'Account Deleted',
  'forged_agent.created': 'Forge Agent Created',
  'syndicate.launched': 'Syndicate Launched',
  'simulation.started': 'Simulation Started',
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx
  const { searchParams } = new URL(req.url)

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50))
  const actionFilter = searchParams.get('action') || 'all'
  const startDate = searchParams.get('start_date') || ''
  const endDate = searchParams.get('end_date') || ''

  const offset = (page - 1) * limit

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (actionFilter !== 'all' && VALID_ACTIONS.includes(actionFilter)) {
    query = query.eq('action', actionFilter)
  }

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59.999Z`)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) return err(error.message, 'DB_ERROR', 500)

  const totalPages = count ? Math.ceil(count / limit) : 0

  return ok({
    entries: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
    filters: {
      actions: VALID_ACTIONS.map(a => ({ value: a, label: ACTION_LABELS[a] ?? a })),
    },
  })
}
