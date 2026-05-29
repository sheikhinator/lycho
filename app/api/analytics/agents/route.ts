import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { admin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const supabaseAdmin = admin()

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: conversations } = await supabaseAdmin
    .from('conversations')
    .select('agent_id, metadata, escalated, created_at, agents(display_name, agent_type)')
    .eq('tenant_id', ctx.tenantId)
    .gte('created_at', thirtyDaysAgo)

  if (!conversations?.length) return NextResponse.json({ agents: [], totals: {} })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentMap: Record<string, any> = {}

  for (const c of conversations) {
    const agentId = c.agent_id as string
    if (!agentId) continue
    if (!agentMap[agentId]) {
      agentMap[agentId] = {
        agent_id: agentId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        display_name: (c.agents as any)?.display_name || 'Unknown',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        agent_type:   (c.agents as any)?.agent_type   || 'unknown',
        total_conversations: 0,
        lead_scores: [] as number[],
        escalations: 0, satisfied: 0, frustrated: 0,
        estimated_cost_pkr: 0, estimated_value_pkr: 0,
      }
    }
    const a = agentMap[agentId]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta  = (c.metadata as any) ?? {}
    const score: number = meta.lead_score ?? 0
    const sent:  string = meta.sentiment  ?? ''
    a.total_conversations++
    if (score) a.lead_scores.push(score)
    if (c.escalated)           a.escalations++
    if (sent === 'satisfied')  a.satisfied++
    if (sent === 'frustrated') a.frustrated++
    a.estimated_cost_pkr  += 2
    a.estimated_value_pkr += score >= 75 ? 500 : score >= 50 ? 200 : 50
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents = Object.values(agentMap).map((a: any) => {
    const avg = a.lead_scores.length
      ? Math.round(a.lead_scores.reduce((s: number, n: number) => s + n, 0) / a.lead_scores.length)
      : 0
    return {
      agent_id: a.agent_id, display_name: a.display_name, agent_type: a.agent_type,
      total_conversations: a.total_conversations,
      avg_lead_score:      avg,
      escalation_rate:     Math.round((a.escalations / a.total_conversations) * 100),
      satisfaction_rate:   Math.round((a.satisfied   / a.total_conversations) * 100),
      estimated_cost_pkr:  a.estimated_cost_pkr,
      estimated_value_pkr: a.estimated_value_pkr,
      roi: a.estimated_cost_pkr > 0
        ? Math.round((a.estimated_value_pkr / a.estimated_cost_pkr) * 100) / 100
        : 0,
    }
  })

  const totals = {
    total_conversations: conversations.length,
    total_cost_pkr:      agents.reduce((s, a) => s + a.estimated_cost_pkr,  0),
    total_value_pkr:     agents.reduce((s, a) => s + a.estimated_value_pkr, 0),
    avg_lead_score:      agents.length
      ? Math.round(agents.reduce((s, a) => s + a.avg_lead_score, 0) / agents.length)
      : 0,
  }

  return NextResponse.json({ agents, totals })
}
