import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Ultra-minimal prompt — gets response in under 8 seconds
const FORGE_PROMPT = `Output ONLY a JSON array of 3 AI agent specs. No text before or after. No markdown.

[{"agent_type":"slug","display_name":"Name","description":"One line","system_prompt":"You are [Name]. [Role]. Support all languages. Human Sovereignty: escalate complex issues to humans. METADATA: extract {contact_name, query_type, urgency}.","recommended_channels":["whatsapp","email"],"model_complexity":"simple","estimated_value_pkr":35000,"sector_tags":["sector"],"use_case_examples":["Example 1","Example 2","Example 3"],"why_novel":"Gap this fills"}]

Generate 3 agents for Pakistani/GCC businesses. Real problems only. Return array immediately.`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAgent = Record<string, any>

export async function runAutonomousForge(): Promise<{ agents_queued: number }> {
  console.log('=== FORGE START ===', new Date().toISOString())

  const { data: existing } = await supabaseAdmin
    .from('forge_queue')
    .select('agent_type')
    .not('status', 'eq', 'rejected')

  const existingTypes: string[] = existing?.map((e: AnyAgent) => e.agent_type) || []

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `${FORGE_PROMPT}\n\nAvoid these existing types: ${existingTypes.slice(0, 20).join(', ') || 'none'}`,
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

  let inserted = 0
  for (const agent of novel) {
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
    } else {
      console.error('Insert error:', agent.agent_type, error.message)
    }
  }

  console.log('=== FORGE DONE === Inserted:', inserted)

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
