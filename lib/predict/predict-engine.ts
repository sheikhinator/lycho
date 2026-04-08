import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function detectColdLeads(): Promise<number> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: coldLeads } = await supabaseAdmin
    .from('conversations')
    .select('id, tenant_id, contact_identifier, metadata')
    .lt('updated_at', threeDaysAgo)
    .eq('status', 'open')
    .limit(20)

  if (!coldLeads?.length) return 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hot = coldLeads.filter(c => ((c.metadata as any)?.lead_score ?? 0) >= 60)

  for (const lead of hot) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const score = (lead.metadata as any)?.lead_score ?? 0
    await supabaseAdmin.from('notifications').insert({
      tenant_id: lead.tenant_id,
      type: 'cold_lead',
      title: 'Hot lead going cold',
      message: `Contact ${lead.contact_identifier} scored ${score} but hasn't engaged in 3 days.`,
      link: `/dashboard/conversations/${lead.id}`,
      read: false,
    })
  }

  return hot.length
}

export async function detectChurnRisk(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: convos } = await supabaseAdmin
    .from('conversations')
    .select('id, tenant_id, contact_identifier, metadata')
    .gte('created_at', sevenDaysAgo)
    .limit(100)

  if (!convos?.length) return 0

  const atRisk = convos.filter(c => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sentiment = (c.metadata as any)?.sentiment
    return ['frustrated', 'angry', 'dissatisfied'].includes(sentiment)
  })

  for (const convo of atRisk) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sentiment = (convo.metadata as any)?.sentiment
    await supabaseAdmin.from('notifications').insert({
      tenant_id: convo.tenant_id,
      type: 'churn_risk',
      title: 'Churn risk detected',
      message: `Contact ${convo.contact_identifier} showed ${sentiment} sentiment. Follow up recommended.`,
      link: `/dashboard/conversations/${convo.id}`,
      read: false,
    })
  }

  return atRisk.length
}

export async function detectInactiveAgents(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: tenants } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('plan_status', 'active')
    .limit(50)

  if (!tenants?.length) return 0

  let flagged = 0
  for (const tenant of tenants) {
    const { count } = await supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .gte('created_at', sevenDaysAgo)

    if ((count || 0) === 0) {
      await supabaseAdmin.from('notifications').insert({
        tenant_id: tenant.id,
        type: 'low_activity',
        title: 'No agent activity this week',
        message: "Your agents haven't had any conversations this week. Check your channel connections.",
        link: '/dashboard/settings',
        read: false,
      })
      flagged++
    }
  }

  return flagged
}

export async function generateProactiveInsight(tenantId: string): Promise<string> {
  const { data: recentConvos } = await supabaseAdmin
    .from('conversations')
    .select('metadata, escalated, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!recentConvos?.length) return ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scores = recentConvos.map(c => (c.metadata as any)?.lead_score ?? 0)
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frustrated = recentConvos.filter(c => (c.metadata as any)?.sentiment === 'frustrated').length
  const escalated  = recentConvos.filter(c => c.escalated).length

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `You are a business intelligence agent. Based on these metrics from the last 20 conversations, give one specific actionable insight in 2 sentences max:
- Average lead score: ${avgScore}/100
- Frustrated customers: ${frustrated}
- Escalations: ${escalated}
- Total conversations: ${recentConvos.length}
Be specific and direct. No fluff.`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
