import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { generateForgeBrief } from '@/lib/orion/forge-collaboration'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Global prompt — builds agents for businesses worldwide
const FORGE_PROMPT = `Output ONLY a valid JSON array of 5 AI agent specs. No text before or after. No markdown.

[{"agent_type":"slug","display_name":"Name","description":"One line","system_prompt":"You are [Name]. [Role]. Detect language automatically and respond in kind. Human Sovereignty: escalate complex issues to humans. METADATA: extract {contact_name, query_type, urgency, sentiment}.","recommended_channels":["whatsapp","email"],"model_complexity":"simple","estimated_value_pkr":45000,"sector_tags":["sector"],"use_case_examples":["Example 1","Example 2","Example 3"],"why_novel":"Gap this fills globally"}]

Build agents for businesses WORLDWIDE — USA, UK, UAE, Pakistan, India, Germany, Australia, Canada, Saudi Arabia, any country.
Focus on: real business pain points, compliance, automation, productivity. Global problems only. Return array immediately.`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAgent = Record<string, any>

async function testAgentPrompt(anthropic: Anthropic, prompt: string, agentType: string): Promise<boolean> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: prompt,
      messages: [{ role: 'user', content: 'Hello, can you help me?' }],
    })
    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    return reply.length > 20 && !reply.toLowerCase().includes('error')
  } catch {
    console.log('Test failed for:', agentType)
    return false
  }
}

export async function runAutonomousForge(): Promise<{ agents_queued: number }> {
  console.log('=== FORGE START ===', new Date().toISOString())

  const { data: existing } = await supabaseAdmin
    .from('forge_queue')
    .select('agent_type')
    .not('status', 'eq', 'rejected')

  const existingTypes: string[] = existing?.map((e: AnyAgent) => e.agent_type) || []

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Request Orion brief via Syndicate
  let orionBrief = ''
  try {
    const { transmit } = await import('@/lib/syndicate/syndicate')
    const briefResult = await transmit({
      from_agent: 'forge',
      to_agent: 'orion',
      message_type: 'forge_brief',
      payload: { request: 'Strategic brief for agent generation' }
    })
    if (briefResult.success && typeof briefResult.response === 'object' && briefResult.response !== null) {
      const r = briefResult.response as Record<string, unknown>
      orionBrief = typeof r.brief === 'string' ? r.brief : ''
    }
    if (!orionBrief) orionBrief = await generateForgeBrief()
    console.log('[SYNDICATE] Forge received Orion brief:', orionBrief.substring(0, 100))
  } catch(e) {
    console.error('Orion brief failed (non-critical):', e)
    try { orionBrief = await generateForgeBrief() } catch { /* ignore */ }
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `${FORGE_PROMPT}\n\nORION INTELLIGENCE BRIEF:\n${orionBrief || 'No brief available — use market research'}\n\nAvoid these existing types: ${existingTypes.slice(0, 20).join(', ') || 'none'}`,
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  console.log('Response length:', cleaned.length)
  console.log('Preview:', cleaned.substring(0, 100))

  let agents: AnyAgent[] = []

  for (const fn of [
    () => JSON.parse(cleaned),
    () => JSON.parse(cleaned.match(/\[[\s\S]*\]/)?.[0] ?? ''),
    () => JSON.parse(cleaned.substring(cleaned.indexOf('['), cleaned.lastIndexOf(']') + 1)),
  ]) {
    try { agents = fn(); break } catch { continue }
  }

  if (!agents.length) {
    console.error('Parse failed. Raw:', cleaned)
    throw new Error('Could not parse Claude response')
  }

  const novel = agents.filter((a: AnyAgent) =>
    a.agent_type && a.display_name && !existingTypes.includes(a.agent_type)
  )

  // Self-test each agent before queuing
  const tested: AnyAgent[] = []
  for (const agent of novel) {
    console.log('Testing:', agent.agent_type)
    const passes = await testAgentPrompt(anthropic, agent.system_prompt, agent.agent_type)
    if (passes) {
      tested.push(agent)
      console.log('✅ Passed:', agent.agent_type)
    } else {
      console.log('❌ Failed test:', agent.agent_type)
    }
  }

  let inserted = 0
  for (const agent of tested) {
    const { error } = await supabaseAdmin.from('forge_queue').insert({
      agent_type:           agent.agent_type,
      display_name:         agent.display_name,
      description:          agent.description || '',
      system_prompt:        agent.system_prompt || '',
      recommended_channels: agent.recommended_channels || ['web'],
      model_complexity:     agent.model_complexity || 'simple',
      estimated_value_pkr:  Number(agent.estimated_value_pkr) || 0,
      sector_tags:          agent.sector_tags || [],
      use_case_examples:    agent.use_case_examples || [],
      status:               'pending_review',
    })
    if (!error) {
      inserted++
      console.log('Inserted:', agent.agent_type)
      // Pre-register in Syndicate network
      try {
        const { registerAgent } = await import('@/lib/syndicate/syndicate')
        await registerAgent(agent.agent_type, agent.display_name, false)
      } catch { /* non-critical */ }
    } else {
      console.error('Insert error:', agent.agent_type, error.message)
    }
  }

  console.log('=== FORGE DONE === Inserted:', inserted)

  // Notify Orion via Syndicate
  if (inserted > 0) {
    try {
      const { transmit } = await import('@/lib/syndicate/syndicate')
      await transmit({
        from_agent: 'forge',
        to_agent: 'orion',
        message_type: 'share_intelligence',
        payload: { agents_built: inserted, message: `Forge completed. Built ${inserted} new agents.` }
      })
    } catch { /* non-critical */ }
  }

  if (inserted > 0 && process.env.MASTER_EMAIL && process.env.RESEND_API_KEY) {
    new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'LYCHO Forge <onboarding@resend.dev>',
      to: process.env.MASTER_EMAIL,
      subject: `${inserted} new agents ready`,
      html: `<p>${inserted} agents built. <a href="${process.env.NEXT_PUBLIC_APP_URL}/master">Review →</a></p>`,
    }).catch(e => console.error('Email failed:', e))
  }

  return { agents_queued: inserted }
}
