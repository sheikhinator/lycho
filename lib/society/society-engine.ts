import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function runSocietySimulation(tenantId: string): Promise<any> {
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('agent_type, display_name, interactions_count')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .limit(12)

  if (!agents?.length) return { events: [], consensus: '' }

  const societyPrompt = `You are simulating a society of AI agents. Each agent has a role and they interact, share knowledge and self-organise.

Agents in this society:
${agents.map(a => `- ${a.display_name} (${a.agent_type}): ${a.interactions_count} interactions`).join('\n')}

Simulate 5 society events that happened in the last 24 hours. Events can be:
- Knowledge sharing between agents
- A debate about how to handle a client situation
- An agent teaching another a new skill
- Agents voting on a decision
- An agent discovering a new pattern

Return JSON only:
{
  "events": [
    {
      "type": "knowledge_share|debate|teaching|vote|discovery",
      "from_agent": "agent_type",
      "to_agent": "agent_type",
      "description": "what happened",
      "outcome": "result of this interaction",
      "timestamp": "relative time e.g. 2 hours ago"
    }
  ],
  "society_health": 85,
  "dominant_culture": "one sentence describing this society's emerging culture",
  "consensus": "what the society collectively decided today"
}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: societyPrompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())

    for (const event of result.events || []) {
      await supabaseAdmin.from('society_events').insert({
        tenant_id: tenantId,
        event_type: event.type,
        from_agent: event.from_agent,
        to_agent: event.to_agent,
        description: event.description,
        outcome: event.outcome
      })
    }

    return result
  } catch {
    return { events: [], consensus: '', society_health: 50, dominant_culture: '' }
  }
}

export async function getSocietyHistory(tenantId: string): Promise<any[]> {
  const { data } = await supabaseAdmin
    .from('society_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data || []
}
