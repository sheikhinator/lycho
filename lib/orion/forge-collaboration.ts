import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const openai = new OpenAI({ apiKey: process.env.OPENCODE_API_KEY || 'sk-DkKhm5mvzbJQHPhVyAbDBKVbDQgKuq5e6bTxTHW9jcRHa50tW3P9ax4oEsDv3buu', baseURL: 'https://opencode.ai/zen/v1' })

export async function generateForgeBrief(): Promise<string> {
  const { data: allAgents } = await supabaseAdmin
    .from('orion_agent_intelligence')
    .select('agent_type, intelligence_score, performance_data')
    .order('intelligence_score', { ascending: true })

  const underperforming = allAgents
    ?.filter(a => ((a.performance_data as Record<string, number>)?.avg_conversation_score || 50) < 60)
    .map(a => a.agent_type) || []

  const existingTypes = allAgents?.map(a => a.agent_type) || []

  const { data: forgeQueue } = await supabaseAdmin
    .from('forge_queue')
    .select('agent_type')
    .not('status', 'eq', 'rejected')

  const queuedTypes = forgeQueue?.map((q: Record<string, string>) => q.agent_type) || []

  const response = await openai.chat.completions.create({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are ORION, LYCHO's intelligence layer. Analyse the platform's current state and generate a strategic brief for the Forge Agent.

Current agents: ${existingTypes.slice(0, 30).join(', ')}
Underperforming agents: ${underperforming.join(', ') || 'none'}
Already in Forge queue: ${queuedTypes.join(', ') || 'none'}
Date: ${new Date().toISOString().split('T')[0]}

Generate a strategic brief for Forge identifying:
1. Top 3 market gaps LYCHO must fill urgently (global markets - any country)
2. Top 2 emerging opportunities from current global business trends
3. Quality directives — what makes an excellent agent vs mediocre

Be specific and actionable. Return as a clear brief Forge can act on immediately.`
    }]
  })

  const brief = response.choices[0]?.message?.content || ''

  await supabaseAdmin.from('orion_forge_briefs').insert({
    gaps_identified: underperforming.map(u => ({ agent: u, reason: 'underperforming' })),
    quality_directives: brief,
    status: 'pending'
  })

  return brief
}
