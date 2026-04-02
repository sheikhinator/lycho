import { CATALOGUE_PROMPTS } from './catalogue-prompts'
import { buildIntakeSystemPrompt, type ContactProfile } from './intake-agent'
import { buildResearchSystemPrompt }   from './research-agent'
import { buildOperationsSystemPrompt } from './operations-agent'
import { buildClientSystemPrompt }     from './client-agent'
import { buildAnalystSystemPrompt }    from './analyst-agent'
import { buildComplianceSystemPrompt } from './compliance-agent'
import { buildContentSystemPrompt }    from './content-agent'

const COMPLEX_CORE = new Set(['research', 'analyst', 'compliance'])

function stripSuffix(t: string): string {
  return t.replace(/_agent$/, '')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSystemPrompt(
  agentType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tenant?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agent?: any,
  existingProfile?: ContactProfile | null,
): Promise<{ prompt: string; model: 'simple' | 'complex' }> {
  const norm = stripSuffix(agentType)

  // 1. Core agents — rich context-aware prompts
  switch (norm) {
    case 'research':
      return { prompt: buildResearchSystemPrompt(tenant, agent), model: 'complex' }
    case 'operations':
      return { prompt: buildOperationsSystemPrompt(tenant, agent), model: 'simple' }
    case 'client':
      return { prompt: buildClientSystemPrompt(tenant, agent), model: 'simple' }
    case 'analyst':
      return { prompt: buildAnalystSystemPrompt(tenant, agent), model: 'complex' }
    case 'compliance':
      return { prompt: buildComplianceSystemPrompt(tenant, agent), model: 'complex' }
    case 'content':
      return { prompt: buildContentSystemPrompt(tenant, agent), model: 'simple' }
    case 'intake':
      return { prompt: buildIntakeSystemPrompt(tenant, agent, existingProfile), model: 'simple' }
  }

  // 2. Marketplace/Forge-approved agents
  const { data: mAgent } = await supabase
    .from('marketplace_agents')
    .select('system_prompt, model_complexity')
    .eq('agent_type', agentType)
    .single()

  if (mAgent?.system_prompt) {
    return {
      prompt: mAgent.system_prompt as string,
      model: (mAgent.model_complexity as 'simple' | 'complex') ?? 'simple',
    }
  }

  // 3. Static catalogue
  if (CATALOGUE_PROMPTS[agentType]) {
    return { prompt: CATALOGUE_PROMPTS[agentType], model: 'simple' }
  }

  // 4. Auto-generate via Haiku and cache
  const { Anthropic } = await import('@anthropic-ai/sdk')
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Write a system prompt for a specialist AI agent called "${agentType.replace(/_/g, ' ')}". Keep it under 200 words. Include: role, 3 key capabilities, language support, Human Sovereignty constraint, METADATA extraction. Return only the system prompt text, nothing else.`,
    }],
  })
  const generated = response.content[0].type === 'text' ? response.content[0].text : ''

  await supabase.from('marketplace_agents').upsert({
    agent_type:       agentType,
    display_name:     agentType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    description:      `Specialist AI agent for ${agentType.replace(/_/g, ' ')}`,
    system_prompt:    generated,
    model_complexity: 'simple',
    status:           'active',
    source:           'auto_generated',
  }, { onConflict: 'agent_type' })

  return { prompt: generated, model: 'simple' }
}

export { COMPLEX_CORE }
