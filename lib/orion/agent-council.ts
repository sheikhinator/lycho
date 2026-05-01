import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { injectIntelligence } from './orion-engine'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const openai = new OpenAI({ apiKey: process.env.OPENCODE_API_KEY || 'sk-DkKhm5mvzbJQHPhVyAbDBKVbDQgKuq5e6bTxTHW9jcRHa50tW3P9ax4oEsDv3buu', baseURL: 'https://opencode.ai/zen/v1' })

export function detectComplexity(query: string): {
  needsCouncil: boolean
  suggestedAgents: string[]
  reason: string
} {
  const q = query.toLowerCase()
  const patterns = [
    { keywords: ['expand', 'international', 'global', 'overseas', 'export', 'import'], agents: ['research', 'compliance', 'operations'], reason: 'International expansion requires research, compliance, and operations expertise' },
    { keywords: ['legal', 'contract', 'sue', 'court', 'compliance', 'regulation'], agents: ['compliance', 'research'], reason: 'Legal matters require compliance and research expertise' },
    { keywords: ['hire', 'recruit', 'staff', 'employee', 'payroll', 'hr'], agents: ['operations', 'compliance'], reason: 'HR matters require operations and compliance expertise' },
    { keywords: ['marketing', 'campaign', 'launch', 'brand', 'promote'], agents: ['content', 'research', 'analyst'], reason: 'Marketing requires content, research, and analytics expertise' },
    { keywords: ['financial', 'invest', 'funding', 'budget', 'forecast', 'revenue'], agents: ['analyst', 'research', 'compliance'], reason: 'Financial matters require analyst, research, and compliance expertise' },
    { keywords: ['strategy', 'plan', 'roadmap', 'compete', 'market'], agents: ['research', 'analyst', 'operations'], reason: 'Strategic planning requires research, analytics, and operations expertise' },
  ]

  for (const pattern of patterns) {
    if (pattern.keywords.some(k => q.includes(k)) && query.length > 50) {
      return { needsCouncil: true, suggestedAgents: pattern.agents, reason: pattern.reason }
    }
  }

  return { needsCouncil: false, suggestedAgents: [], reason: '' }
}

export async function conveneCouncil(
  tenantId: string,
  conversationId: string,
  query: string,
  agentTypes: string[],
  countryCode: string = 'PK',
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ response: string; agents_used: string[]; quality_score: number }> {
  const start = Date.now()

  const agentPrompts = await Promise.all(
    agentTypes.map(async (agentType) => ({
      type: agentType,
      prompt: await injectIntelligence(agentType, countryCode)
    }))
  )

  const individualResponses = await Promise.allSettled(
    agentPrompts.map(async ({ type, prompt }) => {
      const response = await openai.chat.completions.create({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        messages: [
          { role: 'system', content: `${prompt}\n\nYou are participating in an Agent Council. Provide your specialist perspective on the query. Be concise — 3-5 sentences from your domain expertise only. Other specialists will cover their domains.` },
          ...conversationHistory.slice(-4).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: query }
        ]
      })
      return {
        agent: type,
        response: response.choices[0]?.message?.content || ''
      }
    })
  )

  const successfulResponses = individualResponses
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<{ agent: string; response: string }>).value)

  const synthesisPrompt = successfulResponses
    .map(r => `${r.agent.toUpperCase()} AGENT: ${r.response}`)
    .join('\n\n')

  const synthesis = await openai.chat.completions.create({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    messages: [
      { role: 'system', content: `You are ORION, LYCHO's intelligence synthesiser. Multiple specialist agents have analysed a query. Your job is to synthesise their insights into one coherent, actionable, brilliant response. Do not mention the agents or the council. Just deliver the unified intelligence as if you are one all-knowing advisor. Be impressive.` },
      { role: 'user', content: `Original query: ${query}\n\nSpecialist insights:\n${synthesisPrompt}\n\nSynthesise into one unified response.` }
    ]
  })

  const synthesisedResponse = synthesis.choices[0]?.message?.content || ''
  const duration = Date.now() - start

  await supabaseAdmin.from('orion_council_sessions').insert({
    tenant_id: tenantId,
    conversation_id: conversationId,
    query,
    agents_involved: agentTypes,
    individual_responses: successfulResponses,
    synthesised_response: synthesisedResponse,
    quality_score: 85,
    duration_ms: duration
  })

  return { response: synthesisedResponse, agents_used: agentTypes, quality_score: 85 }
}
