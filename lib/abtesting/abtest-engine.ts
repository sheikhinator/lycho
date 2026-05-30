import { getAIClient, getModel } from '@/lib/ai'
import { admin } from '@/lib/admin'

const supabase = admin()
const openai = getAIClient()

export interface ABTest {
  id: string
  tenant_id: string
  name: string
  description?: string
  agent_type: string
  metric: 'lead_score' | 'satisfaction' | 'conversion' | 'response_quality'
  status: 'draft' | 'running' | 'paused' | 'completed'
  variants: ABTestVariant[]
  min_sample_size: number
  started_at?: string
  completed_at?: string
  winner?: string
}

export interface ABTestVariant {
  id: string
  test_id: string
  label: string
  system_prompt: string
  model?: string
  config?: Record<string, any>
  traffic_percentage: number
  results: {
    conversations: number
    avg_score: number
    total_score: number
  }
}

export async function createABTest(
  tenantId: string,
  data: {
    name: string
    description?: string
    agent_type: string
    variants: { label: string; system_prompt: string; traffic_percentage: number }[]
    metric?: string
    min_sample_size?: number
  }
): Promise<ABTest> {
  const { data: test } = await supabase
    .from('ab_tests')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      agent_type: data.agent_type,
      metric: data.metric || 'lead_score',
      status: 'draft',
      min_sample_size: data.min_sample_size || 50,
    })
    .select()
    .single()

  const variants = data.variants.map(v => ({
    test_id: test.id,
    label: v.label,
    system_prompt: v.system_prompt,
    traffic_percentage: v.traffic_percentage,
    results: { conversations: 0, avg_score: 0, total_score: 0 },
  }))

  for (const variant of variants) {
    await supabase.from('ab_test_variants').insert(variant)
  }

  return test as ABTest
}

export async function listABTests(tenantId: string): Promise<ABTest[]> {
  const { data: tests } = await supabase
    .from('ab_tests')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (!tests?.length) return []

  const fullTests = await Promise.all(tests.map(async (test) => {
    const { data: variants } = await supabase
      .from('ab_test_variants')
      .select('*')
      .eq('test_id', test.id)

    return { ...test, variants: variants || [] } as ABTest
  }))

  return fullTests
}

export function selectVariant(test: ABTest): ABTestVariant {
  const roll = Math.random() * 100
  let cumulative = 0
  for (const variant of test.variants) {
    cumulative += variant.traffic_percentage
    if (roll <= cumulative) return variant
  }
  return test.variants[test.variants.length - 1]
}

export async function recordVariantResult(
  variantId: string,
  score: number
): Promise<void> {
  const { data: variant } = await supabase
    .from('ab_test_variants')
    .select('results')
    .eq('id', variantId)
    .single()

  if (!variant) return

  const results = variant.results as any || { conversations: 0, avg_score: 0, total_score: 0 }
  results.conversations += 1
  results.total_score += score
  results.avg_score = results.conversations > 0
    ? Math.round((results.total_score / results.conversations) * 10) / 10
    : 0

  await supabase.from('ab_test_variants')
    .update({ results })
    .eq('id', variantId)
}

export async function checkTestCompletion(test: ABTest): Promise<boolean> {
  const allHaveSamples = test.variants.every(v => v.results.conversations >= test.min_sample_size)
  if (!allHaveSamples || test.variants.length < 2) return false

  const sorted = [...test.variants].sort((a, b) => b.results.avg_score - a.results.avg_score)
  const winner = sorted[0]

  const response = await openai.chat.completions.create({
    model: getModel('simple'),
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Analyze this A/B test result and determine if the winner is statistically significant.

Test: ${test.name}
Agent: ${test.agent_type}
Metric: ${test.metric}
Variants:
${test.variants.map(v => `${v.label}: avg=${v.results.avg_score}, conversations=${v.results.conversations}`).join('\n')}

Winner: ${winner.label} (${winner.results.avg_score})

Is this conclusive? Reply with just "yes" or "no" and a brief reason.`
    }]
  })

  const analysis = response.choices[0]?.message?.content || ''
  const isConclusive = analysis.toLowerCase().startsWith('yes')

  if (isConclusive) {
    await supabase.from('ab_tests').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      winner: winner.label,
    }).eq('id', test.id)
  }

  return isConclusive
}
