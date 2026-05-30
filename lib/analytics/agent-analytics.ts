import { admin } from '@/lib/admin'

const supabase = admin()

export interface AgentAnalytics {
  agentType: string
  displayName: string
  period: '24h' | '7d' | '30d' | 'all'
  metrics: {
    totalConversations: number
    activeConversations: number
    resolvedConversations: number
    escalatedConversations: number
    avgResponseTime: number
    avgLeadScore: number
    totalMessages: number
    satisfactionRate: number
    conversionRate: number
  }
  costMetrics: {
    totalCreditsUsed: number
    estimatedCostUsd: number
    avgCostPerConversation: number
  }
  trend: {
    conversationsChange: number
    leadScoreChange: number
    responseTimeChange: number
  }
  topIntents: { intent: string; count: number }[]
  hourlyActivity: { hour: number; count: number }[]
}

export async function getAgentAnalytics(
  agentType: string,
  period: '24h' | '7d' | '30d' | 'all' = '7d'
): Promise<AgentAnalytics> {
  const since = getSinceDate(period)

  const { data: agent } = await supabase
    .from('marketplace_agents')
    .select('display_name')
    .eq('agent_type', agentType)
    .single()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('agent_type', agentType)
    .gte('created_at', since)

  const totalConversations = conversations?.length || 0
  const active = conversations?.filter(c => c.status === 'active').length || 0
  const resolved = conversations?.filter(c => c.status === 'resolved').length || 0
  const escalated = conversations?.filter(c => c.status === 'escalated').length || 0

  const leadScores = conversations?.map(c => c.lead_score || 0) || []
  const avgLeadScore = leadScores.length > 0
    ? Math.round(leadScores.reduce((s, v) => s + v, 0) / leadScores.length)
    : 0

  const messages = conversations?.flatMap(c => (c.messages as any[]) || []) || []
  const totalMessages = messages.length

  const satisfactionRate = totalConversations > 0
    ? Math.round((resolved / totalConversations) * 100)
    : 100

  const converted = conversations?.filter(c => (c.lead_score || 0) >= 70).length || 0
  const conversionRate = totalConversations > 0
    ? Math.round((converted / totalConversations) * 100)
    : 0

  const estimatedCost = Math.round(totalMessages * 0.002 * 100) / 100
  const avgCostPerConversation = totalConversations > 0
    ? Math.round((estimatedCost / totalConversations) * 100) / 100
    : 0

  const previousSince = getSinceDate(period, true)
  const { data: prevConversations } = await supabase
    .from('conversations')
    .select('lead_score, created_at')
    .eq('agent_type', agentType)
    .gte('created_at', previousSince)
    .lt('created_at', since)

  const prevLeadScores = prevConversations?.map(c => c.lead_score || 0) || []
  const prevAvgLeadScore = prevLeadScores.length > 0
    ? Math.round(prevLeadScores.reduce((s, v) => s + v, 0) / prevLeadScores.length)
    : 0

  const conversationsChange = calculateChange(totalConversations, prevConversations?.length || 0)
  const leadScoreChange = calculateChange(avgLeadScore, prevAvgLeadScore)
  const responseTimeChange = 0

  const hourlyBuckets = new Array(24).fill(0)
  conversations?.forEach(c => {
    const hour = new Date(c.created_at).getHours()
    hourlyBuckets[hour]++
  })
  const hourlyActivity = hourlyBuckets.map((count, hour) => ({ hour, count }))

  const intents = extractIntents(conversations || [])

  return {
    agentType,
    displayName: agent?.display_name || agentType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    period,
    metrics: {
      totalConversations,
      activeConversations: active,
      resolvedConversations: resolved,
      escalatedConversations: escalated,
      avgResponseTime: 0,
      avgLeadScore,
      totalMessages,
      satisfactionRate,
      conversionRate,
    },
    costMetrics: {
      totalCreditsUsed: totalMessages,
      estimatedCostUsd: estimatedCost,
      avgCostPerConversation,
    },
    trend: {
      conversationsChange,
      leadScoreChange,
      responseTimeChange,
    },
    topIntents: intents.slice(0, 5),
    hourlyActivity,
  }
}

export async function getDashboardSummary(tenantId: string): Promise<{
  totalAgents: number
  activeAgents: number
  totalConversations: number
  avgHealthScore: number
  totalCost: number
  topPerformingAgents: AgentAnalytics[]
}> {
  const { data: agents } = await supabase
    .from('marketplace_agents')
    .select('agent_type, display_name')
    .eq('status', 'active')
    .limit(50)

  if (!agents?.length) {
    return { totalAgents: 0, activeAgents: 0, totalConversations: 0, avgHealthScore: 0, totalCost: 0, topPerformingAgents: [] }
  }

  const analytics = await Promise.all(
    agents.map(a => getAgentAnalytics(a.agent_type, '7d'))
  )

  const activeAgents = analytics.filter(a => a.metrics.totalConversations > 0)
  const totalConversations = analytics.reduce((s, a) => s + a.metrics.totalConversations, 0)
  const totalCost = analytics.reduce((s, a) => s + a.costMetrics.estimatedCostUsd, 0)
  const avgHealthScore = activeAgents.length > 0
    ? Math.round(activeAgents.reduce((s, a) => s + a.metrics.satisfactionRate, 0) / activeAgents.length)
    : 0

  const sorted = [...analytics].sort((a, b) => b.metrics.totalConversations - a.metrics.totalConversations)

  return {
    totalAgents: agents.length,
    activeAgents: activeAgents.length,
    totalConversations,
    avgHealthScore,
    totalCost: Math.round(totalCost * 100) / 100,
    topPerformingAgents: sorted.slice(0, 5),
  }
}

function getSinceDate(period: string, previous: boolean = false): string {
  const now = new Date()
  let days: number

  switch (period) {
    case '24h': days = previous ? 2 : 1; break
    case '7d': days = previous ? 14 : 7; break
    case '30d': days = previous ? 60 : 30; break
    default: days = previous ? 730 : 365; break
  }

  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function extractIntents(conversations: any[]): { intent: string; count: number }[] {
  const intentMap: Record<string, number> = {}
  for (const c of conversations) {
    const msgs = (c.messages as any[]) || []
    const firstUserMsg = msgs.find(m => m.role === 'user')
    if (firstUserMsg) {
      const text = String(firstUserMsg.content || '').toLowerCase()
      if (text.includes('price') || text.includes('cost') || text.includes('how much')) intentMap['pricing'] = (intentMap['pricing'] || 0) + 1
      else if (text.includes('help') || text.includes('support') || text.includes('issue')) intentMap['support'] = (intentMap['support'] || 0) + 1
      else if (text.includes('buy') || text.includes('purchase') || text.includes('subscribe')) intentMap['purchase'] = (intentMap['purchase'] || 0) + 1
      else if (text.includes('demo') || text.includes('trial')) intentMap['demo'] = (intentMap['demo'] || 0) + 1
      else intentMap['general_inquiry'] = (intentMap['general_inquiry'] || 0) + 1
    }
  }
  return Object.entries(intentMap)
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count)
}
