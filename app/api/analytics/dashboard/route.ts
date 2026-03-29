import { getAuthContext, ok, err } from '@/lib/api'

// GET /api/analytics/dashboard — KPIs for the authenticated tenant
export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  // Run queries in parallel
  const [
    interactionsRes,
    activeAgentsRes,
    tenantRes,
    revenueRes,
    recentActivityRes,
    agentsRes,
  ] = await Promise.all([
    // Total interactions
    supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),

    // Active agents
    supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active'),

    // Tenant health + churn
    supabase
      .from('tenants')
      .select('health_score, churn_risk_score')
      .eq('id', tenantId)
      .single(),

    // Monthly revenue — current period subscriptions
    supabase
      .from('subscriptions')
      .select('amount_pkr')
      .eq('tenant_id', tenantId)
      .gte('current_period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .lte('current_period_end', new Date().toISOString()),

    // Recent activity — last 10 conversations with metadata + messages
    supabase
      .from('conversations')
      .select('id, channel, status, contact_identifier, created_at, agent_id, metadata, messages')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10),

    // All agents for name lookup
    supabase
      .from('agents')
      .select('id, display_name, agent_type')
      .eq('tenant_id', tenantId),
  ])

  const monthlyRevenue = (revenueRes.data ?? []).reduce(
    (sum, sub) => sum + (sub.amount_pkr ?? 0),
    0,
  )

  // Build agent name map
  const agentMap: Record<string, string> = {}
  for (const a of agentsRes.data ?? []) {
    agentMap[a.id] = a.display_name ?? a.agent_type ?? 'Agent'
  }

  // Enrich recent activity with agent name and last message preview
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentActivity = (recentActivityRes.data ?? []).map((conv: any) => {
    const msgs = (conv.messages as Array<{ role: string; content: string }>) ?? []
    const lastMsg = msgs[msgs.length - 1]
    const lastMessagePreview = lastMsg?.content?.slice(0, 60) ?? ''

    return {
      id:                  conv.id,
      channel:             conv.channel,
      status:              conv.status,
      contact_identifier:  conv.contact_identifier,
      created_at:          conv.created_at,
      agent_id:            conv.agent_id,
      agent_name:          agentMap[conv.agent_id] ?? 'Agent',
      lead_score:          conv.metadata?.lead_score ?? 50,
      lead_label:          conv.metadata?.lead_label ?? 'cold',
      sentiment:           conv.metadata?.sentiment ?? 'neutral',
      last_message_preview: lastMessagePreview,
      escalated:           conv.status === 'escalated',
    }
  })

  return ok({
    total_interactions: interactionsRes.count ?? 0,
    active_agents: activeAgentsRes.count ?? 0,
    monthly_revenue: monthlyRevenue,
    health_score: tenantRes.data?.health_score ?? 50,
    churn_risk_score: tenantRes.data?.churn_risk_score ?? 0,
    recent_activity: recentActivity,
  })
}
