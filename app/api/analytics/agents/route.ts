import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'

interface ConvoRow {
  id: string
  agent_id: string
  channel: string
  created_at: string
  metadata: Record<string, unknown> | null
  escalated: boolean | null
  lead_score: number | null
}

// GET /api/analytics/agents — per-agent stats for last N days
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx
  const { searchParams } = new URL(req.url)
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') ?? '30', 10)))
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // Fetch agents
  const { data: agents } = await supabase
    .from('agents')
    .select('id, display_name, agent_type, status, interactions_count')
    .eq('tenant_id', tenantId)

  if (!agents || agents.length === 0) {
    return ok({ agents: [], summary: { total_conversations: 0, hot_leads: 0, avg_lead_score: 0, escalation_rate: 0 }, daily_volume: [], channels: [], top_agent: null })
  }

  // Fetch conversations in range — use any[] to handle schema type lag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawConvos } = await (supabase as any)
    .from('conversations')
    .select('id, agent_id, channel, created_at, metadata, escalated, lead_score')
    .eq('tenant_id', tenantId)
    .gte('created_at', since)

  const conversations: ConvoRow[] = rawConvos ?? []

  function getScore(c: ConvoRow): number {
    if (typeof c.lead_score === 'number') return c.lead_score
    const s = (c.metadata ?? {})?.lead_score
    return typeof s === 'number' ? s : 50
  }

  // Build per-agent stats
  const agentStats = agents.map(agent => {
    const agentConvos = conversations.filter(c => c.agent_id === agent.id)
    const total = agentConvos.length
    const hotLeads = agentConvos.filter(c => getScore(c) >= 85).length
    const escalations = agentConvos.filter(c => c.escalated).length
    const scores = agentConvos.map(c => getScore(c))
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const escalationRate = total > 0 ? Math.round((escalations / total) * 100) : 0
    const channels = [...new Set(agentConvos.map(c => c.channel).filter(Boolean))]

    return {
      id: agent.id,
      name: agent.display_name,
      agent_type: agent.agent_type,
      status: agent.status,
      total_conversations: total,
      hot_leads: hotLeads,
      avg_lead_score: avgScore,
      escalations,
      escalation_rate: escalationRate,
      top_channels: channels,
    }
  })

  // Daily volume for chart
  const dailyMap: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    dailyMap[d] = 0
  }
  for (const c of conversations) {
    const day = c.created_at.slice(0, 10)
    if (day in dailyMap) dailyMap[day]++
  }
  const daily_volume = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Channel distribution
  const channelMap: Record<string, number> = {}
  for (const c of conversations) {
    if (c.channel) channelMap[c.channel] = (channelMap[c.channel] ?? 0) + 1
  }
  const channels = Object.entries(channelMap).map(([name, value]) => ({ name, value }))

  // Summary
  const totalConvos = conversations.length
  const hotLeads = conversations.filter(c => getScore(c) >= 85).length
  const allScores = conversations.map(c => getScore(c))
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
  const escalations = conversations.filter(c => c.escalated).length
  const escalationRate = totalConvos > 0 ? Math.round((escalations / totalConvos) * 100) : 0

  const sorted = [...agentStats].sort((a, b) => b.total_conversations - a.total_conversations)
  const topAgent = sorted[0] ?? null

  return ok({
    agents: agentStats,
    summary: { total_conversations: totalConvos, hot_leads: hotLeads, avg_lead_score: avgScore, escalation_rate: escalationRate },
    daily_volume,
    channels,
    top_agent: topAgent,
  })
}
