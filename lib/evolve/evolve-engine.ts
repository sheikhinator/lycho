import { createClient } from '@supabase/supabase-js'
import { getAIClient } from '@/lib/ai'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function getSupabaseAdmin() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Capture a skill pattern from a successful conversation
export async function captureSkill(
  agentType: string,
  userMessage: string,
  agentResponse: string,
  leadScore: number
): Promise<void> {
  if (leadScore < 70) return // only learn from high quality interactions

  try {
    const openai = getAIClient()
    const supabaseAdmin = getSupabaseAdmin()
    const extraction = await openai.chat.completions.create({
      model: 'gemini-2.0-flash',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Extract the key technique from this successful agent interaction as a reusable skill pattern. Return JSON only:
{"pattern": "what the agent did well in one sentence", "trigger": "when to apply this pattern", "example": "brief example"}

User: ${userMessage.slice(0, 200)}
Agent: ${agentResponse.slice(0, 200)}`,
      }],
    })

    const text = extraction.choices[0]?.message?.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const skill = JSON.parse(clean)

    await supabaseAdmin.from('agent_skills').upsert({
      agent_type: agentType,
      pattern: skill.pattern,
      trigger: skill.trigger,
      example: skill.example,
      usage_count: 1,
      success_rate: 100,
    }, { onConflict: 'agent_type,pattern' })
  } catch (e) {
    console.error('Skill capture error:', e)
  }
}

// Retrieve top skills for an agent type
export async function getAgentSkills(agentType: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data } = await supabaseAdmin
    .from('agent_skills')
    .select('pattern, trigger, example, usage_count')
    .eq('agent_type', agentType)
    .order('usage_count', { ascending: false })
    .limit(5)

  if (!data?.length) return ''

  return `LEARNED SKILLS — patterns from ${data.reduce((s, d) => s + d.usage_count, 0)} successful interactions:
${data.map((s, i) => `${i + 1}. ${s.pattern} (apply when: ${s.trigger})`).join('\n')}`
}

// Evolve all agents — run nightly
export async function evolveAllAgents(): Promise<{ evolved: number }> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: agentTypes } = await supabaseAdmin
    .from('conversations')
    .select('agent_id, agents(agent_type)')
    .gte('lead_score', 70)
    .order('created_at', { ascending: false })
    .limit(100)

  if (!agentTypes?.length) return { evolved: 0 }

  const types = new Set(agentTypes.map((a: any) => a.agents?.agent_type).filter(Boolean))
  let evolved = 0

  for (const agentType of types) {
    const { data: convos } = await supabaseAdmin
      .from('conversations')
      .select('messages, lead_score')
      .eq('agents.agent_type', agentType)
      .gte('lead_score', 70)
      .limit(10)

    if (!convos?.length) continue

    for (const convo of convos) {
      const msgs = convo.messages as any[]
      if (!msgs?.length) continue
      const userMsg = msgs.find((m: any) => m.role === 'user')?.content || ''
      const agentMsg = msgs.find((m: any) => m.role === 'assistant')?.content || ''
      if (userMsg && agentMsg) {
        await captureSkill(agentType as string, userMsg, agentMsg, convo.lead_score)
        evolved++
      }
    }
  }

  return { evolved }
}
