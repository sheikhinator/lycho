import { getAIClient, getModel } from '@/lib/ai'
import { admin } from '@/lib/admin'

const supabase = admin()
const openai = getAIClient()

export interface TrainingExample {
  id?: string
  agent_type: string
  user_message: string
  ideal_response: string
  rationale?: string
  category: 'greeting' | 'question' | 'objection' | 'closing' | 'support' | 'custom'
  quality_score?: number
  created_at?: string
}

export interface PromptOptimization {
  agent_type: string
  original_prompt: string
  optimized_prompt: string
  changes: string[]
  improvement_score: number
  version: number
}

export async function addTrainingExample(example: TrainingExample): Promise<void> {
  const { data: existing } = await supabase
    .from('training_examples')
    .select('id, quality_score, usage_count')
    .eq('agent_type', example.agent_type)
    .eq('user_message', example.user_message)
    .single()

  if (existing) {
    await supabase.from('training_examples')
      .update({
        usage_count: (existing.usage_count || 0) + 1,
        quality_score: example.quality_score || existing.quality_score,
      })
      .eq('id', existing.id)
    return
  }

  await supabase.from('training_examples').insert({
    agent_type: example.agent_type,
    user_message: example.user_message,
    ideal_response: example.ideal_response,
    rationale: example.rationale,
    category: example.category,
    quality_score: example.quality_score || 75,
  })
}

export async function getTrainingExamples(
  agentType: string,
  category?: string
): Promise<TrainingExample[]> {
  let query = supabase
    .from('training_examples')
    .select('*')
    .eq('agent_type', agentType)
    .order('quality_score', { ascending: false })

  if (category) query = query.eq('category', category)

  const { data } = await query.limit(50)
  return (data || []) as TrainingExample[]
}

export async function optimizeAgentPrompt(
  agentType: string,
  existingPrompt: string
): Promise<PromptOptimization> {
  const examples = await getTrainingExamples(agentType)

  const examplesContext = examples.length > 0
    ? examples.map((e, i) =>
      `Example ${i + 1}:\nUser: ${e.user_message}\nIdeal: ${e.ideal_response}\nRationale: ${e.rationale || ''}`
    ).join('\n\n')
    : 'No training examples yet. Focus on general best practices.'

  const response = await openai.chat.completions.create({
    model: getModel('complex'),
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a PROMPT ENGINEER optimizing an AI agent's system prompt.

AGENT TYPE: ${agentType}

CURRENT PROMPT:
${existingPrompt}

TRAINING EXAMPLES:
${examplesContext}

Optimize this prompt to better handle the training examples. Return JSON:
{
  "optimized_prompt": "the improved prompt",
  "changes": ["list of specific improvements made"],
  "improvement_score": 0-100
}`
    }]
  })

  const text = response.choices[0]?.message?.content || ''
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

  const { data: versionData } = await supabase
    .from('agent_prompt_versions')
    .select('version')
    .eq('agent_type', agentType)
    .order('version', { ascending: false })
    .limit(1)

  const version = (versionData?.[0]?.version || 0) + 1

  await supabase.from('agent_prompt_versions').insert({
    agent_type: agentType,
    system_prompt: parsed.optimized_prompt,
    version,
    change_log: parsed.changes?.join('\n') || '',
    quality_score: parsed.improvement_score,
  })

  await supabase.from('marketplace_agents')
    .update({ system_prompt: parsed.optimized_prompt })
    .eq('agent_type', agentType)

  return {
    agent_type: agentType,
    original_prompt: existingPrompt,
    optimized_prompt: parsed.optimized_prompt,
    changes: parsed.changes || [],
    improvement_score: parsed.improvement_score || 0,
    version,
  }
}

export async function testPrompt(
  agentType: string,
  prompt: string,
  testMessages: string[]
): Promise<{ message: string; response: string; score: number }[]> {
  const results = []
  for (const msg of testMessages) {
    const response = await openai.chat.completions.create({
      model: getModel('simple'),
      max_tokens: 200,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: msg }
      ]
    })
    const text = response.choices[0]?.message?.content || ''
    const score = evaluateResponseQuality(text, msg)
    results.push({ message: msg, response: text, score })
  }
  return results
}

function evaluateResponseQuality(response: string, _message: string): number {
  let score = 70
  if (response.length < 10) score -= 30
  if (response.length > 200) score += 5
  if (/i (cannot|cannot|am unable|don't know)/i.test(response)) score -= 15
  if (/\d/.test(response)) score += 5
  if (response.includes('?') || response.includes('!')) score += 3
  if (response.includes('\n')) score += 2
  if (/sorry|apologize/i.test(response) && response.length < 80) score -= 5
  return Math.max(0, Math.min(100, score))
}
