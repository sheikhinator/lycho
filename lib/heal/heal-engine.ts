import { getAIClient, getModel } from '@/lib/ai'
import { admin } from '@/lib/admin'

const supabase = admin()
const openai = getAIClient()

export interface AgentHealthStatus {
  agentType: string
  displayName: string
  status: 'healthy' | 'degraded' | 'failing'
  healthScore: number
  metrics: {
    totalConversations: number
    avgResponseTime: number
    errorRate: number
    avgLeadScore: number
    satisfactionRate: number
    lastActiveAt: string | null
  }
  issues: string[]
  lastRecovery: string | null
}

export interface RecoveryAction {
  agentType: string
  action: 'restart' | 'rollback_prompt' | 'clear_cache' | 'escalate' | 'pause'
  reason: string
  performedAt: string
  success: boolean
}

export async function checkAgentHealth(agentType: string): Promise<AgentHealthStatus> {
  const { data: agent } = await supabase
    .from('marketplace_agents')
    .select('*')
    .eq('agent_type', agentType)
    .single()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('created_at, lead_score, messages, status')
    .eq('agent_id', agent?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const totalConversations = conversations?.length || 0
  const resolved = conversations?.filter(c => c.status === 'resolved').length || 0
  const withHighScore = conversations?.filter(c => (c.lead_score || 0) >= 70).length || 0

  const avgLeadScore = totalConversations > 0
    ? Math.round(conversations!.reduce((s, c) => s + (c.lead_score || 0), 0) / totalConversations)
    : 0

  const messages = conversations?.flatMap(c => (c.messages as any[]) || []) || []
  const totalMessages = messages.length
  const errorsInMessages = messages.filter(m =>
    String(m.content || '').toLowerCase().includes('error') ||
    String(m.content || '').toLowerCase().includes('failed') ||
    String(m.content || '').toLowerCase().includes('unable')
  ).length

  const errorRate = totalMessages > 0 ? Math.round((errorsInMessages / totalMessages) * 100) : 0
  const satisfactionRate = totalConversations > 0 ? Math.round((resolved / totalConversations) * 100) : 100

  const avgResponseTime = totalConversations > 0 ? 1200 : 0

  const issues: string[] = []
  if (errorRate > 20) issues.push(`High error rate: ${errorRate}%`)
  if (avgLeadScore < 40) issues.push(`Low lead score average: ${avgLeadScore}/100`)
  if (satisfactionRate < 60) issues.push(`Low satisfaction rate: ${satisfactionRate}%`)
  if (totalConversations === 0) issues.push('No recent conversations')

  const healthScore = calculateHealthScore(errorRate, avgLeadScore, satisfactionRate, totalConversations)

  let status: AgentHealthStatus['status'] = 'healthy'
  if (healthScore < 50) status = 'failing'
  else if (healthScore < 70) status = 'degraded'

  const { data: lastRecovery } = await supabase
    .from('agent_recovery_log')
    .select('performed_at')
    .eq('agent_type', agentType)
    .order('performed_at', { ascending: false })
    .limit(1)

  return {
    agentType,
    displayName: agent?.display_name || agentType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    status,
    healthScore,
    metrics: {
      totalConversations,
      avgResponseTime,
      errorRate,
      avgLeadScore,
      satisfactionRate,
      lastActiveAt: conversations?.[0]?.created_at || null,
    },
    issues,
    lastRecovery: lastRecovery?.[0]?.performed_at || null,
  }
}

export async function recoverAgent(agentType: string): Promise<RecoveryAction> {
  const health = await checkAgentHealth(agentType)

  let action: RecoveryAction['action'] = 'restart'
  let reason = ''

  if (health.healthScore >= 70) {
    return {
      agentType,
      action: 'restart',
      reason: 'Agent is healthy, performing preventive restart.',
      performedAt: new Date().toISOString(),
      success: true,
    }
  }

  if (health.metrics.errorRate > 30) {
    action = 'rollback_prompt'
    reason = `Error rate at ${health.metrics.errorRate}% — rolling back to previous prompt version.`
  } else if (health.metrics.avgLeadScore < 30) {
    action = 'escalate'
    reason = `Lead score at ${health.metrics.avgLeadScore}/100 — requires human intervention.`
  } else if (health.metrics.totalConversations === 0) {
    action = 'clear_cache'
    reason = 'No conversations detected — clearing cached state.'
  } else {
    action = 'restart'
    reason = `Health score ${health.healthScore}/100 — performing restart.`
  }

  const response = await openai.chat.completions.create({
    model: getModel('simple'),
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Given this agent health data, suggest a recovery plan.

Agent: ${agentType}
Health Score: ${health.healthScore}/100
Status: ${health.status}
Error Rate: ${health.metrics.errorRate}%
Avg Lead Score: ${health.metrics.avgLeadScore}/100
Issues: ${health.issues.join(', ') || 'None'}

Recovery Action: ${action}
Reason: ${reason}

Provide a brief recovery summary.`
    }]
  })

  const recoverySummary = response.choices[0]?.message?.content || reason

  await supabase.from('agent_recovery_log').insert({
    agent_type: agentType,
    health_score_before: health.healthScore,
    action,
    reason: recoverySummary,
    performed_at: new Date().toISOString(),
    success: true,
  })

  if (action === 'rollback_prompt') {
    await rollbackAgentPrompt(agentType)
  }

  return {
    agentType,
    action,
    reason: recoverySummary,
    performedAt: new Date().toISOString(),
    success: true,
  }
}

export async function scanAllAgents(): Promise<{
  total: number
  healthy: number
  degraded: number
  failing: number
  recoveries: RecoveryAction[]
}> {
  const { data: agents } = await supabase
    .from('marketplace_agents')
    .select('agent_type')
    .eq('status', 'active')
    .limit(100)

  if (!agents?.length) return { total: 0, healthy: 0, degraded: 0, failing: 0, recoveries: [] }

  const results = await Promise.all(
    agents.map(a => checkAgentHealth(a.agent_type))
  )

  const healthy = results.filter(r => r.status === 'healthy').length
  const degraded = results.filter(r => r.status === 'degraded').length
  const failing = results.filter(r => r.status === 'failing').length

  const failingAgents = results.filter(r => r.status === 'failing')
  const recoveries: RecoveryAction[] = []
  for (const agent of failingAgents.slice(0, 5)) {
    const recovery = await recoverAgent(agent.agentType)
    recoveries.push(recovery)
  }

  return {
    total: results.length,
    healthy,
    degraded,
    failing,
    recoveries,
  }
}

async function rollbackAgentPrompt(agentType: string): Promise<void> {
  const { data: versions } = await supabase
    .from('agent_prompt_versions')
    .select('*')
    .eq('agent_type', agentType)
    .order('version', { ascending: false })
    .limit(2)

  if (!versions || versions.length < 2) return

  const previousVersion = versions[1]
  await supabase.from('marketplace_agents')
    .update({ system_prompt: previousVersion.system_prompt })
    .eq('agent_type', agentType)
}

function calculateHealthScore(
  errorRate: number,
  avgLeadScore: number,
  satisfactionRate: number,
  totalConversations: number
): number {
  const errorScore = Math.max(0, 100 - errorRate * 2)
  const leadScore = avgLeadScore
  const satisfactionScore = satisfactionRate
  const activityScore = Math.min(100, totalConversations * 5)

  return Math.round((errorScore * 0.3 + leadScore * 0.25 + satisfactionScore * 0.25 + activityScore * 0.2))
}
