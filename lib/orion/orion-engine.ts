import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ============================================================
// ORION FUNCTION 1 — INTELLIGENCE INJECTION
// ============================================================

export async function injectIntelligence(
  agentType: string,
  countryCode: string = 'PK',
  basePrompt?: string
): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('orion_agent_intelligence')
    .select('*')
    .eq('agent_type', agentType)
    .single()

  const { data: country } = await supabaseAdmin
    .from('country_profiles')
    .select('agent_injection')
    .eq('country_code', countryCode)
    .single()

  const countryInjection = country?.agent_injection || ''

  if (existing?.optimised_prompt) {
    const variants = (existing.country_variants as Record<string, string>) || {}
    if (variants[countryCode]) return variants[countryCode]

    const countryVariant = `${existing.optimised_prompt}\n\nGEO-INTELLIGENCE:\n${countryInjection}`
    await supabaseAdmin
      .from('orion_agent_intelligence')
      .update({ country_variants: { ...variants, [countryCode]: countryVariant } })
      .eq('agent_type', agentType)
    return countryVariant
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are ORION — LYCHO's intelligence engine. Generate an exceptional specialist system prompt for an AI agent.

Agent type: ${agentType.replace(/_/g, ' ')}
${basePrompt ? `Base prompt provided: ${basePrompt}` : ''}

Requirements:
- Deeply specialist — knows everything about this domain
- Emotionally intelligent — adapts tone to customer state
- Globally capable — works in any language automatically
- Results-driven — every interaction moves toward business value
- Human Sovereignty — always knows when to escalate to humans

Include:
1. Role definition (2 sentences)
2. Core capabilities (5 specific capabilities)
3. Operational guidelines (how to handle different situations)
4. Language instruction (auto-detect, respond in kind)
5. Human Sovereignty constraint (when to escalate)
6. METADATA block (what to extract from every conversation)

Return only the system prompt text. Make it exceptional.`
    }]
  })

  const optimisedPrompt = response.content[0].type === 'text' ? response.content[0].text : basePrompt || ''
  const countryVariant = `${optimisedPrompt}\n\nGEO-INTELLIGENCE:\n${countryInjection}`

  await supabaseAdmin.from('orion_agent_intelligence').upsert({
    agent_type: agentType,
    base_prompt: basePrompt || optimisedPrompt,
    optimised_prompt: optimisedPrompt,
    intelligence_score: 70,
    version: 1,
    country_variants: { [countryCode]: countryVariant },
    last_optimised_at: new Date().toISOString(),
    next_optimisation_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }, { onConflict: 'agent_type' })

  return countryVariant
}

// ============================================================
// ORION FUNCTION 2 — PERFORMANCE SCORING
// ============================================================

export async function scoreConversation(
  agentType: string,
  messages: unknown[],
  metadata: {
    escalated: boolean
    lead_score: number
    sentiment: string
    resolved: boolean
  }
): Promise<number> {
  void messages
  let score = 50
  if (metadata.resolved) score += 20
  if (metadata.lead_score >= 75) score += 15
  if (metadata.sentiment === 'satisfied' || metadata.sentiment === 'excited') score += 10
  if (!metadata.escalated) score += 5
  if (metadata.sentiment === 'frustrated' || metadata.sentiment === 'angry') score -= 15
  if (metadata.escalated) score -= 10
  if (metadata.lead_score < 20) score -= 5

  const { data: existing } = await supabaseAdmin
    .from('orion_agent_intelligence')
    .select('performance_data, intelligence_score')
    .eq('agent_type', agentType)
    .single()

  if (existing) {
    const perf = (existing.performance_data as Record<string, number>) || {}
    const totalConvos = (perf.total_conversations || 0) + 1
    const avgScore = Math.round(((perf.avg_conversation_score || 50) * (totalConvos - 1) + score) / totalConvos)
    await supabaseAdmin
      .from('orion_agent_intelligence')
      .update({
        performance_data: {
          ...perf,
          total_conversations: totalConvos,
          avg_conversation_score: avgScore,
          last_conversation_at: new Date().toISOString(),
          escalation_rate: ((perf.escalation_count || 0) + (metadata.escalated ? 1 : 0)) / totalConvos,
          resolution_rate: ((perf.resolution_count || 0) + (metadata.resolved ? 1 : 0)) / totalConvos
        }
      })
      .eq('agent_type', agentType)
  }

  return score
}

// ============================================================
// ORION FUNCTION 3 — NIGHTLY OPTIMISATION
// ============================================================

export async function runNightlyOptimisation(): Promise<{ optimised: number }> {
  console.log('=== ORION OPTIMISATION STARTING ===')

  const { data: agents } = await supabaseAdmin
    .from('orion_agent_intelligence')
    .select('*')
    .lt('next_optimisation_at', new Date().toISOString())
    .order('intelligence_score', { ascending: true })
    .limit(10)

  if (!agents?.length) return { optimised: 0 }

  let optimised = 0

  for (const agent of agents) {
    try {
      const perf = (agent.performance_data as Record<string, number>) || {}
      const avgScore = perf.avg_conversation_score || 50

      if (avgScore < 65) {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `You are ORION optimising an underperforming AI agent.

Agent: ${agent.agent_type.replace(/_/g, ' ')}
Current performance score: ${avgScore}/100
Escalation rate: ${Math.round((perf.escalation_rate || 0) * 100)}%
Resolution rate: ${Math.round((perf.resolution_rate || 0) * 100)}%

Current prompt:
${agent.optimised_prompt}

This agent is underperforming. Rewrite its system prompt to be significantly better.
Focus on: clearer role definition, better handling of common scenarios, improved de-escalation, higher resolution rates.
Return only the new system prompt.`
          }]
        })

        const newPrompt = response.content[0].type === 'text' ? response.content[0].text : agent.optimised_prompt

        await supabaseAdmin.from('orion_optimisation_log').insert({
          agent_type: agent.agent_type,
          trigger_reason: `Performance score ${avgScore} below threshold`,
          previous_score: agent.intelligence_score,
          new_score: Math.min(agent.intelligence_score + 10, 100),
          changes_summary: 'Full prompt rewrite based on performance data',
          previous_prompt: agent.optimised_prompt,
          new_prompt: newPrompt
        })

        await supabaseAdmin
          .from('orion_agent_intelligence')
          .update({
            optimised_prompt: newPrompt,
            intelligence_score: Math.min(agent.intelligence_score + 10, 100),
            version: (agent.version || 1) + 1,
            country_variants: {},
            last_optimised_at: new Date().toISOString(),
            next_optimisation_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('agent_type', agent.agent_type)

        optimised++
      } else {
        await supabaseAdmin
          .from('orion_agent_intelligence')
          .update({ next_optimisation_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
          .eq('agent_type', agent.agent_type)
      }
    } catch (e) {
      console.error('Optimisation error for', agent.agent_type, e)
    }
  }

  console.log('=== ORION OPTIMISATION DONE === Optimised:', optimised)
  return { optimised }
}

// ============================================================
// ORION FUNCTION 4 — GEO-INTELLIGENCE UPDATE
// ============================================================

export async function applyGeoIntelligence(
  tenantId: string,
  countryCode: string
): Promise<{ agents_updated: number }> {
  const { data: country } = await supabaseAdmin
    .from('country_profiles')
    .select('*')
    .eq('country_code', countryCode)
    .single()

  if (!country) return { agents_updated: 0 }

  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')

  if (!agents?.length) return { agents_updated: 0 }

  await supabaseAdmin.from('tenant_geo_settings').upsert({
    tenant_id: tenantId,
    country_code: countryCode,
    geo_applied_at: new Date().toISOString()
  }, { onConflict: 'tenant_id' })

  const agentTypes = [...new Set(agents.map((a: Record<string, string>) => a.agent_type))]

  for (const agentType of agentTypes) {
    const { data: intel } = await supabaseAdmin
      .from('orion_agent_intelligence')
      .select('country_variants')
      .eq('agent_type', agentType)
      .single()

    if (intel) {
      const variants = (intel.country_variants as Record<string, string>) || {}
      delete variants[countryCode]
      await supabaseAdmin
        .from('orion_agent_intelligence')
        .update({ country_variants: variants })
        .eq('agent_type', agentType)
    }
  }

  return { agents_updated: agents.length }
}
